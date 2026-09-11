"use client";

export default function SettingsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div aria-live="polite" className="grid min-h-[28rem] place-items-center rounded-md border bg-[#fffdf9] p-8 text-center" role="alert"><div><p className="eyebrow">Configuration</p><h1 className="display mt-4 text-4xl font-medium">Cafe settings unavailable</h1><p className="mt-3 text-sm text-muted-foreground">Nothing was changed. Try loading the settings again.</p><button className="mt-6 rounded-md bg-[#2c2926] px-5 py-3 text-sm font-semibold text-[#fffaf3]" onClick={reset} type="button">Try again</button></div></div>;
}
