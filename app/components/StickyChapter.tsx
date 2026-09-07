"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { makeEnvironment, makeHexNut, chromeMaterial } from "./brand";
import {
  makeMetaballs,
  makeDevBoard,
  makeRuin,
  makeFlywheel,
} from "./sceneModels";

export type SceneKind = "nut" | "board" | "ruin" | "wheel";

export interface ChapterItem {
  title: string;
  body: React.ReactNode;
}

/**
 * tigerstyle-style scroll chapter: the left column scrolls through items,
 * the right pane is a sticky three.js scene with one of the brand objects.
 * The object reacts to which item is in view.
 */
function ChapterScene({
  kind,
  activeIndex,
  count,
}: {
  kind: SceneKind;
  activeIndex: number;
  count: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(0);
  activeRef.current = activeIndex;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.innerWidth < 900;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const scene = new THREE.Scene();
    const env = makeEnvironment(renderer);
    scene.environment = env;

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(0, 0.15, 5.2);

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 6, 5);
    scene.add(key);
    // steel rim + cyan fill; specular contrast comes from the env map
    const rim = new THREE.DirectionalLight(0xdfe8f5, 2.0);
    rim.position.set(-6, -2, -3);
    scene.add(rim);
    const cyan = new THREE.DirectionalLight(0x8fe8e0, 0.9);
    cyan.position.set(5, -3, 2);
    scene.add(cyan);
    scene.add(new THREE.AmbientLight(0x1c222c, 0.5));

    // root holds the centerpiece and its metaballs; the canvas spans the whole
    // chapter, so push the root right to leave the left half to the text
    const root = new THREE.Group();
    scene.add(root);
    const group = new THREE.Group();
    root.add(group);

    let objUpdate: ((t: number) => void) | undefined;
    let obj: THREE.Object3D;
    switch (kind) {
      case "nut": {
        // face the camera and spin around the bore, wheel-style
        const nut = makeHexNut(1.15, chromeMaterial());
        const holder = new THREE.Group();
        holder.add(nut);
        holder.rotation.x = Math.PI / 2;
        obj = holder;
        objUpdate = (t) => {
          nut.rotation.y = -t * 0.7;
        };
        break;
      }
      case "board": {
        const b = makeDevBoard();
        obj = b.obj;
        objUpdate = b.update;
        obj.rotation.x = 0.5;
        break;
      }
      case "ruin": {
        const r = makeRuin();
        obj = r.obj;
        break;
      }
      case "wheel": {
        const w = makeFlywheel();
        obj = w.obj;
        objUpdate = w.update;
        break;
      }
    }
    group.add(obj);

    // liquid metal drifting around the centerpiece — melts away at the edge
    const meta = makeMetaballs(isMobile ? 5.6 : 6.8, isMobile ? 30 : 44);
    root.add(meta.obj);

    const resize = () => {
      const parent = canvas.parentElement!;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = isMobile ? 7.0 : 5.8;
      camera.updateProjectionMatrix();
      const halfW = Math.tan(THREE.MathUtils.degToRad(21)) * camera.position.z * camera.aspect;
      root.position.x = isMobile ? 0 : halfW * 0.48;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const clock = new THREE.Clock();
    let raf = 0;
    let spin = 0;
    let lastActive = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      // a change of item gives the object a push
      if (activeRef.current !== lastActive) {
        spin += 1.4;
        lastActive = activeRef.current;
      }
      spin *= 0.96;

      objUpdate?.(t);
      meta.update(t);
      const target = (activeRef.current / Math.max(count - 1, 1) - 0.5) * 0.9;
      group.rotation.y += 0.004 + spin * 0.02;
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, target * 0.5, 0.04);
      group.position.y = Math.sin(t * 0.8) * 0.08;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
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
  }, [kind, count]);

  return <canvas ref={canvasRef} aria-hidden />;
}

export default function StickyChapter({
  id,
  kicker,
  headline,
  scene,
  items,
}: {
  id?: string;
  kicker: string;
  headline?: React.ReactNode;
  scene: SceneKind;
  items: ChapterItem[];
}) {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>("[data-chapter-item]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number(e.target.getAttribute("data-chapter-item"));
            setActive(i);
          }
        });
      },
      { threshold: 0.55 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} className="chapter" ref={rootRef}>
      <div className="chapter-visual">
        <ChapterScene kind={scene} activeIndex={active} count={items.length} />
        <div className="chapter-progress">
          {items.map((_, i) => (
            <div key={i} className={`notch ${i === active ? "active" : ""}`} />
          ))}
        </div>
      </div>
      <div className="chapter-left">
        {items.map((item, i) => (
          <div
            key={i}
            data-chapter-item={i}
            className={`chapter-item ${i === active ? "active" : ""}`}
          >
            <span className="kicker">
              {kicker} · {String(i + 1).padStart(2, "0")}/{String(items.length).padStart(2, "0")}
            </span>
            {i === 0 && headline ? <h2 className="headline" style={{ margin: 0 }}>{headline}</h2> : null}
            <h3>{item.title}</h3>
            <div className="body">{item.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
