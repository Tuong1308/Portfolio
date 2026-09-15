import Reveal from "../components/Reveal";
import Section from "../components/Section";
import { ABOUT_FACTS, PROFILE } from "../data";

export default function About() {
  return (
    <Section id="about">
      <div className="wrap">
        <div className="about-grid">
          <Reveal>
            <h2 className="h2">I care about products that run, not demos that look good.</h2>
            <div className="about-copy">
              <p>
                I&apos;m <strong>{PROFILE.name}</strong>, {PROFILE.age}, a fullstack developer in{" "}
                <strong>{PROFILE.location}</strong>. It started on the frontend — I loved the feeling of an
                interface answering instantly — then worked backwards into the backend and the data to
                understand what actually makes a product run.
              </p>
              <p>
                Right now I&apos;m an <strong>{PROFILE.role} at {PROFILE.company}</strong>, working across
                <strong> ReactJS/NextJS</strong> on the interface, <strong>NodeJS</strong> on the API, and{" "}
                <strong>PostgreSQL &amp; MongoDB</strong> on the data layer — with the whole thing packaged
                in <strong>Docker</strong>.
              </p>
              <p>
                What sets me apart a little: I don&apos;t stop when a feature reaches production. I wire up{" "}
                <strong>GA4</strong> and build <strong>Power BI</strong> dashboards to see what users actually
                do, then go back and fix the part that needed fixing.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <dl className="facts">
              {ABOUT_FACTS.map(([k, v]) => (
                <div className="fact" key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
