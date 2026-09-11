import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="border-b border-black/8 py-16 sm:py-24">
      <div className="shell max-w-3xl" data-enter>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-5 text-5xl font-semibold leading-[0.94] sm:text-7xl">{title}</h1>
        <div className="mt-7 max-w-xl text-base leading-7 text-muted-foreground">{children}</div>
      </div>
    </section>
  );
}
