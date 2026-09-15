import type { ReactNode } from "react";
import { useReveal } from "../hooks";

/** A block that arrives once it scrolls into view. */
export default function Reveal({ children, delay = 0, className = "" }: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useReveal<HTMLDivElement>(delay);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}
