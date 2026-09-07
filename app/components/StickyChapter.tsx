"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
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

        // community logos, extruded chrome; each owns its item in the chapter
        const makeLogo = (url: string, depth: number, targetW: number) => {
          const g = new THREE.Group();
          g.scale.setScalar(0.001);
          new SVGLoader().load(url, (data) => {
            const mat = chromeMaterial();
            const inner = new THREE.Group();
            for (const path of data.paths) {
              for (const shape of SVGLoader.createShapes(path)) {
                const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
                inner.add(new THREE.Mesh(geo, mat));
              }
            }
            // svg y points down; normalize to a target width and center
            inner.scale.set(1, -1, 1);
            let box = new THREE.Box3().setFromObject(inner);
            const sc = targetW / (box.max.x - box.min.x);
            inner.scale.set(sc, -sc, sc);
            box = new THREE.Box3().setFromObject(inner);
            inner.position.sub(box.getCenter(new THREE.Vector3()));
            g.add(inner);
          });
          return g;
        };
        const trLogo = makeLogo("/tr-logo.svg", 3.4, 4.4);
        const asaLogo = makeLogo("/asa-logo.svg", 12, 3.0);
        const arocLogo = makeLogo("/aroc-logo.svg", 24, 3.2);

        const wrap = new THREE.Group();
        wrap.add(holder);
        wrap.add(trLogo);
        wrap.add(asaLogo);
        wrap.add(arocLogo);
        obj = wrap;
        objUpdate = (t) => {
          nut.rotation.y = -t * 0.7;
          // side-to-side wobble with a slight tilt; amplitudes stay well
          // under 90deg so the marks are never seen mirrored
          for (const logo of [trLogo, asaLogo, arocLogo]) {
            logo.rotation.y = Math.sin(t * 0.9) * 0.32;
            logo.rotation.z = Math.sin(t * 0.6 + 1) * 0.07;
            logo.rotation.x = Math.sin(t * 0.5) * 0.06;
          }
          // crossfade by scale: TR owns item 1, AROC item 3, the nut the rest
          const a = activeRef.current;
          const targets: [THREE.Group, boolean][] = [
            [holder, a === 0],
            [trLogo, a === 1],
            [asaLogo, a === 2],
            [arocLogo, a === 3],
          ];
          for (const [g, show] of targets) {
            g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, show ? 1 : 0.001, 0.2));
          }
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
      const logoShown = kind === "nut" && activeRef.current > 0;
      if (logoShown) {
        // ease the drift back to face-on so the mark reads correctly
        const twoPi = Math.PI * 2;
        const nearest = Math.round(group.rotation.y / twoPi) * twoPi;
        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, nearest, 0.08);
      } else {
        group.rotation.y += 0.004 + spin * 0.02;
      }
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
            <div className="chapter-card">
              <span className="kicker">
                {kicker} · {String(i + 1).padStart(2, "0")}/{String(items.length).padStart(2, "0")}
              </span>
              {i === 0 && headline ? <h2 className="headline" style={{ margin: 0 }}>{headline}</h2> : null}
              <h3>{item.title}</h3>
              <div className="body">{item.body}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
