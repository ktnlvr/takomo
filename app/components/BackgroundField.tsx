"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
import { makeEnvironment, makeHexNut, makeBolt, chromeMaterial } from "./brand";

const COUNT = 14;

// fluid: a velocity grid stirred by roving ambient sources and by the
// cursor (no special treatment - it is just another stirrer). The field is
// rendered by local pressure: converging flow glows cherry, diverging flow
// cools cyan, which makes the vortices themselves visible
const GW = 192;
const GH = 108;

/**
 * Blurred nuts and bolts drifting behind the whole page. Rendered at a low
 * pixel ratio (the CSS blur hides it) and parallaxed against scroll. An
 * invisible fluid field guides their motion: moving the cursor injects
 * velocity into the field, and the pieces visibly shift direction with the
 * current. Spin rate follows how fast a piece moves across the screen.
 */
export default function BackgroundField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // no cursor on touch screens, and the sim is the priciest part of this
    // layer — keep only the drifting pieces and metaballs on mobile
    const fluidOn =
      window.innerWidth >= 700 && window.matchMedia("(pointer: fine)").matches;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    renderer.setPixelRatio(0.45);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const scene = new THREE.Scene();
    const env = makeEnvironment(renderer);
    scene.environment = env;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
    camera.position.z = 10;

    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(4, 6, 5);
    scene.add(key);
    scene.add(new THREE.AmbientLight(0x1c222c, 0.6));

    // ── fluid grid ──────────────────────────────────
    let vx = new Float32Array(GW * GH);
    let vy = new Float32Array(GW * GH);
    let tvx = new Float32Array(GW * GH);
    let tvy = new Float32Array(GW * GH);
    // temporally + spatially smoothed pressure, for calm rendering
    const press = new Float32Array(GW * GH);

    const stepFluid = () => {
      // one cheap diffusion pass + dissipation (no pressure solve; drift
      // and the ink trace are all that matter visually)
      for (let j = 0; j < GH; j++) {
        for (let i = 0; i < GW; i++) {
          const idx = j * GW + i;
          const l = j * GW + Math.max(i - 1, 0);
          const r = j * GW + Math.min(i + 1, GW - 1);
          const u = Math.max(j - 1, 0) * GW + i;
          const d = Math.min(j + 1, GH - 1) * GW + i;
          tvx[idx] = (vx[idx] * 4 + vx[l] + vx[r] + vx[u] + vx[d]) * 0.125 * 0.988;
          tvy[idx] = (vy[idx] * 4 + vy[l] + vy[r] + vy[u] + vy[d]) * 0.125 * 0.988;
        }
      }
      [vx, tvx] = [tvx, vx];
      [vy, tvy] = [tvy, vy];
    };

    const splat = (fx: number, fy: number, dx: number, dy: number) => {
      const cx = fx * GW;
      const cy = fy * GH;
      const R = 14;
      for (let j = Math.max(0, Math.floor(cy - R)); j < Math.min(GH, cy + R); j++) {
        for (let i = Math.max(0, Math.floor(cx - R)); i < Math.min(GW, cx + R); i++) {
          const fall = Math.exp(-((i - cx) ** 2 + (j - cy) ** 2) / (R * 4.5));
          const idx = j * GW + i;
          vx[idx] += dx * fall;
          vy[idx] += dy * fall;
        }
      }
    };

    // roving ambient stirrers keep vortices alive with no cursor around;
    // each pushes tangentially along its slow orbit
    const stirrers = Array.from({ length: 3 }, (_, i) => ({
      phase: (i / 3) * Math.PI * 2,
      speed: (i % 2 ? 1 : -1) * (0.05 + i * 0.02),
      rx: 0.3 + i * 0.06,
      ry: 0.28 - i * 0.05,
    }));
    const stir = (t: number) => {
      for (const st of stirrers) {
        const a = t * st.speed + st.phase;
        const x = 0.5 + Math.cos(a) * st.rx;
        const y = 0.5 + Math.sin(a) * st.ry;
        splat(x, y, -Math.sin(a) * st.speed * 0.55, Math.cos(a) * st.speed * 0.55);
      }
    };

    const sample = (fx: number, fy: number) => {
      const i = THREE.MathUtils.clamp(Math.round(fx * GW), 0, GW - 1);
      const j = THREE.MathUtils.clamp(Math.round(fy * GH), 0, GH - 1);
      const idx = j * GW + i;
      return [vx[idx], vy[idx]];
    };

    let lastMX = -1;
    let lastMY = -1;
    // the sim pauses while the BMK5 tour is on screen so nothing competes
    // with the floor plan's own camera work
    let fluidPaused = false;
    let spaceEl: HTMLElement | null = null;
    const onPointer = (e: PointerEvent) => {
      const fx = e.clientX / window.innerWidth;
      const fy = e.clientY / window.innerHeight;
      if (lastMX >= 0 && !fluidPaused) {
        splat(fx, fy, (fx - lastMX) * 11, (fy - lastMY) * 11);
      }
      lastMX = fx;
      lastMY = fy;
    };
    if (fluidOn) window.addEventListener("pointermove", onPointer, { passive: true });

    // ── pieces ──────────────────────────────────────
    const chrome = chromeMaterial();
    interface Piece {
      obj: THREE.Object3D;
      depth: number;
      baseX: number;
      baseY: number;
      drift: number;
      spin: number;
      lastX: number;
      lastY: number;
      flowX: number;
      flowY: number;
      axis: THREE.Vector3;
    }
    const pieces: Piece[] = [];
    const WRAP = 26;

    for (let i = 0; i < COUNT; i++) {
      const obj =
        i % 2 ? makeHexNut(0.5 + (i % 3) * 0.22, chrome) : makeBolt(0.32 + (i % 3) * 0.13, chrome);
      const depth = 0.25 + (i / COUNT) * 0.65;
      obj.position.z = -3 - depth * 9;
      scene.add(obj);
      pieces.push({
        obj,
        depth,
        baseX: (Math.random() - 0.5) * 2,
        baseY: Math.random() * WRAP,
        drift: (Math.random() - 0.5) * 0.15,
        spin: 0,
        lastX: 0,
        lastY: 0,
        flowX: 0,
        flowY: 0,
        axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      });
    }

    // floating metaballs drifting among the pieces, merging as they meet
    const META_SIZE = 16;
    const mc = new MarchingCubes(28, chromeMaterial(0xc8d2e2), false, false, 20000);
    mc.scale.setScalar(META_SIZE / 2);
    mc.position.z = -8;
    mc.isolation = 60;
    scene.add(mc);
    const blobs = Array.from({ length: 7 }, (_, i) => ({
      phase: (i / 7) * Math.PI * 2,
      speed: (i % 2 ? 1 : -1) * (0.05 + (i % 3) * 0.03),
      rx: 0.18 + (i % 4) * 0.07,
      ry: 0.1 + ((i + 1) % 3) * 0.08,
      strength: 0.1 + (i % 3) * 0.05,
    }));

    // the ink layer: cherry-to-cyan where the fluid moves, in front of the pieces
    const inkData = new Uint8Array(GW * GH * 4);
    const inkTex = new THREE.DataTexture(inkData, GW, GH, THREE.RGBAFormat);
    inkTex.magFilter = THREE.LinearFilter;
    inkTex.minFilter = THREE.LinearFilter;
    const ink = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: inkTex, transparent: true, depthWrite: false })
    );
    ink.position.z = -1;
    if (fluidOn) scene.add(ink);

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      const dist = camera.position.z - ink.position.z;
      const h = 2 * Math.tan(THREE.MathUtils.degToRad(22.5)) * dist;
      ink.scale.set(h * camera.aspect, h, 1);
    };
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let raf = 0;
    const q = new THREE.Quaternion();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      const scroll = window.scrollY;
      if (!spaceEl) spaceEl = document.getElementById("space");
      if (spaceEl) {
        const r = spaceEl.getBoundingClientRect();
        fluidPaused = r.top < window.innerHeight && r.bottom > 0;
      }
      ink.visible = fluidOn && !fluidPaused;
      if (fluidOn && !fluidPaused) {
        stir(t);
        stepFluid();
        // paint the field by local pressure: converging flow (high pressure)
        // warms toward cherry, diverging (low) cools toward cyan. The raw
        // divergence is eased into a persistent field and averaged with its
        // neighbours, so the picture drifts smoothly instead of flickering
        for (let j = 0; j < GH; j++) {
          const jn = Math.max(j - 1, 0) * GW;
          const js = Math.min(j + 1, GH - 1) * GW;
          for (let i = 0; i < GW; i++) {
            const il = Math.max(i - 1, 0);
            const ir = Math.min(i + 1, GW - 1);
            const div =
              (vx[j * GW + ir] - vx[j * GW + il] + vy[js + i] - vy[jn + i]) * 0.5;
            const idx = j * GW + i;
            press[idx] += (-div * 170 - press[idx]) * 0.06;
          }
        }
        for (let j = 0; j < GH; j++) {
          const row = (GH - 1 - j) * GW;
          const jn = Math.max(j - 1, 0) * GW;
          const js = Math.min(j + 1, GH - 1) * GW;
          for (let i = 0; i < GW; i++) {
            const idx = j * GW + i;
            const p =
              (press[idx] * 2 +
                press[j * GW + Math.max(i - 1, 0)] +
                press[j * GW + Math.min(i + 1, GW - 1)] +
                press[jn + i] +
                press[js + i]) /
              6;
            const o = (row + i) * 4;
            // soft ramp: fades in gently around zero, saturates slowly
            const mag = Math.min(p * p * 2.2, 1);
            if (mag > 0.01) {
              if (p > 0) {
                inkData[o] = 198;
                inkData[o + 1] = 42;
                inkData[o + 2] = 85;
              } else {
                inkData[o] = 143;
                inkData[o + 1] = 232;
                inkData[o + 2] = 224;
              }
              inkData[o + 3] = mag * 105;
            } else {
              inkData[o + 3] = 0;
            }
          }
        }
        inkTex.needsUpdate = true;
      }

      // metaballs wander on slow independent orbits and merge where they
      // overlap; scroll drifts the whole cloud slightly for parallax
      mc.reset();
      const my = (scroll * 0.0003) % 1;
      for (const b of blobs) {
        const a = t * b.speed + b.phase;
        mc.addBall(
          0.5 + Math.cos(a) * b.rx + 0.06 * Math.sin(t * 0.23 + b.phase * 3),
          ((0.5 + Math.sin(a * 1.3 + b.phase) * b.ry + my) % 1 + 1) % 1,
          0.5 + Math.sin(a * 0.7) * 0.12,
          b.strength,
          12
        );
      }
      mc.update();

      pieces.forEach((p, i) => {
        const dist = camera.position.z - p.obj.position.z;
        const halfW = Math.tan(THREE.MathUtils.degToRad(22.5)) * dist * camera.aspect;
        const halfH = halfW / camera.aspect;

        // parallax: near pieces track scroll harder than deep ones
        const wrapY =
          ((p.baseY + scroll * 0.004 * (1.2 - p.depth) + t * 0.15 * p.depth) % WRAP + WRAP) %
            WRAP -
          WRAP / 2;
        const restX = p.baseX * halfW + Math.sin(t * 0.1 + i) * p.drift * halfW;

        // sample the fluid at this piece's screen position and ride it;
        // near pieces feel the current more than deep ones
        const sx = THREE.MathUtils.clamp(p.obj.position.x / halfW / 2 + 0.5, 0, 1);
        const sy = THREE.MathUtils.clamp(0.5 - p.obj.position.y / halfH / 2, 0, 1);
        const [fx, fy] = fluidOn ? sample(sx, sy) : [0, 0];
        const feel = (1.3 - p.depth) * 0.05 * dist;
        p.flowX = p.flowX * 0.95 + fx * feel;
        p.flowY = p.flowY * 0.95 - fy * feel;

        const x = restX + p.flowX;
        const y = wrapY + p.flowY;
        p.obj.position.x = x;
        p.obj.position.y = y;

        // spin follows total movement across the screen
        const vel = Math.hypot(x - p.lastX, y - p.lastY);
        p.lastX = x;
        p.lastY = y;
        p.spin = THREE.MathUtils.lerp(p.spin, Math.min(vel * 6, 0.3), 0.08);
        q.setFromAxisAngle(p.axis, p.spin + 0.002);
        p.obj.quaternion.premultiply(q);
      });

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose());
        }
      });
      env.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="bg-field" aria-hidden>
      <canvas ref={canvasRef} />
    </div>
  );
}
