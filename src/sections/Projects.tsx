import Reveal from "../components/Reveal";
import Section from "../components/Section";
import { CodeIcon, OutIcon } from "../components/icons";
import { PROJECTS } from "../data";
import type { Project } from "../data";

/** A stand-in for a screenshot: structure, not a fake picture of the site. */
function BrowserFrame({ host }: { host: string }) {
  return (
    <span className="browser">
      <span className="browser-bar">
        <i /><i /><i />
        <span className="url">{host}</span>
      </span>
      <span className="browser-body">
        <span className="sk w1" /><span className="sk w2" /><span className="sk w3" />
        <span className="sk-row">
          <span className="sk-box" /><span className="sk-box" /><span className="sk-box" />
        </span>
      </span>
    </span>
  );
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <article className="proj">
      <div className="proj-info">
        <h3>{p.name}</h3>
        <p className="proj-tag">{p.tagline}</p>
        <p>{p.desc}</p>
        <ul className="proj-points">{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
        <ul className="stack">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
        <div className="proj-links">
          <a className="btn btn-primary" href={p.live} target="_blank" rel="noreferrer">
            Live site <OutIcon />
          </a>
          <a className="btn btn-ghost" href={p.repo} target="_blank" rel="noreferrer">
            <CodeIcon /> Source
          </a>
        </div>
      </div>

      <a
        className="proj-visual"
        href={p.live}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${p.name} in a new tab`}
      >
        <BrowserFrame host={p.host} />
      </a>
    </article>
  );
}

export default function Projects() {
  return (
    <Section id="projects">
      <div className="wrap">
        <Reveal>
          <h2 className="h2">Two products I built, deployed, and still keep running.</h2>
          <p className="lead">Open the live build and try it, or read the source straight on GitHub.</p>
        </Reveal>

        <div className="proj-list">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.name} delay={60 + i * 80}>
              <ProjectCard p={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
