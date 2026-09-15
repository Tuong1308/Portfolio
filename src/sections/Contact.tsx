import type { ReactNode } from "react";
import Section from "../components/Section";
import CopyLine from "../components/CopyLine";
import ContactForm from "./ContactForm";
import { CodeIcon, MailIcon, PhoneIcon, PinIcon } from "../components/icons";
import { PROFILE } from "../data";

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="crow">
      <span className="crow-ico" aria-hidden="true">{icon}</span>
      <div>
        <dt>{label}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}

export default function Contact() {
  return (
    <Section id="contact" className="contact">
      <div className="wrap contact-grid">
        <div className="contact-lead">
          <h2 className="contact-h">
            Let&apos;s connect,
            <span> and build something that runs.</span>
          </h2>
          <p className="contact-copy">
            Whether you already have a spec or just want to talk through what a build would take,
            I&apos;m happy to have the conversation. I reply fast.
          </p>

          <dl className="contact-rows">
            <Row icon={<MailIcon size={19} />} label="Email">
              <CopyLine value={PROFILE.email} />
            </Row>
            <Row icon={<PhoneIcon size={19} />} label="Phone">
              <CopyLine value={PROFILE.phone} />
            </Row>
            <Row icon={<PinIcon size={19} />} label="Location">
              {PROFILE.location}
            </Row>
          </dl>

          <ul className="contact-social">
            <li>
              <a href={PROFILE.github} target="_blank" rel="noreferrer" aria-label="GitHub profile">
                <CodeIcon size={19} />
              </a>
            </li>
            <li>
              <a href={`mailto:${PROFILE.email}`} aria-label="Send an email">
                <MailIcon size={19} />
              </a>
            </li>
            <li>
              <a href={`tel:${PROFILE.phone}`} aria-label="Call">
                <PhoneIcon size={19} />
              </a>
            </li>
          </ul>
        </div>

        <ContactForm />
      </div>
    </Section>
  );
}
