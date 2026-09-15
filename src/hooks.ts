import { useEffect, useRef, useState } from "react";

/**
 * Live-updating `prefers-reduced-motion`, so the page reacts to the OS setting
 * being changed while it is open rather than only at load.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/** Adds `.in` once the element scrolls into view. */
export function useReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        timer = window.setTimeout(() => el.classList.add("in"), delay);
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(timer); };
  }, [delay]);
  return ref;
}

/** Which section id is currently in the viewport. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { threshold: [0.15, 0.4], rootMargin: "-20% 0px -45% 0px" }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [ids.join(",")]);
  return active;
}

/** Typewriter cycling through phrases. */
export function useTypewriter(words: string[], speed = 72, pause = 1700) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(words[0]);
      return;
    }
    let w = 0, i = 0, del = false, t = 0 as unknown as number;
    const run = () => {
      const word = words[w];
      i = del ? i - 1 : i + 1;
      setText(word.slice(0, i));
      let next = del ? speed / 2 : speed;
      if (!del && i === word.length) { del = true; next = pause; }
      else if (del && i === 0) { del = false; w = (w + 1) % words.length; next = 340; }
      t = window.setTimeout(run, next);
    };
    t = window.setTimeout(run, 500);
    return () => window.clearTimeout(t);
  }, [words.join("|"), speed, pause]);
  return text;
}

/**
 * One scroll engine for the whole page.
 *
 * Deliberately not using `animation-timeline: view()`: it is absent in several
 * shipping browsers, and it silently attaches to the wrong scrollport whenever an
 * ancestor computes to `overflow: hidden auto`. A single rAF loop behaves the same
 * everywhere and can be verified by looking at pixels.
 *
 * It marks <html> with `.js` first — that is what allows anything to start hidden,
 * so a failure here leaves a fully readable page rather than a blank one.
 */
export function useScrollEngine() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    root.classList.add("js");

    const scenes = Array.from(document.querySelectorAll<HTMLElement>(".scene"));
    if (!scenes.length) return () => root.classList.remove("js");

    // measure only what is near the viewport
    const live = new Set<HTMLElement>();
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) =>
          e.isIntersecting ? live.add(e.target as HTMLElement) : live.delete(e.target as HTMLElement)
        ),
      { rootMargin: "80% 0px 30% 0px" }
    );
    scenes.forEach((s) => io.observe(s));

    const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    let raf = 0;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || !live.size) return;
      const vh = window.innerHeight;

      // batch every read before any write, or each write invalidates the next read
      const reads: Array<[HTMLElement, number]> = [];
      live.forEach((el) => reads.push([el, el.getBoundingClientRect().top]));

      for (const [el, top] of reads) {
        const entry = clamp((vh - top) / vh);        // 0 as the top edge meets the fold
        // reduced motion keeps the cross-fade (it is opacity, not movement) and
        // loses only the sweeping line — gentler, not switched off
        const veil = 1 - clamp(entry / (reduced ? 0.4 : 0.58));
        const c = reduced ? 0 : clamp(entry / 0.62);  // the cut sweeps down across it
        const cut = c < 0.18 ? c / 0.18 : 1 - (c - 0.18) / 0.82;
        const st = el.style;
        st.setProperty("--veil", veil.toFixed(3));
        st.setProperty("--cut", clamp(cut).toFixed(3));
        st.setProperty("--cut-y", `${(c * 42 * vh) / 100}px`);
        st.setProperty("--cut-x", (0.25 + c * 0.75).toFixed(3));
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      root.classList.remove("js");
    };
  }, []);
}
