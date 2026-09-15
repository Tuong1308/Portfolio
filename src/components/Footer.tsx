import { PROFILE } from "../data";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <p>© {new Date().getFullYear()} {PROFILE.name} — Fullstack Developer</p>
        <p>
          React · Vite · three.js ·{" "}
          <a href={PROFILE.github} target="_blank" rel="noreferrer">GitHub</a>
        </p>
      </div>
    </footer>
  );
}
