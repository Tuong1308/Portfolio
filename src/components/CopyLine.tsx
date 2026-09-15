import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";

/** A value the visitor can take away in one click, with honest feedback. */
export default function CopyLine({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // clipboard is unavailable outside a secure context — select the text so
      // the visitor can still copy it manually rather than getting a silent no-op
      const node = textRef.current;
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const sel = getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      return;
    }
    setDone(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 1600);
  };

  return (
    <span className="copy-line">
      <span ref={textRef}>{value}</span>
      <button
        type="button"
        className={`copy-btn${done ? " done" : ""}`}
        onClick={copy}
        aria-label={done ? `${value} copied` : `Copy ${value}`}
      >
        {done ? <CheckIcon /> : <CopyIcon />}
      </button>
      <span className="sr-only" role="status">{done ? "Copied to clipboard" : ""}</span>
    </span>
  );
}
