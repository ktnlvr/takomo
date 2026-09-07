import * as THREE from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { chromeMaterial, tungstenMaterial } from "./brand";

/**
 * Metaballs orbiting a centerpiece. They circle in a band outside the model
 * so they never pass through it, and instead of getting clipped at the frame
 * edge their field strength fades with distance, so the surface melts away.
 */
export function makeMetaballs(size = 4.2, resolution = 44) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xd8dee9,
    metalness: 1,
    roughness: 0.14,
    envMapIntensity: 1.3,
    clearcoat: 0.4,
    clearcoatRoughness: 0.25,
  });
  const mc = new MarchingCubes(resolution, mat, false, false, 30000);
  mc.scale.setScalar(size / 2);
  mc.isolation = 70;

  // orbit band, in field coordinates (0..1, center 0.5):
  // the centerpiece owns r < 0.30, the field dies past ~0.46
  const R_MIN = 0.32;
  const R_MAX = 0.44;

  const balls = Array.from({ length: 6 }, (_, i) => ({
    phase: (i / 6) * Math.PI * 2,
    speed: (i % 2 ? 1 : -1) * (0.22 + (i % 3) * 0.07),
    incl: (i / 6) * Math.PI, // each ball on its own orbital plane
    breathe: 0.5 + (i % 3) * 0.3,
  }));

  const axis = new THREE.Vector3();
  const pos = new THREE.Vector3();

  const update = (t: number) => {
    mc.reset();
    for (const b of balls) {
      const a = t * b.speed + b.phase;
      // radius breathes across the band and occasionally past its outer edge
      const r = THREE.MathUtils.lerp(R_MIN, R_MAX, 0.5 + 0.5 * Math.sin(t * b.breathe + b.phase)) +
        0.05 * Math.sin(t * 0.3 + b.phase * 2);
      // circular orbit tilted by the ball's inclination
      pos.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      axis.set(Math.sin(b.incl), Math.cos(b.incl), 0).normalize();
      pos.applyAxisAngle(axis, b.incl);
      const x = 0.5 + pos.x;
      const y = 0.5 + pos.y * 0.8;
      const z = 0.5 + pos.z * 0.7;
      const d = Math.hypot(x - 0.5, y - 0.5, z - 0.5);
      // full strength inside the band, melts to nothing past it
      const fade = THREE.MathUtils.clamp(1 - (d - R_MAX) / 0.08, 0.05, 1);
      mc.addBall(x, y, z, 0.3 * fade, 14);
    }
    mc.update();
  };

  return { obj: mc as unknown as THREE.Object3D, update, material: mat };
}

