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
            <Reveal key={e.heading} delay={60 + i * 70}>
              <div className="edu-card">
                <p className="yr">{e.kind}</p>
                <h3>{e.heading}</h3>
                <p>{e.summary}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
