import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform vec3  uMouse;      // world-ish pointer position
  uniform float uBurst;      // 0..1 intro expansion

  attribute float aScale;
  attribute float aSeed;

  varying float vFade;
  varying float vMix;

  // cheap hash noise
  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }

  void main() {
    vec3 pos = position;

    // organic drift
    float t = uTime * 0.28 + aSeed * 6.2831;
    pos += vec3(
      sin(t * 1.10 + pos.y * 0.7),
      cos(t * 0.90 + pos.z * 0.7),
      sin(t * 1.30 + pos.x * 0.7)
    ) * 0.22;

    // intro burst: particles fly outward from centre
    pos *= mix(0.25, 1.0, uBurst);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // pointer repulsion in view space
    vec3 d = mv.xyz - uMouse;
    float dist = length(d.xy);
    float force = smoothstep(2.6, 0.0, dist);
    mv.xyz += normalize(vec3(d.xy, 0.35)) * force * 0.85;

    vMix  = force;
    vFade = clamp(1.0 - (-mv.z - 3.0) / 11.0, 0.05, 1.0);

    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * (1.0 + force * 1.2) * (9.0 / -mv.z);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying float vFade;
  varying float vMix;

  void main() {
    // soft round sprite, no texture needed
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float alpha = smoothstep(0.5, 0.06, d);
    if (alpha < 0.01) discard;

    vec3 col = mix(uColorA, uColorB, clamp(vMix * 1.6, 0.0, 1.0));
    gl_FragColor = vec4(col, alpha * vFade * 0.55);
  }
`;

export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // no webgl -> hero still looks fine without it
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 100);
    camera.position.set(0, 0, 8.4);

    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // ── particle cloud (sphere shell + inner haze) ────────────────────────
    const isMobile = window.innerWidth < 760;
    const COUNT = isMobile ? 2600 : 6200;

    const positions = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // fibonacci-ish spherical distribution with radial jitter
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const shell = Math.random() < 0.72;
      const r = shell ? 3.0 + Math.random() * 0.35 : Math.pow(Math.random(), 0.55) * 2.9;

      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.92;
      positions[i * 3 + 2] = r * Math.cos(phi);

      scales[i] = 0.45 + Math.random() * (shell ? 1.5 : 0.8);
      seeds[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const uniforms = {
      uTime: { value: 0 },
      uSize: { value: isMobile ? 2.6 : 3.2 },
      uMouse: { value: new THREE.Vector3(999, 999, 0) },
      uBurst: { value: 0 },
      uColorA: { value: new THREE.Color("#3ddc84") },
      uColorB: { value: new THREE.Color("#ff8a4c") },
    };

    const points = new THREE.Points(
      geo,
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(points);

    // ── wireframe core ───────────────────────────────────────────────────
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.55, 1),
      new THREE.MeshBasicMaterial({
        color: 0x3ddc84,
        wireframe: true,
        transparent: true,
        opacity: 0.14,
      })
    );
    scene.add(core);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 32, 32),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        uniforms: { uT: { value: 0 } },
        vertexShader: `
          varying vec3 vN; varying vec3 vV;
          void main(){
            vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position,1.0);
            vV = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform float uT; varying vec3 vN; varying vec3 vV;
          void main(){
            float f = pow(1.0 - abs(dot(normalize(vV), vN)), 2.4);
            float pulse = 0.72 + 0.28 * sin(uT * 1.4);
            gl_FragColor = vec4(vec3(0.24,0.86,0.52) * f * pulse, f * 0.28);
          }`,
      })
    );
    scene.add(halo);

    // ── sizing ───────────────────────────────────────────────────────────
    const resize = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 0.85 ? 74 : 58;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // ── pointer ──────────────────────────────────────────────────────────
    const ndc = new THREE.Vector2(0, 0);
    const target = new THREE.Vector2(0, 0);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const ray = new THREE.Raycaster();
    const hit = new THREE.Vector3();
    let hovering = false;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      target.set(ndc.x, ndc.y);
      hovering = true;
    };
    const onLeave = () => { hovering = false; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    // ── loop ─────────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    const parallax = new THREE.Vector2();
    let raf = 0;
    let visible = true;
    let scrollY = 0;

    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    const onVis = () => { visible = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;

      const t = clock.getElapsedTime();
      // stop drawing once hero is far off-screen
      if (scrollY > window.innerHeight * 1.25) return;

      uniforms.uTime.value = t;
      uniforms.uBurst.value = reduced ? 1 : Math.min(1, 0.12 + t / 1.9);
      (halo.material as THREE.ShaderMaterial).uniforms.uT.value = t;

      // pointer -> view-space point on z=0 plane
      if (hovering && !reduced) {
        ray.setFromCamera(ndc, camera);
        if (ray.ray.intersectPlane(plane, hit)) {
          uniforms.uMouse.value.copy(hit.clone().applyMatrix4(camera.matrixWorldInverse));
        }
      } else {
        uniforms.uMouse.value.set(999, 999, 0);
      }

      parallax.x += (target.x * 0.32 - parallax.x) * 0.045;
      parallax.y += (target.y * 0.22 - parallax.y) * 0.045;

      const spin = reduced ? 0 : t * 0.055;
      points.rotation.y = spin + parallax.x;
      points.rotation.x = -parallax.y * 0.8 + Math.sin(t * 0.18) * 0.06;
      core.rotation.y = -spin * 2.2;
      core.rotation.x = spin * 1.1;
      core.scale.setScalar(1 + Math.sin(t * 1.1) * 0.035);
      halo.scale.setScalar(1 + Math.sin(t * 1.1) * 0.05);

      camera.position.y = -scrollY * 0.0014;

      renderer.render(scene, camera);
    };
    tick();

    const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); };
    renderer.domElement.addEventListener("webglcontextlost", onLost);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="hero-canvas" ref={host} aria-hidden="true" />;
}
