import { useEffect, useRef, useState } from "react";
import { useActiveSection } from "../hooks";
import { NAV, PROFILE } from "../data";
import { ArrowIcon } from "./icons";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(NAV.map((n) => n.id));
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("locked", open);
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("locked");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // a closed panel must not be reachable by Tab
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    if (open) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [open]);

  return (
    <>
      <nav className={`nav${scrolled ? " scrolled" : ""}`} aria-label="Main">
        <a href="#top" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-dot" aria-hidden="true">T</span>
          <span className="brand-name">{PROFILE.short}</span>
        </a>

        <div className="nav-links">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={`nav-link${active === n.id ? " active" : ""}`}
              aria-current={active === n.id ? "true" : undefined}
            >
              {n.label}
            </a>
          ))}
        </div>

        <div className="nav-end">
          <a href="#contact" className="btn btn-primary nav-cta">Get in touch</a>
          <button
            className={`burger${open ? " open" : ""}`}
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <span /><span />
          </button>
        </div>
      </nav>

      <div id="mobile-menu" className={`mobile-menu${open ? " open" : ""}`} ref={panel}>
        {NAV.map((n) => (
          <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)}>{n.label}</a>
        ))}
        <a
          className="btn btn-primary mm-cta"
          href={`mailto:${PROFILE.email}`}
          onClick={() => setOpen(false)}
        >
          Email me <ArrowIcon />
        </a>
      </div>
    </>
  );
}
