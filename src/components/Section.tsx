import type { ReactNode } from "react";

/**
 * A page section that is also a scene.
 *
 * The two spans are the transition surfaces the scroll engine drives; having
 * one component own them means a new section cannot forget to include them,
 * and their markup only exists in one place.
 */
export default function Section({ id, className = "", children }: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`section scene ${className}`.trim()} id={id}>
      <span className="scene-veil" aria-hidden="true" />
      <span className="scene-cut" aria-hidden="true" />
      {children}
    </section>
  );
}
