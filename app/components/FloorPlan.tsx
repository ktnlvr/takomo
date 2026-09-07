"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  makeEnvironment,
  makeHexNut,
  makeBolt,
  makeTungstenCube,
  makeLiquidBlob,
  makeQuestionSprite,
  chromeMaterial,
  tungstenMaterial,
} from "./brand";

/**
 * BMK5 — Betonimiehenkuja 5, Otaniemi. First floor (1. krs), right wing only.
 * Coordinates in meters, matched to the floor plan: x → east, z → south.
 * The choke point separating us from the rest of the building sits at x = 0;
 * the left part of BMK5 is rendered as a ghost.
 */
export interface Zone {
  id: string;
  name: string;
  desc: string;
  color: string;
  marker: "bolt" | "nut" | "cube" | "blob" | "question" | "rack" | "sat" | "ring" | "stack" | "puck";
  x: number; // west edge
  z: number; // north edge
  w: number;
  d: number;
  h: number;
}

export const ZONES: Zone[] = [
  {
    id: "hall",
    name: "Hardware Hall",
    desc: "The big hall immediately after the choke point. Persistent robotics competition arenas, robotics setups, and long-running builds that never have to be torn down between sessions.",
    color: "#c62a55",
    marker: "bolt",
    x: 2, z: 0.5, w: 20, d: 11.5, h: 2.4,
  },
  {
    id: "lobby",
    name: "General Lobby",
    desc: "The public heart of TAKOMO. The hardware hall flows straight into it — open to visitors, demos on display, the front door of the community.",
    color: "#8fe8e0",
    marker: "blob",
    x: 22.5, z: 0.5, w: 10.5, d: 11.5, h: 0.55,
  },
  {
    id: "quick",
    name: "Quick-Access Storage",
    desc: "Parts, components, fasteners, and consumables an arm's reach above the machine shop — iteration is fast when the part you need is ten meters away.",
    color: "#7a3b52",
    marker: "stack",
    x: 33.5, z: 0.5, w: 9.5, d: 8.5, h: 1.0,
  },
  {
    id: "it",
    name: "IT Closet",
    desc: "An 8 m² nook of network, racks, and blinking lights. Small room, big uptime.",
    color: "#5fd6c9",
    marker: "rack",
    x: 43.5, z: 0.5, w: 2.7, d: 3.1, h: 1.3,
  },
  {
    id: "cowork",
    name: "Coworking / Innovation Space",
    desc: "Whiteboards, desks, and room to think — the general coworking space at the east end, where projects get planned, argued about, and designed before they hit the machines.",
    color: "#e0577f",
    marker: "ring",
    x: 55, z: 0.5, w: 12.5, d: 18, h: 1.1,
  },
  {
    id: "lounge",
    name: "Lounge",
    desc: "Turn right just before the coworking space. Tea, coffee, sofas — and explicitly no work. Rest is part of the process.",
    color: "#8fe8e0",
    marker: "blob",
    x: 46.5, z: 10.5, w: 8, d: 8, h: 0.8,
  },
  {
    id: "machine",
    name: "Machine Shop",
    desc: "CNCs, 3D printers, and everything loud — accessible straight from the lobby, with quick-access storage right above it on the plan.",
    color: "#c62a55",
    marker: "nut",
    x: 33.5, z: 10.5, w: 12.5, d: 8, h: 1.5,
  },
  {
    id: "storage",
    name: "Storage Units",
    desc: "Units for servers, items, member projects and whatever else needs a home — some of them refrigerated.",
    color: "#7a3b52",
    marker: "cube",
    x: 22.5, z: 13, w: 10.5, d: 5.5, h: 1.2,
  },
  {
    id: "asa",
    name: "ASA Clubroom",
    desc: "Home base for the Aalto Space Association — satellites, rocketry, and astronomy get their own room in the office row under the hardware hall.",
    color: "#c8a7b4",
    marker: "sat",
    x: 2, z: 13, w: 4, d: 5.5, h: 1.0,
  },
  {
    id: "office1",
    name: "Staff Office",
    desc: "Day-to-day operations of the space — memberships, partners, logistics.",
    color: "#8b7580",
    marker: "puck",
    x: 6.2, z: 13, w: 4, d: 5.5, h: 1.0,
  },
  {
    id: "office2",
    name: "Staff Office",
    desc: "A second office for the people who keep the forge burning.",
    color: "#8b7580",
    marker: "puck",
    x: 10.4, z: 13, w: 4, d: 5.5, h: 1.0,
  },
  {
    id: "q1",
    name: "?",
    desc: "Unassigned. Maybe a community room, maybe a partner lab — maybe your project's room.",
    color: "#5c4a52",
    marker: "question",
    x: 14.6, z: 13, w: 3.6, d: 5.5, h: 1.0,
  },
  {
    id: "q2",
    name: "?",
    desc: "Also unassigned. The floor plan is a proposal — the community fills it in.",
    color: "#5c4a52",
    marker: "question",
    x: 18.4, z: 13, w: 3.6, d: 5.5, h: 1.0,
  },
];

