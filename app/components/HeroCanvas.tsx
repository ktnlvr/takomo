"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const COUNT = 4200;

/**
 * Sample a point inside the union of boxes that silhouette an anvil.
 * "From atoms to impact": a cloud of loose atoms assembles into the forge's anvil.
 */
function sampleAnvil(out: THREE.Vector3) {
  // pick a part weighted by rough volume
  const r = Math.random();
  if (r < 0.3) {
    // base
    out.set(rand(-1.15, 1.15), rand(-1.45, -0.95), rand(-0.72, 0.72));
  } else if (r < 0.45) {
    // waist
    out.set(rand(-0.48, 0.48), rand(-0.95, -0.1), rand(-0.42, 0.42));
  } else if (r < 0.85) {
    // body/top
    out.set(rand(-1.55, 1.55), rand(-0.1, 0.62), rand(-0.55, 0.55));
  } else {
    // horn, tapering toward +x
    const t = Math.random();
    const s = 1 - t * 0.82;
    out.set(1.55 + t * 1.5, 0.08 + rand(-0.28, 0.28) * s + t * 0.12, rand(-0.4, 0.4) * s);
  }
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0.3, 7.5);

    // per-particle: scattered start, anvil target, delay
    const starts = new Float32Array(COUNT * 3);
    const targets = new Float32Array(COUNT * 3);
    const positions = new Float32Array(COUNT * 3);
    const delays = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);

    const v = new THREE.Vector3();
    const cA = new THREE.Color("#3b6ef6");
    const cB = new THREE.Color("#b7c8ff");
    const cC = new THREE.Color("#7e57ff");

    for (let i = 0; i < COUNT; i++) {
      // scattered cloud (sphere shell-ish)
      v.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(2.5, 9));
      starts.set([v.x, v.y, v.z], i * 3);
      positions.set([v.x, v.y, v.z], i * 3);

      sampleAnvil(v);
      targets.set([v.x, v.y, v.z], i * 3);
      delays[i] = Math.random() * 1.6;

      const mix = Math.random();
      const c = mix < 0.12 ? cC : cA.clone().lerp(cB, Math.pow(Math.random(), 2));
      colors.set([c.r, c.g, c.b], i * 3);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.028,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    const group = new THREE.Group();
    group.add(points);
    scene.add(group);

    // sparks rising from the anvil face
    const SPARKS = 220;
    const sparkPos = new Float32Array(SPARKS * 3);
    const sparkSeed = new Float32Array(SPARKS);
    for (let i = 0; i < SPARKS; i++) {
      sparkPos.set([rand(-1.4, 1.4), rand(0.6, 3.2), rand(-0.5, 0.5)], i * 3);
      sparkSeed[i] = Math.random();
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      size: 0.02,
      color: new THREE.Color("#9db4ff"),
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    group.add(sparks);

    let mouseX = 0;
    let mouseY = 0;
    const onMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMouse);

    const resize = () => {
      const parent = canvas.parentElement!;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      const pos = geo.attributes.position.array as Float32Array;

      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;
        // 0 → 1 assembly with per-particle delay, then a slow breath
        const p = easeOut(THREE.MathUtils.clamp((t - 0.4 - delays[i]) / 2.4, 0, 1));
        const wob = 0.03 * Math.sin(t * 1.4 + i);
        pos[i3] = THREE.MathUtils.lerp(starts[i3], targets[i3], p) + wob * (1 - p * 0.7);
        pos[i3 + 1] =
          THREE.MathUtils.lerp(starts[i3 + 1], targets[i3 + 1], p) +
          0.03 * Math.sin(t * 1.1 + i * 1.7) * (1 - p * 0.7);
        pos[i3 + 2] = THREE.MathUtils.lerp(starts[i3 + 2], targets[i3 + 2], p);
      }
      geo.attributes.position.needsUpdate = true;

      // sparks drift upward and loop
      const sp = sparkGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < SPARKS; i++) {
        const i3 = i * 3;
        sp[i3 + 1] += 0.004 + sparkSeed[i] * 0.006;
        sp[i3] += Math.sin(t * 2 + sparkSeed[i] * 20) * 0.0015;
        if (sp[i3 + 1] > 3.4) sp[i3 + 1] = 0.55;
      }
      sparkGeo.attributes.position.needsUpdate = true;

      group.rotation.y = t * 0.12 + mouseX * 0.35;
      group.rotation.x = mouseY * 0.15;
      group.position.y = 0.2;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", resize);
      geo.dispose();
      sparkGeo.dispose();
      mat.dispose();
      sparkMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden />;
}
