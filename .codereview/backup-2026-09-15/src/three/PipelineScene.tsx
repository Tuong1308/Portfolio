import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * The authored focal moment of the page.
 *
 * A request travels the stack Tường actually works across: browser → Next.js →
 * Node API → database → dashboard. One packet of light moves node to node, each
 * node fires as the packet lands on it, and the connector behind it stays lit
 * until the run completes. The motion explains the pipeline; it is not decoration.
 */

export type Stage = { id: string; title: string; sub: string };

export const STAGES: Stage[] = [
  { id: "ui", title: "Browser", sub: "React · Next.js" },
  { id: "api", title: "API", sub: "Node.js · REST" },
  { id: "db", title: "Database", sub: "PostgreSQL · MongoDB" },
  { id: "ship", title: "Docker", sub: "Build · Deploy" },
  { id: "data", title: "Insight", sub: "Power BI · GA4" },
];

type Marker = { id: string; x: number; y: number; on: boolean; side: "top" | "bottom" | "right" };

export default function PipelineScene({ onStage }: { onStage?: (i: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const cb = useRef(onStage);
  cb.current = onStage;
  const [markers, setMarkers] = useState<Marker[]>([]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const l1 = new THREE.PointLight(0x3ddc84, 60, 40);
    l1.position.set(3, 5, 7);
    scene.add(l1);
    const l2 = new THREE.PointLight(0xff5c26, 30, 40);
    l2.position.set(-6, -3, 3);
    scene.add(l2);

    const group = new THREE.Group();
    scene.add(group);

    // ── layout: horizontal rail on wide screens, vertical stack on narrow ──
    let vertical = false;
    const pts: THREE.Vector3[] = [];
    const rings: THREE.Mesh[] = [];
    const cores: THREE.Mesh[] = [];
    const N = STAGES.length;

    const ringGeo = new THREE.TorusGeometry(0.46, 0.035, 12, 48);
    const coreGeo = new THREE.IcosahedronGeometry(0.2, 1);

    for (let i = 0; i < N; i++) {
      const p = new THREE.Vector3();
      pts.push(p);

      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshStandardMaterial({
          color: 0x2a3330,
          emissive: 0x3ddc84,
          emissiveIntensity: 0,
          roughness: 0.35,
          metalness: 0.5,
        })
      );
      group.add(ring);
      rings.push(ring);

      const core = new THREE.Mesh(
        coreGeo,
        new THREE.MeshStandardMaterial({
          color: 0x0d1210,
          emissive: 0x3ddc84,
          emissiveIntensity: 0.12,
          roughness: 0.2,
          metalness: 0.7,
        })
      );
      group.add(core);
      cores.push(core);
    }

    // connector rail — one line, progressively lit
    const RAIL_SEG = 240;
    const railPos = new Float32Array(RAIL_SEG * 3);
    const railProg = new Float32Array(RAIL_SEG); // 0..1 along the rail
    const railGeo = new THREE.BufferGeometry();
    railGeo.setAttribute("position", new THREE.BufferAttribute(railPos, 3));
    railGeo.setAttribute("aProg", new THREE.BufferAttribute(railProg, 1));

    const railMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uHead: { value: 0 }, uA: { value: new THREE.Color("#3ddc84") } },
      vertexShader: `
        attribute float aProg;
        varying float vP;
        void main(){
          vP = aProg;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float uHead;
        uniform vec3 uA;
        varying float vP;
        void main(){
          float lit  = step(vP, uHead);                       // already travelled
          float glow = smoothstep(0.07, 0.0, abs(vP - uHead)); // the packet's wake
          float a = 0.20 + lit * 0.40 + glow * 0.80;
          gl_FragColor = vec4(mix(uA * 0.55, uA, lit + glow), a);
        }`,
    });
    const rail = new THREE.Line(railGeo, railMat);
    group.add(rail);

    // the packet
    const packet = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xdffbe9 })
    );
    group.add(packet);

    const packetGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 20, 20),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        uniforms: {},
        vertexShader: `
          varying vec3 vN; varying vec3 vV;
          void main(){
            vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position,1.0);
            vV = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          varying vec3 vN; varying vec3 vV;
          void main(){
            float f = pow(1.0 - abs(dot(normalize(vV), vN)), 2.0);
            gl_FragColor = vec4(vec3(0.35, 0.95, 0.6) * f, f * 0.6);
          }`,
      })
    );
    group.add(packetGlow);

    // ── layout + sizing ───────────────────────────────────────────────────
    const layout = (w: number, h: number, dist: number) => {
      vertical = w / h < 1.15;
      // fit the rail to what the camera can actually see, so the diagram fills
      // its panel at every aspect ratio instead of floating in dead space
      const visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * dist;
      const visW = visH * (w / h);
      const span = vertical
        ? Math.min(visH * 0.72, 5.2)
        : Math.min(visW * 0.76, 11.5);
      for (let i = 0; i < N; i++) {
        const t = N === 1 ? 0 : i / (N - 1);
        if (vertical) {
          // single column on the left, depth wobble on z; labels take the right half
          pts[i].set(-visW * 0.26, span / 2 - t * span, (i % 2 === 0 ? 0.45 : -0.45));
        } else {
          pts[i].set(-span / 2 + t * span, Math.sin(t * Math.PI) * 0.42 - 0.12, (i % 2 === 0 ? 0.35 : -0.35));
        }
        rings[i].position.copy(pts[i]);
        cores[i].position.copy(pts[i]);
      }
      const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.35);
      const sample = curve.getPoints(RAIL_SEG - 1);
      for (let i = 0; i < RAIL_SEG; i++) {
        railPos[i * 3] = sample[i].x;
        railPos[i * 3 + 1] = sample[i].y;
        railPos[i * 3 + 2] = sample[i].z;
        railProg[i] = i / (RAIL_SEG - 1);
      }
      railGeo.attributes.position.needsUpdate = true;
      railGeo.attributes.aProg.needsUpdate = true;
      return curve;
    };

    let curve = layout(1, 1, 7.6);

    const resize = () => {
      const w = el.clientWidth || 600;
      const h = el.clientHeight || 400;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const dist = w / h < 1.15 ? 8.6 : 7.6;
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      curve = layout(w, h, dist);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // ── pointer parallax (desktop only) ──────────────────────────────────
    const aim = { x: 0, y: 0 };
    const par = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      aim.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      aim.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const fine = window.matchMedia("(hover: hover)").matches;
    if (fine) el.addEventListener("pointermove", onMove, { passive: true });

    // ── run the pipeline ─────────────────────────────────────────────────
    let inView = false;
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.15 });
    io.observe(el);

    const fired = new Array(N).fill(0); // time each node last fired
    let head = 0;                       // 0..1 packet progress
    let lastStage = -1;
    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();
    let raf = 0;
    let acc = 0;

    const publish = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      const PAD = 12;
      const next: Marker[] = pts.map((p, i) => {
        tmp.copy(p).applyMatrix4(group.matrixWorld).project(camera);
        const x = (tmp.x * 0.5 + 0.5) * w;
        const y = (-tmp.y * 0.5 + 0.5) * h;
        // vertical rail: labels sit beside the node, on its outward side, so they
        // never cover the rail and never clip off the top of the canvas
        // horizontal rail: stagger labels above/below so long ones never collide
        const side: Marker["side"] = vertical ? "right" : i % 2 === 0 ? "top" : "bottom";
        return {
          id: STAGES[i].id,
          x: Math.min(Math.max(x, PAD), w - PAD),
          y: Math.min(Math.max(y, PAD), h - PAD),
          on: head >= i / (N - 1) - 0.02,
          side,
        };
      });
      setMarkers(next);
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!inView || document.hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsedTime();

      // packet travel: ~1 full run every 6s, then a beat of rest
      head += dt * (reduced ? 0.09 : 0.17);
      if (head > 1.22) { head = 0; fired.fill(0); lastStage = -1; }

      const clamped = Math.min(head, 1);
      curve.getPointAt(clamped, tmp);
      packet.position.copy(tmp);
      packetGlow.position.copy(tmp);
      packet.visible = packetGlow.visible = head <= 1.02;
      railMat.uniforms.uHead.value = clamped;

      // node reactions
      for (let i = 0; i < N; i++) {
        const at = i / (N - 1);
        if (head >= at && !fired[i]) {
          fired[i] = t;
          if (i !== lastStage) { lastStage = i; cb.current?.(i); }
        }
        const since = fired[i] ? t - fired[i] : 99;
        const hit = Math.max(0, 1 - since / 0.85);
        const pulse = hit * hit;

        const rm = rings[i].material as THREE.MeshStandardMaterial;
        rm.emissiveIntensity = (fired[i] ? 0.55 : 0.05) + pulse * 2.4;
        rings[i].scale.setScalar(1 + pulse * 0.28);
        rings[i].rotation.z = reduced ? 0 : t * 0.5 + i;   // in-plane: stays a ring, never a sliver
        rings[i].rotation.x = 0.18;                          // fixed tilt for depth

        const cm = cores[i].material as THREE.MeshStandardMaterial;
        cm.emissiveIntensity = (fired[i] ? 0.5 : 0.1) + pulse * 2.2;
        cores[i].rotation.y = reduced ? 0 : -t * 0.6 + i;
        cores[i].scale.setScalar(1 + pulse * 0.5);
      }

      if (!reduced) {
        par.x += (aim.x * 0.16 - par.x) * 0.05;
        par.y += (aim.y * 0.1 - par.y) * 0.05;
        group.rotation.y = par.x;
        group.rotation.x = par.y;
      }

      group.updateMatrixWorld();
      renderer.render(scene, camera);

      // publish label positions at ~20fps, not every frame
      acc += dt;
      if (acc > 0.05) { acc = 0; publish(); }
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      if (fine) el.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="pipe" ref={host}>
      {markers.map((m, i) => (
        <span
          key={m.id}
          className={`pipe-label is-${m.side}${m.on ? " on" : ""}`}
          style={{ left: `${m.x}px`, top: `${m.y}px` }}
          aria-hidden="true"
        >
          <b>{STAGES[i].title}</b>
          <em>{STAGES[i].sub}</em>
        </span>
      ))}
      <p className="sr-only">
        Data flow: {STAGES.map((s) => `${s.title} (${s.sub})`).join(" → ")}.
      </p>
    </div>
  );
}
