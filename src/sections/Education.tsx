import Reveal from "../components/Reveal";
import Section from "../components/Section";
import { EDUCATION } from "../data";

export default function Education() {
  return (
    <Section id="education">
      <div className="wrap">
        <Reveal><h2 className="h2">Formal grounding, self-taught depth.</h2></Reveal>

        <div className="edu">
          {EDUCATION.map((e, i) => (
            <Reveal key={e.h} delay={60 + i * 70}>
              <div className="edu-card">
                <p className="yr">{e.yr}</p>
                <h3>{e.h}</h3>
                <p>{e.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
