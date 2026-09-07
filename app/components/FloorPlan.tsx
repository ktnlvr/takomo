"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * BMK5 — Betonimiehenkuja 5, Otaniemi. Schematic first floor.
 * Zones are laid out on a slab around a central spine corridor;
 * each is an extruded block you can hover, click, and fly to.
 */
export interface Zone {
  id: string;
  name: string;
  desc: string;
  color: string;
  // footprint in floor units: x, z = corner; w, d = size; h = block height
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

export const ZONES: Zone[] = [
  {
    id: "shop",
    name: "Machine Shop",
    desc: "CNC mills, lathes, and metal fabrication — where housings, frames, and fixtures become real.",
    color: "#3b6ef6",
    x: -10, z: -6, w: 7, d: 5, h: 1.35,
  },
  {
    id: "elab",
    name: "Electronics Lab",
    desc: "Soldering and rework stations, scopes, and test benches for boards, sensors, and embedded systems.",
    color: "#6e8fff",
    x: -2.4, z: -6, w: 5.4, d: 5, h: 1.1,
  },
  {
    id: "library",
    name: "Hardware Library",
    desc: "40+ systems — Jetsons, FPGAs, radios, actuators — checked out like books, returned with results.",
    color: "#7e57ff",
    x: 3.6, z: -6, w: 6.4, d: 5, h: 0.9,
  },
  {
    id: "highbay",
    name: "Assembly High Bay",
    desc: "Floor space and height for the big builds: rovers, rockets, satellite test rigs, autonomous machines.",
    color: "#2fa8ff",
    x: -10, z: 1.6, w: 8.5, d: 5.4, h: 1.8,
  },
  {
    id: "stage",
    name: "Commons & Stage",
    desc: "Talks, demo nights, and build sessions — the room where a prototype decides to become a company.",
    color: "#4dd6c1",
    x: -0.8, z: 1.6, w: 6.2, d: 5.4, h: 0.75,
  },
  {
    id: "focus",
    name: "Focus Rooms",
    desc: "Meeting and quiet rooms for design reviews, partner calls, and heads-down work.",
    color: "#9db4ff",
    x: 6.2, z: 1.6, w: 3.8, d: 3, h: 1.0,
  },
  {
    id: "storage",
    name: "Materials & Storage",
    desc: "Stock, components, and member project shelves — iteration is fast when parts are ten meters away.",
    color: "#5c6bc0",
    x: 6.2, z: 5.0, w: 3.8, d: 2.0, h: 0.85,
  },
];

const CORRIDOR = { x: -10, z: -1, w: 20, d: 2.6 };

export default function FloorPlan() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string } | null>(null);
  const apiRef = useRef<{ select: (id: string | null) => void } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x070a12, 26, 60);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    const camHome = new THREE.Vector3(0, 16, 19);
    const lookHome = new THREE.Vector3(0, 0, 0.6);
    camera.position.copy(camHome);
    const lookAt = lookHome.clone();
    const camTarget = camHome.clone();
    const lookTarget = lookHome.clone();

    // lights
    scene.add(new THREE.AmbientLight(0x8899cc, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(8, 14, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x3b6ef6, 0.8);
    rim.position.set(-10, 6, -8);
    scene.add(rim);

    // slab
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(22.4, 0.4, 15),
      new THREE.MeshStandardMaterial({ color: 0x0d1220, roughness: 0.9 })
    );
    slab.position.set(0, -0.2, 0.4);
    scene.add(slab);

    // grid on the slab
    const grid = new THREE.GridHelper(60, 60, 0x1c2440, 0x131a30);
    grid.position.y = 0.01;
    scene.add(grid);

    // corridor strip
    const corridor = new THREE.Mesh(
      new THREE.BoxGeometry(CORRIDOR.w, 0.06, CORRIDOR.d),
      new THREE.MeshStandardMaterial({
        color: 0x1a2138,
        roughness: 0.6,
        metalness: 0.2,
      })
    );
    corridor.position.set(CORRIDOR.x + CORRIDOR.w / 2, 0.06, CORRIDOR.z + CORRIDOR.d / 2);
    scene.add(corridor);

    // entrance marker at east end of the corridor
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 1.2, CORRIDOR.d - 0.4),
      new THREE.MeshStandardMaterial({
        color: 0x6e8fff,
        emissive: 0x3b6ef6,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.7,
      })
    );
    door.position.set(CORRIDOR.x + CORRIDOR.w + 0.15, 0.6, CORRIDOR.z + CORRIDOR.d / 2);
    scene.add(door);

    // zone blocks
    interface ZoneObj {
      zone: Zone;
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      edges: THREE.LineSegments;
      center: THREE.Vector3;
      buildDelay: number;
    }
    const zoneObjs: ZoneObj[] = [];
    const pickables: THREE.Mesh[] = [];

    ZONES.forEach((zone, i) => {
      const geo = new THREE.BoxGeometry(zone.w - 0.35, zone.h, zone.d - 0.35);
      geo.translate(0, zone.h / 2, 0); // grow from the floor
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(zone.color),
        transparent: true,
        opacity: 0.32,
        roughness: 0.35,
        metalness: 0.1,
        emissive: new THREE.Color(zone.color),
        emissiveIntensity: 0.12,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const cx = zone.x + zone.w / 2;
      const cz = zone.z + zone.d / 2;
      mesh.position.set(cx, 0, cz);
      mesh.scale.y = 0.001;
      mesh.userData.zoneId = zone.id;
      scene.add(mesh);
      pickables.push(mesh);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: new THREE.Color(zone.color), transparent: true, opacity: 0.9 })
      );
      edges.position.copy(mesh.position);
      edges.scale.copy(mesh.scale);
      scene.add(edges);

      zoneObjs.push({
        zone,
        mesh,
        mat,
        edges,
        center: new THREE.Vector3(cx, 0, cz),
        buildDelay: i * 0.18,
      });
    });

    // build-in when scrolled into view
    let buildStart: number | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && buildStart === null) buildStart = clock.getElapsedTime();
        });
      },
      { threshold: 0.35 }
    );
    io.observe(wrap);

    // picking
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoverId: string | null = null;
    let selectedId: string | null = null;

    const setCameraFor = (id: string | null) => {
      selectedId = id;
      const obj = zoneObjs.find((z) => z.zone.id === id);
      if (obj) {
        const c = obj.center;
        camTarget.set(c.x * 0.55, 9, c.z + 10.5);
        lookTarget.set(c.x, obj.zone.h / 2, c.z);
      } else {
        camTarget.copy(camHome);
        lookTarget.copy(lookHome);
      }
    };
    apiRef.current = { select: setCameraFor };

    const onPointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickables);
      const id = hits.length ? (hits[0].object.userData.zoneId as string) : null;
      if (id !== hoverId) {
        hoverId = id;
        setHovered(id);
        canvas.style.cursor = id ? "pointer" : "default";
      }
      if (id) {
        const zone = ZONES.find((z) => z.id === id)!;
        setTooltip({ x: e.clientX - r.left, y: e.clientY - r.top, name: zone.name });
      } else {
        setTooltip(null);
      }
    };

    const onClick = () => {
      const next = hoverId === selectedId ? null : hoverId;
      setSelected(next);
      setCameraFor(next);
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("click", onClick);

    const resize = () => {
      const holder = canvas.parentElement!;
      const w = holder.clientWidth;
      const h = holder.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const clock = new THREE.Clock();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      zoneObjs.forEach((z) => {
        // build-in
        if (buildStart !== null) {
          const p = easeOut(
            THREE.MathUtils.clamp((t - buildStart - z.buildDelay) / 0.9, 0.001, 1)
          );
          z.mesh.scale.y = p;
          z.edges.scale.y = p;
        }
        // hover/selection styling
        const isHot = z.zone.id === hoverId || z.zone.id === selectedId;
        z.mat.opacity = THREE.MathUtils.lerp(z.mat.opacity, isHot ? 0.75 : 0.32, 0.15);
        z.mat.emissiveIntensity = THREE.MathUtils.lerp(
          z.mat.emissiveIntensity,
          isHot ? 0.55 : 0.12,
          0.15
        );
        // idle breathing on the selected zone
        if (z.zone.id === selectedId && buildStart !== null) {
          z.mesh.scale.y = 1 + Math.sin(t * 2.2) * 0.03;
          z.edges.scale.y = z.mesh.scale.y;
        }
      });

      // slow orbit drift when nothing is selected
      if (!selectedId) {
        const a = Math.sin(t * 0.1) * 0.12;
        camTarget.set(Math.sin(a) * 19, 16, Math.cos(a) * 19);
      }

      camera.position.lerp(camTarget, 0.045);
      lookAt.lerp(lookTarget, 0.06);
      camera.lookAt(lookAt);

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("click", onClick);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose());
        }
      });
      renderer.dispose();
    };
  }, []);

  const pick = (id: string) => {
    const next = selected === id ? null : id;
    setSelected(next);
    apiRef.current?.select(next);
  };

  return (
    <div className="floorplan-wrap" ref={wrapRef}>
      <div className="floorplan-canvas">
        <canvas ref={canvasRef} />
        {tooltip && (
          <div className="floorplan-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
            {tooltip.name}
          </div>
        )}
        <div className="floorplan-hud">
          BMK5 · Betonimiehenkuja 5 · Otaniemi — first floor, schematic · click a zone
        </div>
      </div>
      <div className="zone-panel">
        {ZONES.map((zone) => (
          <button
            key={zone.id}
            className={`zone-btn ${selected === zone.id || hovered === zone.id ? "active" : ""}`}
            onClick={() => pick(zone.id)}
          >
            <span className="zone-name">
              <span className="zone-swatch" style={{ background: zone.color }} />
              {zone.name}
            </span>
            <span className="zone-desc">{zone.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