const WING = { x0: 0, x1: 68, z0: 0, z1: 21 };
const CX = (WING.x0 + WING.x1) / 2;
const CZ = (WING.z0 + WING.z1) / 2;

function makeMarker(kind: Zone["marker"]): {
  obj: THREE.Object3D;
  update?: (t: number) => void;
} {
  switch (kind) {
    case "bolt":
      return { obj: makeBolt(0.55, chromeMaterial()) };
    case "nut":
      return { obj: makeHexNut(0.8, chromeMaterial()) };
    case "cube":
      return { obj: makeTungstenCube(1.1, tungstenMaterial()) };
    case "blob": {
      const b = makeLiquidBlob(0.65, 24);
      return { obj: b.mesh, update: b.update };
    }
    case "question":
      return { obj: makeQuestionSprite(1.6) };
    case "rack": {
      const g = new THREE.Group();
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.1, 0.6),
        new THREE.MeshPhysicalMaterial({ color: 0x11162a, metalness: 0.8, roughness: 0.4 })
      );
      g.add(box);
      for (let i = 0; i < 4; i++) {
        const led = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.05, 0.05),
          new THREE.MeshBasicMaterial({ color: 0x4dd6c1 })
        );
        led.position.set(0, 0.35 - i * 0.22, 0.31);
        g.add(led);
      }
      return { obj: g };
    }
    case "sat": {
      const g = new THREE.Group();
      const chrome = chromeMaterial();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), chrome);
      g.add(body);
      const panelMat = new THREE.MeshPhysicalMaterial({
        color: 0x1a2a66,
        metalness: 0.9,
        roughness: 0.2,
      });
      for (const s of [-1, 1]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.45), panelMat);
        p.position.x = s * 0.8;
        g.add(p);
      }
      return { obj: g };
    }
    case "ring":
      return {
        obj: (() => {
          const g = new THREE.Group();
          g.add(new THREE.Mesh(new THREE.TorusKnotGeometry(0.5, 0.16, 90, 16), chromeMaterial()));
          return g;
        })(),
      };
    case "stack": {
      const g = new THREE.Group();
      const m = tungstenMaterial();
      [
        [0, 0.25, 0, 0.5],
        [0.45, 0.175, 0.3, 0.35],
        [0.15, 0.62, 0.1, 0.3],
      ].forEach(([x, y, z, s]) => {
        const c = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), m);
        c.position.set(x, y, z);
        c.rotation.y = x * 2;
        g.add(c);
      });
      return { obj: g };
    }
    case "puck":
      return {
        obj: (() => {
          const g = new THREE.Group();
          g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.18, 32), chromeMaterial()));
          return g;
        })(),
      };
  }
}

