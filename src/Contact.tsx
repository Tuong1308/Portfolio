import { useRef, useState } from "react";
import { PROFILE } from "./data";

/**
 * Leave this empty and the form opens the visitor's mail client with everything
 * filled in — no backend, and no pretending a message was delivered when it was
 * not. Paste a form endpoint (Formspree, Web3Forms, your own route) and the same
 * form POSTs to it instead.
 */
const FORM_ENDPOINT = "";

const sw = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const Icon = {
  mail: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...sw}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...sw}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...sw}>
      <path d="M6.5 2.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 4.7 2 2 0 0 1 6.5 2.5Z" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" width="16" height="16" {...sw}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" width="16" height="16" {...sw}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...sw}>
      <path d="m8.5 8.5-4 3.5 4 3.5M15.5 8.5l4 3.5-4 3.5M13.4 5.5l-2.8 13" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" width="17" height="17" {...sw}>
      <path d="M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8 21 3Z" />
    </svg>
  ),
};

/* ── a value you can take away with one click ───────────────── */
function CopyLine({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef(0);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // clipboard is blocked outside a secure context — select it instead so the
      // visitor can still copy manually rather than getting a silent no-op
      const r = document.createRange();
      const el = document.getElementById(`cv-${value}`);
      if (el) {
        r.selectNodeContents(el);
        const sel = getSelection();
        sel?.removeAllRanges();
        sel?.addRange(r);
      }
      return;
    }
    setDone(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 1600);
  };

  return (
    <span className="copy-line">
      <span id={`cv-${value}`}>{value}</span>
      <button
        type="button"
        className={`copy-btn${done ? " done" : ""}`}
        onClick={copy}
        aria-label={done ? `${value} copied` : `Copy ${value}`}
      >
        {done ? Icon.check : Icon.copy}
      </button>
      <span className="sr-only" role="status">{done ? "Copied to clipboard" : ""}</span>
    </span>
  );
}

type Status = { kind: "idle" | "sending" | "opened" | "sent" | "error"; note?: string };

export default function Contact() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const subject = String(data.get("subject") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const next: Record<string, string> = {};
    if (!name) next.name = "Please tell me your name.";
    if (!email) next.email = "I need an address to reply to.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = "That address looks incomplete.";
    if (!message) next.message = "Add a line or two about what you need.";
    setErrors(next);
    if (Object.keys(next).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      setStatus({ kind: "idle" });
      return;
    }

    if (FORM_ENDPOINT) {
      setStatus({ kind: "sending" });
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: data,
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        setStatus({ kind: "sent" });
      } catch {
        setStatus({ kind: "error" });
      }
      return;
    }

    // No endpoint configured: hand the message to the visitor's mail client.
    // Say exactly that — never claim it was sent.
    const body = `${message}\n\n—\n${name}\n${email}`;
    window.location.href =
      `mailto:${PROFILE.email}` +
      `?subject=${encodeURIComponent(subject || `Portfolio enquiry from ${name}`)}` +
      `&body=${encodeURIComponent(body)}`;
    setStatus({ kind: "opened" });
  };

  const field = (n: string) => (errors[n] ? { "aria-invalid": true, "aria-describedby": `${n}-err` } : {});

  return (
    <section className="section contact scene" id="contact">
      <span className="scene-veil" aria-hidden="true" />
      <span className="scene-cut" aria-hidden="true" />

      <div className="wrap contact-grid">
        {/* ── left: the invitation ─────────────────────────── */}
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
            <div className="crow">
              <span className="crow-ico" aria-hidden="true">{Icon.mail}</span>
              <div>
                <dt>Email</dt>
                <dd><CopyLine value={PROFILE.email} /></dd>
              </div>
            </div>
            <div className="crow">
              <span className="crow-ico" aria-hidden="true">{Icon.phone}</span>
              <div>
                <dt>Phone</dt>
                <dd><CopyLine value={PROFILE.phone} /></dd>
              </div>
            </div>
            <div className="crow">
              <span className="crow-ico" aria-hidden="true">{Icon.pin}</span>
              <div>
                <dt>Location</dt>
                <dd>{PROFILE.location}</dd>
              </div>
            </div>
          </dl>

          <ul className="contact-social">
            <li>
              <a href={PROFILE.github} target="_blank" rel="noreferrer" aria-label="GitHub profile">
                {Icon.code}
              </a>
            </li>
            <li>
              <a href={`mailto:${PROFILE.email}`} aria-label="Send an email">{Icon.mail}</a>
            </li>
            <li>
              <a href={`tel:${PROFILE.phone}`} aria-label="Call">{Icon.phone}</a>
            </li>
          </ul>
        </div>

        {/* ── right: the form ──────────────────────────────── */}
        <form className="contact-form" onSubmit={submit} noValidate>
          <div className="cf-row">
            <p className="cf-field">
              <label htmlFor="cf-name">Name</label>
              <input id="cf-name" name="name" type="text" placeholder="Your name"
                     autoComplete="name" {...field("name")} />
              {errors.name && <em id="name-err">{errors.name}</em>}
            </p>
            <p className="cf-field">
              <label htmlFor="cf-email">Email</label>
              <input id="cf-email" name="email" type="email" placeholder="you@company.com"
                     autoComplete="email" {...field("email")} />
              {errors.email && <em id="email-err">{errors.email}</em>}
            </p>
          </div>

          <p className="cf-field">
            <label htmlFor="cf-subject">Subject</label>
            <input id="cf-subject" name="subject" type="text" placeholder="What is this about?" />
          </p>

          <p className="cf-field">
            <label htmlFor="cf-message">Message</label>
            <textarea id="cf-message" name="message" rows={6}
                      placeholder="Write your message here…" {...field("message")} />
            {errors.message && <em id="message-err">{errors.message}</em>}
          </p>

          <button className="cf-send" type="submit" disabled={status.kind === "sending"}>
            {status.kind === "sending" ? "Sending…" : FORM_ENDPOINT ? "Send message" : "Compose email"}
            {Icon.send}
          </button>

          <p className={`cf-status${status.kind !== "idle" ? " show" : ""}`} role="status" aria-live="polite">
            {status.kind === "opened" &&
              "Your mail app should be open with the message ready — press send there and it reaches me."}
            {status.kind === "sent" && "Message sent. I'll get back to you shortly."}
            {status.kind === "error" &&
              `That didn't go through. Email me directly at ${PROFILE.email}.`}
          </p>
        </form>
      </div>
    </section>
  );
}
