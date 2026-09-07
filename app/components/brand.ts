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

export function chromeMaterial(color = 0xd6ddec) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 1,
    roughness: 0.12,
    envMapIntensity: 1.5,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
  });
}

export function tungstenMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x878d99,
    metalness: 1,
    roughness: 0.32,
    envMapIntensity: 1.1,
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
    new THREE.CylinderGeometry(size * 0.44, size * 0.44, size * 2.1, 28),
    m
  );
  g.add(shaft);
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(size * 0.44, size * 0.035, 8, 32),
      m
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -size * (0.15 + i * 0.17);
    g.add(ring);
  }
  return g;
}

/** Tungsten cube: dense, dark, unreasonably satisfying. Beveled so it reads soft. */
export function makeTungstenCube(size = 1, mat?: THREE.Material) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(size, size, size, 4, size * 0.12),
    mat ?? tungstenMaterial()
  );
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
