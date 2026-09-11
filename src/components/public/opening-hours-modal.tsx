"use client";

import { useEffect, useState } from "react";

export function OpeningHoursModal({ hours, triggerLabel = "See our weekly hours" }: { hours: Record<string, string>; triggerLabel?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return <>
    <button className="underline decoration-[#b9a16a] underline-offset-4 transition-colors hover:text-[#9c875b]" onClick={() => setIsOpen(true)} type="button">{triggerLabel}</button>
    {isOpen ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#1e1b18]/65 p-5" onClick={() => setIsOpen(false)}>
      <section aria-labelledby="opening-hours-title" aria-modal="true" className="relative w-full max-w-md rounded-md bg-[#fffdf9] p-6 text-[#1e1b18] shadow-2xl sm:p-8" onClick={(event) => event.stopPropagation()} role="dialog">
        <div className="flex items-start justify-between gap-5">
          <div><p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8d7540]">Opening hours</p><h2 className="display mt-3 text-3xl font-medium" id="opening-hours-title">Come by anytime.</h2></div>
          <button aria-label="Close opening hours" className="text-2xl leading-none text-[#70685e] hover:text-[#1e1b18]" onClick={() => setIsOpen(false)} type="button">×</button>
        </div>
        <dl className="mt-7 divide-y divide-[#ded2c2] border-y border-[#ded2c2]">{Object.entries(hours).map(([day, value]) => <div className="flex items-center justify-between gap-5 py-3" key={day}><dt className="text-sm font-semibold">{day}</dt><dd className="text-sm text-[#70685e]">{value || "Closed"}</dd></div>)}</dl>
      </section>
    </div> : null}
  </>;
}