/** Chrome dev board — a Kria/Nexys-style FPGA board rendered as pure metal. */
export function makeDevBoard() {
  const g = new THREE.Group();
  const dark = new THREE.MeshPhysicalMaterial({
    color: 0x2a2a30,
    metalness: 0.95,
    roughness: 0.35,
    envMapIntensity: 0.9,
  });
  const chrome = chromeMaterial();
  const cherry = new THREE.MeshPhysicalMaterial({
    color: 0x8c1533,
    metalness: 0.9,
    roughness: 0.25,
    envMapIntensity: 1.1,
  });

  // PCB
  const pcb = new THREE.Mesh(new RoundedBoxGeometry(3.4, 0.12, 2.3, 3, 0.05), dark);
  g.add(pcb);

  // main SoC with heatsink fins
  const soc = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.14, 1.0, 3, 0.03), chrome);
  soc.position.set(-0.35, 0.13, -0.1);
  g.add(soc);
  for (let i = 0; i < 7; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.05), chrome);
    fin.position.set(-0.35, 0.3, -0.52 + i * 0.14);
    g.add(fin);
  }
  // fan ring on the heatsink (the Kria giveaway)
  const fan = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 12, 40), cherry);
  fan.rotation.x = Math.PI / 2;
  fan.position.set(-0.35, 0.44, -0.1);
  g.add(fan);
  const blades = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.09), chrome);
    blade.position.x = 0.15;
    const holder = new THREE.Group();
    holder.rotation.y = (i / 5) * Math.PI * 2;
    holder.add(blade);
    blades.add(holder);
  }
  blades.position.set(-0.35, 0.44, -0.1);
  g.add(blades);

  // seven-segment display row (the Nexys giveaway)
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.3), cherry);
    seg.position.set(0.55 + i * 0.28, 0.1, 0.75);
    g.add(seg);
  }
  // buttons
  for (let i = 0; i < 5; i++) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.08, 20), chrome);
    btn.position.set(0.5 + i * 0.22, 0.1, 0.4);
    g.add(btn);
  }
  // pin headers along the back edge
  for (let i = 0; i < 16; i++) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8), chrome);
    pin.position.set(-1.5 + i * 0.2, 0.16, -1.0);
    g.add(pin);
  }
  // ports on the left edge
  const eth = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.34), chrome);
  eth.position.set(-1.58, 0.19, 0.55);
  g.add(eth);
  const usb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.24), chrome);
  usb.position.set(-1.56, 0.14, 0.05);
  g.add(usb);
  // small passives sprinkled on
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.04, 0.11),
      i % 3 ? chrome : cherry
    );
    c.position.set(-1.2 + (i % 7) * 0.38, 0.09, 0.1 + Math.floor(i / 7) * 0.35 - 0.55);
    c.rotation.y = (i % 2) * Math.PI * 0.5;
    g.add(c);
  }

  const update = (t: number) => {
    blades.rotation.y = t * 6;
  };
  return { obj: g, update };
}

/** Wrecked statue: a toppled classical column with rubble. */
export function makeRuin() {
  const g = new THREE.Group();
  const stone = new THREE.MeshPhysicalMaterial({
    color: 0xcfd3da,
    metalness: 0.75,
    roughness: 0.45,
    envMapIntensity: 0.9,
  });

  const flutedDrum = (rTop: number, rBot: number, h: number, jagged: boolean) => {
    const geo = new THREE.CylinderGeometry(rTop, rBot, h, 48, jagged ? 4 : 1);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const a = Math.atan2(v.z, v.x);
      // fluting
      const r = Math.hypot(v.x, v.z);
      if (r > 0.01) {
        const flute = 1 + 0.035 * Math.sin(a * 18);
        v.x *= flute;
        v.z *= flute;
      }
      // jagged broken top
      if (jagged && v.y > h * 0.32) {
        v.y += (Math.sin(a * 5) * 0.5 + Math.sin(a * 13 + 2)) * 0.12;
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  };

  // pedestal
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.35, 1.7, 2, 0.05), stone);
  base.position.y = -1.35;
  g.add(base);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.22, 48), stone);
  plinth.position.y = -1.1;
  g.add(plinth);

  // standing broken shaft
  const shaft = new THREE.Mesh(flutedDrum(0.5, 0.56, 1.7, true), stone);
  shaft.position.y = -0.15;
  shaft.rotation.z = 0.04;
  g.add(shaft);

  // toppled drums beside it
  const d1 = new THREE.Mesh(flutedDrum(0.48, 0.48, 0.8, false), stone);
  d1.rotation.set(Math.PI / 2, 0, 0.5);
  d1.position.set(1.25, -1.28, 0.35);
  g.add(d1);
  const d2 = new THREE.Mesh(flutedDrum(0.45, 0.45, 0.6, true), stone);
  d2.rotation.set(Math.PI / 2.2, 0.3, 1.9);
  d2.position.set(1.0, -1.3, -0.75);
  g.add(d2);

  // rubble
  for (let i = 0; i < 9; i++) {
    const chunk = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.1 + (i % 4) * 0.05, 0),
      stone
    );
    const a = (i / 9) * Math.PI * 2;
    chunk.position.set(Math.cos(a) * (0.9 + (i % 3) * 0.3), -1.42, Math.sin(a) * (0.9 + (i % 2) * 0.4));
    chunk.rotation.set(i, i * 2, i * 0.5);
    g.add(chunk);
  }

  g.position.y = 0.55;
  return { obj: g, update: undefined as ((t: number) => void) | undefined };
}

