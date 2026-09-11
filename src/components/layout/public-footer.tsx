import type { CafeSettings } from "@/db/settings";
import { siteConfig } from "@/lib/site";

export function PublicFooter({ settings }: { settings?: CafeSettings }) {
  const name = settings?.cafeName || siteConfig.name;
  const socialLinks = [
    ["Instagram", settings?.instagram],
    ["Threads", settings?.threads],
    ["Twitter", settings?.twitter],
    ["Facebook", settings?.facebook],
    ["TikTok", settings?.tiktok],
  ] as const;

  return (
    <footer className="bg-[#2d2926] py-5 text-[#dbd2c2]">
      <div className="shell flex flex-col gap-3 text-[0.53rem] font-bold tracking-[0.13em] uppercase sm:flex-row sm:items-center sm:justify-between" data-reveal>
        <p>{name} © {new Date().getFullYear()}</p>
        <div className="flex flex-wrap gap-5">{socialLinks.map(([label, href]) => href ? <a className="transition-colors hover:text-white" href={href} key={label} rel="noreferrer" target="_blank">{label}</a> : null)}</div>
      </div>
    </footer>
  );
}
