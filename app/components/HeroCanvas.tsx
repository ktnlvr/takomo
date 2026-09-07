"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
import {
  makeEnvironment,
  makeHexNut,
  makeBolt,
  makeTungstenCube,
  chromeMaterial,
  tungstenMaterial,
} from "./brand";

/**
 * The forge's raw materials: a liquid-metal core, orbited by the three
 * TAKOMO brand objects — hex nut, bolt, tungsten cube.
 */
export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.innerWidth < 700;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.75 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const scene = new THREE.Scene();
    const env = makeEnvironment(renderer);
    scene.environment = env;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

    // lights (env does most of the work; these add sparkle + blue rim)
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfe8f5, 1.8);
    rim.position.set(-6, -2, -4);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0x1c222c, 0.5));

    const group = new THREE.Group();
    scene.add(group);

    // liquid metal core as a marching-cubes field; the orbiting nut, bolt,
    // and dodecahedron each feed a ball into the field at their position,
    // so the liquid stretches toward them and merges when they pass close
    const FIELD = 7.6; // world size the 0..1 field maps onto
    const mc = new MarchingCubes(
      isMobile ? 32 : 44,
      chromeMaterial(0xc8d2e2),
      false,
      false,
      30000
    );
    mc.scale.setScalar(FIELD / 2);
    mc.isolation = 70;
    group.add(mc);

    // orbiters
    const chrome = chromeMaterial();
    const nut = makeHexNut(0.55, chrome);
    const bolt = makeBolt(0.34, chrome);
    const cube = makeTungstenCube(0.72, tungstenMaterial());
    const orbiters: { obj: THREE.Group; r: number; speed: number; phase: number; tilt: number }[] = [
      { obj: nut, r: 2.5, speed: 0.35, phase: 0, tilt: 0.25 },
      { obj: bolt, r: 2.9, speed: -0.26, phase: 2.2, tilt: -0.35 },
      { obj: cube, r: 2.2, speed: 0.3, phase: 4.3, tilt: 0.5 },
    ];
    orbiters.forEach((o) => group.add(o.obj));

    // faint spark field behind everything
    const SPARKS = isMobile ? 260 : 500;
    const sparkPos = new Float32Array(SPARKS * 3);
    for (let i = 0; i < SPARKS; i++) {
      sparkPos.set(
        [
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 12,
          -3 - Math.random() * 8,
        ],
        i * 3
      );
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      size: 0.025,
      color: 0x9db4ff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(sparkGeo, sparkMat));

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
      // pull back on narrow screens so the orbit fits
      camera.position.set(0, 0.25, Math.max(7, 5.2 / Math.min(camera.aspect, 1)));
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      mc.reset();
      // wobbling core
      mc.addBall(
        0.5 + 0.02 * Math.sin(t * 1.3),
        0.5 + 0.02 * Math.sin(t * 1.7),
        0.5 + 0.02 * Math.cos(t * 1.1),
        0.42,
        12
      );

      orbiters.forEach((o, i) => {
        const a = t * o.speed + o.phase;
        o.obj.position.set(
          Math.cos(a) * o.r,
          Math.sin(a * 0.8 + i) * 0.7 + Math.sin(a) * o.tilt,
          Math.sin(a) * o.r * 0.55
        );
        o.obj.rotation.x = t * (0.4 + i * 0.13);
        o.obj.rotation.y = t * (0.5 - i * 0.1);
        // each orbiter is itself a metaball source
        mc.addBall(
          0.5 + o.obj.position.x / FIELD,
          0.5 + o.obj.position.y / FIELD,
          0.5 + o.obj.position.z / FIELD,
          0.16,
          12
        );
      });
      mc.update();

      group.rotation.y = t * 0.06 + mouseX * 0.3;
      group.rotation.x = mouseY * 0.14 + Math.sin(t * 0.4) * 0.03;
      group.position.y = 0.15;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", resize);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
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
