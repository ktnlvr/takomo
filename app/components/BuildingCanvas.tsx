"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeEnvironment } from "./brand";
import { makeBuildingExterior } from "./sceneModels";

/** BMK5 from the outside — a slow turntable of the whole building. */
export default function BuildingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const scene = new THREE.Scene();
    const env = makeEnvironment(renderer);
    scene.environment = env;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    const key = new THREE.DirectionalLight(0xfff2e8, 1.3);
    key.position.set(6, 9, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xcfdcec, 1.2);
    rim.position.set(-7, 3, -5);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0x2a323e, 0.8));

    const { obj } = makeBuildingExterior();
    scene.add(obj);

    const resize = () => {
      const parent = canvas.parentElement!;
      renderer.setSize(parent.clientWidth, parent.clientHeight, false);
      camera.aspect = parent.clientWidth / parent.clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      const a = t * 0.12;
      camera.position.set(Math.sin(a) * 9.5, 4.6 + Math.sin(t * 0.3) * 0.3, Math.cos(a) * 9.5);
      camera.lookAt(-1, 0.5, 0);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose());
        }
      });
      env.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden />;
}
