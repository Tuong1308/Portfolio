import HeroScene from "../three/HeroScene";
import Reveal from "../components/Reveal";
import { ArrowIcon, CodeIcon } from "../components/icons";
import { useTypewriter } from "../hooks";
import { HERO_ROLES, PROFILE } from "../data";

export default function Hero() {
  const typed = useTypewriter(HERO_ROLES);
  const city = PROFILE.location.split(",")[0];

  return (
    <header className="hero" id="top">
      <HeroScene />

      <div className="wrap">
        <Reveal>
          <p className="hero-status">
            <span className="pulse" aria-hidden="true" /> Open to new opportunities · {city}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h1>{PROFILE.name}</h1>
          <p className="hero-role" aria-label={PROFILE.role}>
            <span aria-hidden="true">{typed}</span>
            <span className="caret" aria-hidden="true" />
          </p>
        </Reveal>

        <Reveal delay={170}>
          <p className="hero-bio">
            {PROFILE.age}, with a Bachelor of Information Technology. I build web products end to end —
            a smooth interface in React/Next, a solid API in Node, clean data in PostgreSQL &amp; MongoDB,
            and I always go back and measure what I shipped.
          </p>
        </Reveal>

        <Reveal delay={250}>
          <div className="hero-cta">
            <a className="btn btn-primary" href="#projects">View projects <ArrowIcon /></a>
            <a className="btn btn-ghost" href={`mailto:${PROFILE.email}`}>Get in touch</a>
            <a className="btn btn-ghost" href={PROFILE.github} target="_blank" rel="noreferrer">
              <CodeIcon /> GitHub
            </a>
          </div>
        </Reveal>

        <Reveal delay={340}>
          <dl className="hero-now">
            <div><dt>Currently</dt><dd>{PROFILE.role} @ {PROFILE.company}</dd></div>
            <div><dt>Background</dt><dd>Bachelor of Information Technology</dd></div>
            <div><dt>Based in</dt><dd>{PROFILE.location} · open to remote</dd></div>
          </dl>
        </Reveal>
      </div>

      <span className="scroll-hint" aria-hidden="true"><span>Scroll</span><i /></span>
    </header>
  );
}
