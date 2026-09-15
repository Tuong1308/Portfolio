import type { CSSProperties } from "react";
import SkillsOrb from "../three/SkillsOrb";
import SkillMarquee from "../components/SkillMarquee";
import Reveal from "../components/Reveal";
import Section from "../components/Section";
import { SKILL_GROUPS } from "../data";

export default function Skills() {
  // one running index across all groups, so the stagger reads as a single pass
  let n = 0;

  return (
    <Section id="skills">
      <div className="wrap">
        <Reveal>
          <h2 className="h2">The toolkit I reach for daily.</h2>
          <p className="lead">Drag the sphere to spin it — hover or tap a node to name the technology.</p>
        </Reveal>

        <div className="skills-grid">
          <Reveal delay={80}><SkillsOrb /></Reveal>

          <Reveal delay={150}>
            <div className="skill-cats">
              {SKILL_GROUPS.map((g) => (
                <div className="skill-cat" key={g.title}>
                  <h3>{g.title}</h3>
                  <ul className="skill-tags stagger">
                    {g.items.map((s) => (
                      <li className="skill-tag" key={s} style={{ "--i": n++ } as CSSProperties}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <Reveal delay={220} className="mq-band">
        <SkillMarquee />
      </Reveal>
    </Section>
  );
}
