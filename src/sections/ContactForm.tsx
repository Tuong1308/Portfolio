import { useState } from "react";
import { SendIcon } from "../components/icons";
import { PROFILE } from "../data";

/**
 * Leave this empty and the form opens the visitor's mail client with everything
 * filled in — no backend, and no pretending a message was delivered when it was
 * not. Paste a form endpoint (Formspree, Web3Forms, your own route) and the same
 * form POSTs to it instead.
 */
export const FORM_ENDPOINT = "";

type Status = "idle" | "sending" | "opened" | "sent" | "error";
type Errors = Partial<Record<"name" | "email" | "message", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Pure, so the rules can be reasoned about without a browser. */
export function validate(v: { name: string; email: string; message: string }): Errors {
  const e: Errors = {};
  if (!v.name) e.name = "Please tell me your name.";
  if (!v.email) e.email = "I need an address to reply to.";
  else if (!EMAIL_RE.test(v.email)) e.email = "That address looks incomplete.";
  if (!v.message) e.message = "Add a line or two about what you need.";
  return e;
}

export function buildMailto(v: { name: string; email: string; subject: string; message: string }) {
  const body = `${v.message}\n\n—\n${v.name}\n${v.email}`;
  const subject = v.subject || `Portfolio enquiry from ${v.name}`;
  return (
    `mailto:${PROFILE.email}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  );
}

const STATUS_TEXT: Record<Status, string> = {
  idle: "",
  sending: "",
  opened: "Your mail app should be open with the message ready — press send there and it reaches me.",
  sent: "Message sent. I'll get back to you shortly.",
  error: `That didn't go through. Email me directly at ${PROFILE.email}.`,
};

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const values = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      subject: String(data.get("subject") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
    };

    const found = validate(values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      setStatus("idle");
      return;
    }

    if (FORM_ENDPOINT) {
      setStatus("sending");
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: data,
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        setStatus("sent");
      } catch {
        setStatus("error");
      }
      return;
    }

    // Hand the message to the visitor's mail client and say exactly that.
    window.location.href = buildMailto(values);
    setStatus("opened");
  };

  const invalid = (n: keyof Errors) =>
    errors[n] ? { "aria-invalid": true as const, "aria-describedby": `${n}-err` } : {};

  return (
    <form className="contact-form" onSubmit={submit} noValidate>
      <div className="cf-row">
        <p className="cf-field">
          <label htmlFor="cf-name">Name</label>
          <input id="cf-name" name="name" type="text" placeholder="Your name"
                 autoComplete="name" {...invalid("name")} />
          {errors.name && <em id="name-err">{errors.name}</em>}
        </p>
        <p className="cf-field">
          <label htmlFor="cf-email">Email</label>
          <input id="cf-email" name="email" type="email" placeholder="you@company.com"
                 autoComplete="email" {...invalid("email")} />
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
                  placeholder="Write your message here…" {...invalid("message")} />
        {errors.message && <em id="message-err">{errors.message}</em>}
      </p>

      <button className="cf-send" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : FORM_ENDPOINT ? "Send message" : "Compose email"}
        <SendIcon />
      </button>

      <p className={`cf-status${status !== "idle" ? " show" : ""}`} role="status" aria-live="polite">
        {STATUS_TEXT[status]}
      </p>
    </form>
  );
}
