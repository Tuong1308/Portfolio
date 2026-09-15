import { useCallback, useState } from "react";
import PipelineScene, { STAGES } from "../three/PipelineScene";
import Reveal from "../components/Reveal";
import Section from "../components/Section";
import { EXPERIENCE } from "../data";

/** The page's focal moment: a request travelling the stack, stage by stage. */
export default function Experience() {
  const [live, setLive] = useState(0);
  const onStage = useCallback((i: number) => setLive(i), []);

  return (
    <Section id="experience">
      <div className="wrap">
        <Reveal>
          <h2 className="h2">One request, through every layer I work in daily.</h2>
          <p className="lead">
            At <strong>{EXPERIENCE.company}</strong> I follow a feature from rough sketch to the point
            where it shows real numbers on a dashboard — this is the path it takes.
          </p>
        </Reveal>

        <Reveal delay={120} className="pipe-shell">
          <PipelineScene onStage={onStage} />
          <ul className="pipe-legend">
            {STAGES.map((s, i) => (
              <li key={s.id} className={i === live ? "on" : ""}>
                <b>{s.title}</b>
                <span>{s.sub}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="xp">
          <Reveal delay={60}>
            <div className="xp-meta">
              <h3 className="xp-co">{EXPERIENCE.company}</h3>
              <p className="xp-when">{EXPERIENCE.role}<br />{EXPERIENCE.when}</p>
            </div>
          </Reveal>

          <div className="xp-body">
            {EXPERIENCE.items.map((it, i) => (
              <Reveal key={it.heading} delay={80 + i * 60}>
                <article className="xp-item">
                  <h4>{it.heading}</h4>
                  <p>{it.summary}</p>
                  <ul className="stack">
                    {it.stack.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
