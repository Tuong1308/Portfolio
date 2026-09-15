import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export const SKILLS = [
  "Python", "JavaScript", "TypeScript", "PostgreSQL", "MongoDB",
  "Node.js", "React", "Next.js", "Docker", "Power BI", "GA4",
];

/**
 * Interactive "tech constellation": skill nodes placed on a sphere with a
 * fibonacci distribution, wrapped in a wireframe icosahedron, drag to spin,
 * hover/tap a node to highlight it.
 */
export default function SkillsOrb() {
  const host = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);

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
    renderer.domElement.style.touchAction = "pan-y";
    renderer.domElement.style.cursor = "grab";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.set(0, 0, 7.2);

    const group = new THREE.Group();
    scene.add(group);

    // lights (for the node material)
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.PointLight(0x3ddc84, 45, 30);
    key.position.set(4, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xff5c26, 22, 30);
    rim.position.set(-5, -3, -4);
    scene.add(rim);

    // wireframe cage
    const cage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.55, 1),
      new THREE.MeshBasicMaterial({ color: 0x3ddc84, wireframe: true, transparent: true, opacity: 0.11 })
    );
    group.add(cage);

    const cage2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.05, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.05 })
    );
    group.add(cage2);

    // nodes on a fibonacci sphere
    const R = 2.55;
    const N = SKILLS.length;
    const nodeGeo = new THREE.SphereGeometry(0.145, 20, 20);
    const nodes: THREE.Mesh[] = [];
    const linePts: number[] = [];

    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = Math.PI * (3 - Math.sqrt(5)) * i;
      const p = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(R);

      const mat = new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? 0xff5c26 : 0x3ddc84,
        emissive: i % 3 === 0 ? 0x5a1c07 : 0x0c3b22,
        roughness: 0.32,
        metalness: 0.25,
      });
      const m = new THREE.Mesh(nodeGeo, mat);
      m.position.copy(p);
      m.userData = { skill: SKILLS[i], base: p.clone(), idx: i };
      group.add(m);
      nodes.push(m);

      linePts.push(0, 0, 0, p.x, p.y, p.z);
    }

    const lines = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(linePts, 3)),
      new THREE.LineBasicMaterial({ color: 0x3ddc84, transparent: true, opacity: 0.14 })
    );
    group.add(lines);

    const heart = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.42, 2),
      new THREE.MeshStandardMaterial({ color: 0x0f1512, emissive: 0x0e6b3c, roughness: 0.25, metalness: 0.6 })
    );
    group.add(heart);

    // ── resize ───────────────────────────────────────────────────────────
    const resize = () => {
      const w = el.clientWidth || 400;
      const h = el.clientHeight || 400;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w < 420 ? 9.0 : 8.0;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // ── interaction: drag + hover raycast ────────────────────────────────
    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2(999, 999);
    let dragging = false;
    let last = { x: 0, y: 0 };
    const vel = { x: 0.0018, y: 0.004 };
    let hovered: THREE.Mesh | null = null;

    const setPtr = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      ptr.x = ((cx - r.left) / r.width) * 2 - 1;
      ptr.y = -((cy - r.top) / r.height) * 2 + 1;
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      renderer.domElement.style.cursor = "grabbing";
      renderer.domElement.setPointerCapture?.(e.pointerId);
      setPtr(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      renderer.domElement.style.cursor = "grab";
      renderer.domElement.releasePointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      setPtr(e.clientX, e.clientY);
      if (!dragging) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      vel.y = dx * 0.006;
      vel.x = dy * 0.006;
    };

    const c = renderer.domElement;
    c.addEventListener("pointerdown", onDown);
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerup", onUp);
    c.addEventListener("pointercancel", onUp);
    c.addEventListener("pointerleave", () => { ptr.set(999, 999); });

    // ── loop (paused when off-screen) ────────────────────────────────────
    let inView = true;
    const io = new IntersectionObserver(([en]) => { inView = en.isIntersecting; }, { threshold: 0.02 });
    io.observe(el);

    const clock = new THREE.Clock();
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!inView || document.hidden) return;
      const t = clock.getElapsedTime();

      if (!dragging) {
        vel.x += (0.0009 - vel.x) * 0.045;
        vel.y += (0.0038 - vel.y) * 0.045;
      }
      if (!reduced) {
        group.rotation.y += vel.y;
        group.rotation.x += vel.x;
        group.rotation.x = THREE.MathUtils.clamp(group.rotation.x, -0.85, 0.85);
      }

      // hover detection
      ray.setFromCamera(ptr, camera);
      const hits = ray.intersectObjects(nodes, false);
      const next = (hits[0]?.object as THREE.Mesh) ?? null;
      if (next !== hovered) {
        hovered = next;
        setLabel(next ? (next.userData.skill as string) : null);
        c.style.cursor = next ? "pointer" : dragging ? "grabbing" : "grab";
      }

      nodes.forEach((n, i) => {
        const bob = Math.sin(t * 1.5 + i) * 0.055;
        n.position.copy(n.userData.base as THREE.Vector3).multiplyScalar(1 + bob * 0.04);
        const want = n === hovered ? 1.85 : 1;
        n.scale.lerp(new THREE.Vector3(want, want, want), 0.16);
        const mm = n.material as THREE.MeshStandardMaterial;
        mm.emissiveIntensity = THREE.MathUtils.lerp(mm.emissiveIntensity, n === hovered ? 2.6 : 1, 0.14);
      });

      heart.rotation.y -= 0.006;
      heart.rotation.x += 0.003;
      cage2.rotation.y += 0.0012;
      (cage.material as THREE.MeshBasicMaterial).opacity = 0.09 + Math.sin(t * 0.9) * 0.03;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      c.removeEventListener("pointerdown", onDown);
      c.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerup", onUp);
      c.removeEventListener("pointercancel", onUp);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      if (c.parentNode === el) el.removeChild(c);
    };
  }, []);

  return (
    <div className="skills-canvas" ref={host}>
      <div className={`orb-label${label ? " show" : ""}`}>
        <span>{label ?? "Drag to rotate"}</span>
      </div>
    </div>
  );
}
