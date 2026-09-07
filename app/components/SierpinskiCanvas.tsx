"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeEnvironment, chromeMaterial } from "./brand";

const DEPTH = 4; // 4^4 = 256 tetrahedra

/** Sierpinski pyramid: recursive tetrahedra, slowly turning. */
export default function SierpinskiCanvas() {
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

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0.6, 7);
    camera.lookAt(0, 0, 0);

    const key = new THREE.DirectionalLight(0xffffff, 1.3);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfe8f5, 1.8);
    rim.position.set(-6, -2, -3);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0x1c222c, 0.6));

    // recurse: each tetrahedron splits into four at its corners
    const dirs = [
      new THREE.Vector3(1, 1, 1),
      new THREE.Vector3(1, -1, -1),
      new THREE.Vector3(-1, 1, -1),
      new THREE.Vector3(-1, -1, 1),
    ].map((v) => v.normalize());

    const cells: { center: THREE.Vector3; r: number }[] = [];
    const recurse = (center: THREE.Vector3, r: number, depth: number) => {
      if (depth === 0) {
        cells.push({ center: center.clone(), r });
        return;
      }
      for (const d of dirs) {
        recurse(center.clone().addScaledVector(d, r / 2), r / 2, depth - 1);
      }
    };
    recurse(new THREE.Vector3(0, 0, 0), 2.2, DEPTH);

    const geo = new THREE.TetrahedronGeometry(1);
    const mesh = new THREE.InstancedMesh(geo, chromeMaterial(), cells.length);
    const m = new THREE.Matrix4();
    cells.forEach((c, i) => {
      m.makeScale(c.r, c.r, c.r).setPosition(c.center);
      mesh.setMatrixAt(i, m);
    });

    const group = new THREE.Group();
    group.add(mesh);
    // stand the pyramid on a face, apex up
    const q = new THREE.Quaternion().setFromUnitVectors(
      dirs[0],
      new THREE.Vector3(0, 1, 0)
    );
    mesh.quaternion.copy(q);
    scene.add(group);

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
      group.rotation.y = t * 0.25;
      group.position.y = Math.sin(t * 0.7) * 0.1;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose();
      mesh.material.dispose();
      env.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden />;
}
