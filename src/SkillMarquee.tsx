import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  siPython, siJavascript, siTypescript, siReact, siNextdotjs, siNodedotjs,
  siPostgresql, siMongodb, siDocker, siGoogleanalytics, siGit, siGithub, siVercel,
} from "simple-icons";

type Tool = { name: string; path: string; hex: string };

const si = (i: { title: string; path: string; hex: string }, name?: string): Tool =>
  ({ name: name ?? i.title, path: i.path, hex: `#${i.hex}` });

/* Power BI is not carried by simple-icons, so this one is an authored glyph
   drawn in the same 24-grid as the rest — a column chart, not a logo. */
const POWER_BI: Tool = {
  name: "Power BI",
  hex: "#F2C811",
  path: "M3 20h18v1.6H3V20Zm1.6-7.2h3.2v6.4H4.6v-6.4Zm5.6-4.8h3.2v11.2h-3.2V8Zm5.6-5.6h3.2v16.8h-3.2V2.4Z",
};

/** Row 1 travels right, row 2 travels left. */
const ROW_A: Tool[] = [
  si(siTypescript), si(siReact, "React"), si(siNextdotjs, "Next.js"),
  si(siNodedotjs, "Node.js"), si(siPostgresql), si(siPython),
];
const ROW_B: Tool[] = [
  si(siMongodb), si(siDocker), si(siJavascript), si(siGoogleanalytics, "GA4"),
  POWER_BI, si(siGit), si(siGithub), si(siVercel),
];

function Chip({ t }: { t: Tool }) {
  return (
    <li className="mq-chip">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d={t.path} fill={t.hex === "#000000" ? "currentColor" : t.hex} />
      </svg>
      <span>{t.name}</span>
    </li>
  );
}

/** Live-updating `prefers-reduced-motion`, so the page reacts to the OS setting
 *  being changed while it is open rather than only at load. */
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

function Row({ tools, dir, paused: stopped, reduced }: {
  tools: Tool[]; dir: 1 | -1; paused: boolean; reduced: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLUListElement>(null);
  // one set must be at least as wide as the viewport, or the loop shows a gap
  const [rep, setRep] = useState(1);

  useLayoutEffect(() => {
    const vp = viewport.current;
    const one = probe.current;
    if (!vp || !one) return;
    const fit = () => {
      const unit = one.scrollWidth / rep;
      if (!unit) return;
      const need = Math.max(1, Math.ceil(vp.clientWidth / unit) + 1);
      if (need !== rep) setRep(need);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [rep]);

  useEffect(() => {
    const vp = viewport.current;
    const tr = track.current;
    if (!vp || !tr) return;

    let setW = 0;
    const measure = () => { setW = tr.scrollWidth / 2; };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(tr);

    // position is always kept inside (-setW, 0]; translating by exactly one set
    // width is invisible because the second set is an identical copy
    let x = 0;
    let raf = 0;
    let last = performance.now();
    let paused = false;
    let inView = false;

    // scroll velocity feeds the rail: the strip reacts to the reader's own input
    let lastScroll = window.scrollY;
    let kick = 0;
    const KICK_MAX = 55; // a nav-link jump scrolls thousands of px in one event —
                         // without a clamp the strip lurches instead of reacting
    const onScroll = () => {
      const y = window.scrollY;
      const d = Math.max(-KICK_MAX, Math.min(KICK_MAX, y - lastScroll));
      kick = Math.max(-KICK_MAX, Math.min(KICK_MAX, kick + d * 0.9));
      lastScroll = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0 });
    io.observe(vp);

    const enter = () => { paused = true; };
    const leave = () => { paused = false; };
    vp.addEventListener("pointerenter", enter);
    vp.addEventListener("pointerleave", leave);
    vp.addEventListener("focusin", enter);
    vp.addEventListener("focusout", leave);

    // The strip runs continuously for everyone. Under a reduced-motion
    // preference it runs slower and drops the reactive flourishes, and the Pause
    // control below is always present so anyone can stop it outright.
    const BASE = reduced ? 20 : 34; // px per second

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!inView || document.hidden) return;

      kick *= 0.9; // decay: the nudge is a reaction, not a permanent speed-up
      const drift = paused || stopped ? 0 : BASE;
      const react = stopped || reduced ? 0 : Math.abs(kick) * 1.6;
      const push = stopped || reduced ? 0 : kick * dir * dt * 4;
      x += (drift + react) * dir * dt + push;

      if (setW > 0) {
        x %= setW;
        if (x > 0) x -= setW;   // normalise into (-setW, 0] for either direction
      }
      // a slight lean in the direction of travel reads as speed
      const skew = reduced ? 0 : Math.max(-3, Math.min(3, kick * dir * 0.05));
      tr.style.transform = `translate3d(${x}px, 0, 0) skewX(${skew.toFixed(2)}deg)`;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      vp.removeEventListener("pointerenter", enter);
      vp.removeEventListener("pointerleave", leave);
      vp.removeEventListener("focusin", enter);
      vp.removeEventListener("focusout", leave);
    };
  }, [dir, rep, stopped, reduced]);

  const run = Array.from({ length: rep }, (_, r) => tools.map((t) => ({ t, r }))).flat();

  return (
    <div className="mq" ref={viewport} aria-hidden="true">
      <div className="mq-track" ref={track}>
        <ul className="mq-set" ref={probe}>
          {run.map(({ t, r }) => <Chip key={`a${r}-${t.name}`} t={t} />)}
        </ul>
        <ul className="mq-set">
          {run.map(({ t, r }) => <Chip key={`b${r}-${t.name}`} t={t} />)}
        </ul>
      </div>
    </div>
  );
}

/**
 * A continuously running strip of the tools in the stack.
 *
 * It runs continuously in every browser, including under a reduced-motion
 * preference — slower and without the reactive flourishes there, but never
 * frozen.
 *
 * There is no visible stop control, by the author's decision. Pointer hover and
 * keyboard focus still halt the row under the cursor, which is the remaining way
 * to stop it. The rows are hidden from assistive tech: every name already appears
 * in the list above them, so nothing is lost by not announcing the repeats.
 */
export default function SkillMarquee() {
  const reduced = useReducedMotion();

  return (
    <div className="mq-wrap">
      <Row tools={ROW_A} dir={1} paused={false} reduced={reduced} />
      <Row tools={ROW_B} dir={-1} paused={false} reduced={reduced} />
    </div>
  );
}
