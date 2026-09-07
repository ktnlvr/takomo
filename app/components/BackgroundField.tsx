"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeEnvironment, makeHexNut, makeBolt, chromeMaterial } from "./brand";

const COUNT = 14;

/**
 * Blurred nuts and bolts drifting behind the whole page. Rendered at a low
 * pixel ratio (the CSS blur hides it) and parallaxed against scroll; each
 * piece's spin rate follows how fast it is moving across the screen.
 */
export default function BackgroundField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

    const chrome = chromeMaterial();
    interface Piece {
      obj: THREE.Object3D;
      depth: number; // parallax factor, deeper moves less
      baseX: number;
      baseY: number;
      drift: number;
      spin: number;
      lastY: number;
      axis: THREE.Vector3;
    }
    const pieces: Piece[] = [];
    const WRAP = 26; // vertical world range pieces wrap around in

    for (let i = 0; i < COUNT; i++) {
      const obj = i % 2 ? makeHexNut(0.5 + (i % 3) * 0.22, chrome) : makeBolt(0.32 + (i % 3) * 0.13, chrome);
      const depth = 0.25 + (i / COUNT) * 0.65;
      obj.position.z = -3 - depth * 9;
      scene.add(obj);
      pieces.push({
        obj,
        depth,
        baseX: (Math.random() - 0.5) * 2, // fraction of the visible width
        baseY: Math.random() * WRAP,
        drift: (Math.random() - 0.5) * 0.15,
        spin: 0,
        lastY: 0,
        axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      });
    }

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
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

      pieces.forEach((p, i) => {
        // parallax: near pieces track scroll harder than deep ones
        const y =
          ((p.baseY + scroll * 0.004 * (1.2 - p.depth) + t * 0.15 * p.depth) % WRAP + WRAP) % WRAP -
          WRAP / 2;
        const dist = camera.position.z - p.obj.position.z;
        const halfW = Math.tan(THREE.MathUtils.degToRad(22.5)) * dist * camera.aspect;
        p.obj.position.x = p.baseX * halfW + Math.sin(t * 0.1 + i) * p.drift * halfW;
        p.obj.position.y = y;

        // spin follows movement across the screen
        const vel = Math.abs(y - p.lastY);
        p.lastY = y;
        p.spin = THREE.MathUtils.lerp(p.spin, Math.min(vel * 6, 0.25), 0.08);
        q.setFromAxisAngle(p.axis, p.spin + 0.002);
        p.obj.quaternion.premultiply(q);
      });

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
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