/** The flywheel: rim, spokes, hub — always turning. */
export function makeFlywheel() {
  const g = new THREE.Group();
  const chrome = chromeMaterial();
  const dark = tungstenMaterial();

  const wheel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.2, 20, 72), chrome);
  wheel.add(rim);
  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.35, 14), dark);
    spoke.position.y = 0.7;
    const holder = new THREE.Group();
    holder.rotation.z = (i / 6) * Math.PI * 2;
    holder.add(spoke);
    wheel.add(holder);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.34, 24), chrome);
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);
  // a hex nut as the axle nut — the brand rides the wheel
  const nutShapePts: THREE.Vector2[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    nutShapePts.push(new THREE.Vector2(Math.cos(a) * 0.18, Math.sin(a) * 0.18));
  }
  const nutShape = new THREE.Shape(nutShapePts);
  const nut = new THREE.Mesh(
    new THREE.ExtrudeGeometry(nutShape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }),
    dark
  );
  nut.position.z = 0.18;
  wheel.add(nut);
  g.add(wheel);

  // beads circulating around the rim: what goes around comes around
  const beads: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 18), chrome);
    g.add(bead);
    beads.push(bead);
  }

  const update = (t: number) => {
    wheel.rotation.z = -t * 0.7;
    beads.forEach((b, i) => {
      const a = t * 0.7 + (i / beads.length) * Math.PI * 2;
      b.position.set(Math.cos(a) * 1.45, Math.sin(a) * 1.45, 0.22 * Math.sin(t + i));
    });
  };
  return { obj: g, update };
}

/**
 * BMK5 from the outside: the long east bar (ours, lit cherry),
 * the west wing, and the choke connector between them.
 */
export function makeBuildingExterior() {
  const g = new THREE.Group();
  const shell = new THREE.MeshPhysicalMaterial({
    color: 0x574049,
    metalness: 0.4,
    roughness: 0.55,
  });
  const ours = new THREE.MeshPhysicalMaterial({
    color: 0x8c1533,
    metalness: 0.6,
    roughness: 0.35,
    emissive: 0x5c0f26,
    emissiveIntensity: 0.4,
  });
  const glassStrip = new THREE.MeshBasicMaterial({ color: 0xf0d9e2 });

  const addMass = (
    w: number, h: number, d: number, x: number, y: number, z: number,
    mat: THREE.Material
  ) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    g.add(m);
    const e = new THREE.LineSegments(
      new THREE.EdgesGeometry(m.geometry),
      new THREE.LineBasicMaterial({ color: 0xe8bcc9, transparent: true, opacity: 0.35 })
    );
    e.position.copy(m.position);
    g.add(e);
    // window strips on the long facades
    for (const s of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.1, 0.02), glassStrip);
      strip.position.set(x, y + h * 0.16, z + s * (d / 2 + 0.011));
      g.add(strip);
    }
    return m;
  };

  // west wing (not ours): an L of two masses, two storeys
  addMass(3.4, 1.5, 2.4, -4.6, 0.75, 0.4, shell);
  addMass(2.0, 1.5, 3.6, -5.3, 0.75, 1.6, shell);
  // choke connector
  addMass(1.1, 0.8, 1.3, -2.75, 0.4, 0, shell);
  // east bar — TAKOMO's wing, taller hall mass + long bar
  addMass(6.6, 1.15, 2.1, 1.1, 0.575, 0, ours);
  addMass(2.6, 1.7, 2.1, -0.7, 0.85, 0, ours); // the tall hardware hall end
  // ground
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x1a0d13, roughness: 0.95 })
  );
  ground.position.y = -0.06;
  g.add(ground);

  return { obj: g, update: undefined as ((t: number) => void) | undefined };
}