export default function FloorPlan() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string } | null>(null);
  const apiRef = useRef<{ select: (id: string | null) => void } | null>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0d060a, 70, 160);
    scene.environment = makeEnvironment(renderer);
    const envTex = scene.environment;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
    const camHome = new THREE.Vector3(4, 42, 46);
    const lookHome = new THREE.Vector3(0, 0, 1);
    camera.position.copy(camHome);
    const lookAt = lookHome.clone();
    const camTarget = camHome.clone();
    const lookTarget = lookHome.clone();
    let zoomFactor = 1;

    scene.add(new THREE.AmbientLight(0xcc8899, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(20, 35, 15);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc62a55, 1.1);
    rim.position.set(-30, 12, -20);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0x8fe8e0, 0.5);
    fill.position.set(30, 10, 25);
    scene.add(fill);

    // slab for the right wing
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(WING.x1 - WING.x0 + 2, 0.5, WING.z1 - WING.z0 + 2),
      new THREE.MeshStandardMaterial({ color: 0x1a0d13, roughness: 0.9 })
    );
    slab.position.set(0, -0.25, 0);
    scene.add(slab);

    const grid = new THREE.GridHelper(180, 90, 0x40202c, 0x2a1520);
    grid.position.y = 0.02;
    scene.add(grid);

    // ghost of the left part of BMK5 (not ours) + the choke connector
    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0x503240,
      transparent: true,
      opacity: 0.13,
      roughness: 1,
    });
    const ghost = new THREE.Mesh(new THREE.BoxGeometry(26, 1.6, 15), ghostMat);
    ghost.position.set(WING.x0 - CX - 15.5, 0.8, 0);
    scene.add(ghost);
    const choke = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.12, 4), ghostMat.clone());
    (choke.material as THREE.MeshStandardMaterial).opacity = 0.3;
    choke.position.set(WING.x0 - CX - 0.8, 0.06, -1.5);
    scene.add(choke);

    // service core between hall and lobby (WCs/technical on the plan) + spine corridor
    const svcMat = new THREE.MeshStandardMaterial({
      color: 0x3a2530,
      transparent: true,
      opacity: 0.35,
      roughness: 0.8,
    });
    const svc = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 7), svcMat);
    svc.geometry.translate(0, 0.45, 0);
    svc.position.set(20.9 - CX, 0, 4.5 - CZ);
    scene.add(svc);
    const corridorMat = new THREE.MeshStandardMaterial({
      color: 0x2b1822,
      roughness: 0.55,
      metalness: 0.25,
    });
    const spine = new THREE.Mesh(new THREE.BoxGeometry(WING.x1 - 2, 0.08, 2.2), corridorMat);
    spine.position.set(0, 0.05, 11.6 - CZ);
    scene.add(spine);

    // zone blocks + markers
    interface ZoneObj {
      zone: Zone;
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      edges: THREE.LineSegments;
      marker: THREE.Object3D;
      markerUpdate?: (t: number) => void;
      center: THREE.Vector3;
      buildDelay: number;
    }
    const zoneObjs: ZoneObj[] = [];
    const pickables: THREE.Object3D[] = [];

    ZONES.forEach((zone, i) => {
      const geo = new THREE.BoxGeometry(zone.w - 0.3, zone.h, zone.d - 0.3);
      geo.translate(0, zone.h / 2, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(zone.color),
        transparent: true,
        opacity: 0.3,
        roughness: 0.35,
        metalness: 0.1,
        emissive: new THREE.Color(zone.color),
        emissiveIntensity: 0.12,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const cx = zone.x + zone.w / 2 - CX;
      const cz = zone.z + zone.d / 2 - CZ;
      mesh.position.set(cx, 0, cz);
      mesh.scale.y = 0.001;
      mesh.userData.zoneId = zone.id;
      scene.add(mesh);
      pickables.push(mesh);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({
          color: new THREE.Color(zone.color),
          transparent: true,
          opacity: 0.85,
        })
      );
      edges.position.copy(mesh.position);
      edges.scale.copy(mesh.scale);
      scene.add(edges);

      const { obj: marker, update: markerUpdate } = makeMarker(zone.marker);
      marker.position.set(cx, zone.h + 1.3, cz);
      marker.traverse((o) => (o.userData.zoneId = zone.id));
      marker.userData.zoneId = zone.id;
      scene.add(marker);
      pickables.push(marker);

      if (zone.id === "storage") {
        // stall dividers, like the hatched units on the plan
        const divMat = new THREE.MeshStandardMaterial({
          color: 0x8fe8e0,
          transparent: true,
          opacity: 0.28,
          roughness: 0.5,
        });
        for (let k = 1; k < 5; k++) {
          const div = new THREE.Mesh(new THREE.BoxGeometry(0.08, zone.h * 0.85, zone.d - 0.6), divMat);
          div.position.set(cx - zone.w / 2 + (zone.w / 5) * k, (zone.h * 0.85) / 2, cz);
          scene.add(div);
        }
      }

      zoneObjs.push({
        zone,
        mesh,
        mat,
        edges,
        marker,
        markerUpdate,
        center: new THREE.Vector3(cx, 0, cz),
        buildDelay: i * 0.14,
      });
    });

    let buildStart: number | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && buildStart === null) buildStart = clock.getElapsedTime();
        });
      },
      { threshold: 0.01 }
    );
    io.observe(wrap);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoverId: string | null = null;
    let selectedId: string | null = null;

    const raycastAt = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = ((clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickables, true);
      for (const h of hits) {
        let o: THREE.Object3D | null = h.object;
        while (o) {
          if (o.userData.zoneId) return o.userData.zoneId as string;
          o = o.parent;
        }
      }
      return null;
    };

    const setCameraFor = (id: string | null) => {
      selectedId = id;
      const obj = zoneObjs.find((z) => z.zone.id === id);
      if (obj) {
        const c = obj.center;
        const span = Math.max(obj.zone.w, obj.zone.d);
        camTarget.set(c.x * 0.75, 8 + span * 0.6, c.z + 9 + span * 0.55);
        lookTarget.set(c.x, obj.zone.h / 2, c.z);
      } else {
        camTarget.copy(camHome).multiplyScalar(zoomFactor);
        lookTarget.copy(lookHome);
      }
    };
    apiRef.current = { select: setCameraFor };

    const onPointerMove = (e: PointerEvent) => {
      const id = raycastAt(e.clientX, e.clientY);
      if (id !== hoverId) {
        hoverId = id;
        setHovered(id);
        canvas.style.cursor = id ? "pointer" : "default";
      }
      if (id) {
        const r = canvas.getBoundingClientRect();
        const zone = ZONES.find((z) => z.id === id)!;
        setTooltip({ x: e.clientX - r.left, y: e.clientY - r.top, name: zone.name });
      } else {
        setTooltip(null);
      }
    };

    // raycast at the click itself so taps work on touch screens
    const onClick = (e: MouseEvent) => {
      const id = raycastAt(e.clientX, e.clientY);
      if (id) canvas.dispatchEvent(new CustomEvent("zonepick", { detail: id }));
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("click", onClick);

    const resize = () => {
      const holder = canvas.parentElement!;
      const w = holder.clientWidth;
      const h = holder.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // portrait: pull the camera back so the whole wing fits
      zoomFactor = Math.min(Math.max(1.6 / camera.aspect, 1), 2.1);
      if (!selectedId) camTarget.copy(camHome).multiplyScalar(zoomFactor);
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

      zoneObjs.forEach((z, i) => {
        if (buildStart !== null) {
          const p = easeOut(
            THREE.MathUtils.clamp((t - buildStart - z.buildDelay) / 0.9, 0.001, 1)
          );
          z.mesh.scale.y = p;
          z.edges.scale.y = p;
          z.marker.visible = p > 0.85;
        } else {
          z.marker.visible = false;
        }

        const isHot = z.zone.id === hoverId || z.zone.id === selectedId;
        z.mat.opacity = THREE.MathUtils.lerp(z.mat.opacity, isHot ? 0.7 : 0.3, 0.15);
        z.mat.emissiveIntensity = THREE.MathUtils.lerp(
          z.mat.emissiveIntensity,
          isHot ? 0.5 : 0.12,
          0.15
        );

        // markers float, spin, and get excited when hot
        z.markerUpdate?.(t + i);
        z.marker.position.y = z.zone.h + 1.3 + Math.sin(t * 1.6 + i * 1.3) * 0.18;
        z.marker.rotation.y = t * (isHot ? 1.6 : 0.5) + i;
      });

      if (!selectedId) {
        const a = Math.sin(t * 0.08) * 0.1;
        camTarget.set(
          (Math.sin(a) * 46 + 4) * zoomFactor,
          42 * zoomFactor,
          Math.cos(a) * 46 * zoomFactor
        );
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
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments || o instanceof THREE.Sprite) {
          (o as THREE.Mesh).geometry?.dispose?.();
          const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((mm) => mm?.dispose?.());
        }
      });
      envTex?.dispose();
      renderer.dispose();
    };
  }, []);

  // the tour: scrolling through the tall wrapper walks the camera room by room
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onScroll = () => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      if (scrollable <= 0) return;
      const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
      // segment 0 = overview, then one per zone
      const seg = Math.min(
        Math.floor(progress * (ZONES.length + 1)),
        ZONES.length
      );
      const id = seg === 0 ? null : ZONES[seg - 1].id;
      if (id !== selectedRef.current) {
        setSelected(id);
        apiRef.current?.select(id);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pick = (id: string) => {
    // jump the page to the zone's segment; the scroll handler does the rest
    const wrap = wrapRef.current;
    if (!wrap) return;
    const idx = ZONES.findIndex((z) => z.id === id);
    const vh = window.innerHeight;
    const scrollable = wrap.offsetHeight - vh;
    const top = window.scrollY + wrap.getBoundingClientRect().top;
    const target = top + ((idx + 1.5) / (ZONES.length + 1)) * scrollable;
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  // clicks inside the canvas arrive as zonepick events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onPick = (e: Event) => pick((e as CustomEvent<string>).detail);
    canvas.addEventListener("zonepick", onPick);
    return () => canvas.removeEventListener("zonepick", onPick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = ZONES.find((z) => z.id === (hovered ?? selected));

  return (
    <div
      className="floorplan-tour"
      ref={wrapRef}
      style={{ height: `${(ZONES.length + 2) * 48}vh` }}
    >
      <div className="floorplan-sticky">
        <div>
          <span className="kicker">The space</span>
          <h2 className="headline" style={{ margin: "8px 0 0", fontSize: "clamp(1.4rem, 2.6vw, 2.1rem)" }}>
            BMK5, Otaniemi — first floor, right wing.{" "}
            <span className="accent">Scroll to walk the rooms.</span>
          </h2>
        </div>
        <div className="floorplan-row">
          <div className="floorplan-canvas">
            <canvas ref={canvasRef} />
            {tooltip && (
              <div className="floorplan-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
                {tooltip.name}
              </div>
            )}
            <div className="floorplan-hud">
              BMK5 · 1. krs — laid out from the floor plan · the rest of the building is ghosted
            </div>
          </div>
          <div className="zone-rail">
            {ZONES.map((zone) => (
              <button
                key={zone.id}
                className={`zone-row ${selected === zone.id || hovered === zone.id ? "active" : ""}`}
                onClick={() => pick(zone.id)}
              >
                <span className="zone-swatch" style={{ background: zone.color }} />
                {zone.name}
              </button>
            ))}
            <div className="zone-detail">
              <h4>{shown ? shown.name : "Overview"}</h4>
              <p>
                {shown
                  ? shown.desc
                  : "Keep scrolling — the camera visits every room in order. Or click one to jump."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
