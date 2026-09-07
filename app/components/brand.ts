import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Shared shiny environment so brand metals actually reflect something. */
export function makeEnvironment(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return env;
}

// solidified tin: metallic but matte, soft wide highlights, no mirror gloss
export function chromeMaterial(color = 0xb8bfc9) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 1,
    roughness: 0.42,
    envMapIntensity: 1.1,
    clearcoat: 0.15,
    clearcoatRoughness: 0.5,
  });
}

export function tungstenMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x8b93a0,
    metalness: 1,
    roughness: 0.48,
    envMapIntensity: 1.0,
  });
}

/** Hex nut: hexagonal extrusion with a threaded-looking hole. */
export function makeHexNut(size = 1, mat?: THREE.Material) {
  const R = size;
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * R;
    const y = Math.sin(a) * R;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, R * 0.48, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  let geo: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: R * 0.42,
    bevelEnabled: true,
    bevelThickness: R * 0.1,
    bevelSize: R * 0.09,
    bevelSegments: 7,
    curveSegments: 64,
  });
  geo.center();
  // weld + smooth so the bore and bevels read soft, not faceted
  geo = mergeVertices(geo, 1e-4);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat ?? chromeMaterial());
  mesh.rotation.x = Math.PI / 2;
  const g = new THREE.Group();
  g.add(mesh);
  return g;
}

/** Bolt: hex head + shaft with thread rings. */
export function makeBolt(size = 1, mat?: THREE.Material) {
  const m = mat ?? chromeMaterial();
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.CylinderGeometry(size, size, size * 0.55, 6), m);
  head.position.y = size * 1.25;
  g.add(head);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(size * 0.44, size * 0.44, size * 2.1, 48),
    m
  );
  g.add(shaft);
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(size * 0.44, size * 0.035, 14, 48),
      m
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -size * (0.15 + i * 0.17);
    g.add(ring);
  }
  return g;
}

// dodecahedron face normals = icosahedron vertex directions
const PHI = (1 + Math.sqrt(5)) / 2;
const DODECA_NORMALS: THREE.Vector3[] = [];
for (const [a, b] of [
  [1, PHI],
  [-1, PHI],
  [1, -PHI],
  [-1, -PHI],
]) {
  DODECA_NORMALS.push(
    new THREE.Vector3(a, b, 0).normalize(),
    new THREE.Vector3(0, a, b).normalize(),
    new THREE.Vector3(b, 0, a).normalize()
  );
}

/**
 * The tungsten piece: a dodecahedron filleted the way CAD chamfers a cube —
 * large flat faces kept intact, edges and corners rolled with a constant
 * radius. Surface = the plane-intersection solid inset by r, offset back
 * out by r; each icosphere vertex is raycast onto that surface.
 */
export function makeTungstenCube(size = 1, mat?: THREE.Material) {
  const h = size * 0.52; // face-plane distance of the inset solid
  const r = size * 0.11; // fillet radius
  const geo = new THREE.IcosahedronGeometry(1, 6);
  const posAttr = geo.attributes.position;
  const v = new THREE.Vector3();

  // signed distance to the rounded solid: distance to the inset
  // polyhedron's exterior, minus the fillet radius
  const sdf = (p: THREE.Vector3) => {
    let inside = -Infinity;
    let outSq = 0;
    for (const n of DODECA_NORMALS) {
      const d = p.dot(n) - h;
      if (d > 0) outSq += d * d;
      else inside = Math.max(inside, d);
    }
    return (outSq > 0 ? Math.sqrt(outSq) : inside) - r;
  };

  for (let i = 0; i < posAttr.count; i++) {
    v.fromBufferAttribute(posAttr, i).normalize();
    // bisect along the ray from the origin for the surface crossing
    let lo = 0;
    let hi = h + r * 2;
    for (let k = 0; k < 24; k++) {
      const mid = (lo + hi) / 2;
      if (sdf(v.clone().multiplyScalar(mid)) < 0) lo = mid;
      else hi = mid;
    }
    const t = (lo + hi) / 2;
    posAttr.setXYZ(i, v.x * t, v.y * t, v.z * t);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat ?? tungstenMaterial());
  const g = new THREE.Group();
  g.add(mesh);
  return g;
}

/** Liquid metal blob: displaced seamless icosphere, call update(t) each frame. */
export function makeLiquidBlob(radius = 1, detail = 40, mat?: THREE.Material) {
  // icosphere welded shut — no UV seam to split open when the surface ripples
  const geo = mergeVertices(
    new THREE.IcosahedronGeometry(radius, Math.max(4, Math.round(detail / 8))),
    1e-4
  );
  const base = (geo.attributes.position.array as Float32Array).slice();
  const mesh = new THREE.Mesh(geo, mat ?? chromeMaterial(0xc7d0e6));
  const v = new THREE.Vector3();
  const update = (t: number) => {
    const pos = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      v.set(base[i], base[i + 1], base[i + 2]);
      const n =
        0.10 * Math.sin(v.x * 2.1 + t * 1.1) * Math.sin(v.y * 2.7 + t * 0.9) +
        0.06 * Math.sin(v.y * 4.2 - t * 1.4 + v.z * 3.1) +
        0.04 * Math.sin(v.z * 5.5 + t * 1.9);
      const s = 1 + n;
      pos[i] = base[i] * s;
      pos[i + 1] = base[i + 1] * s;
      pos[i + 2] = base[i + 2] * s;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  };
  return { mesh, update };
}

/** "?" marker sprite for unassigned rooms. */
export function makeQuestionSprite(scale = 1) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.font = "bold 96px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(110,143,255,0.9)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#c7d4ff";
  ctx.fillText("?", 64, 70);
  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  sprite.scale.setScalar(scale);
  const g = new THREE.Group();
  g.add(sprite);
  return g;
}
