import Link from "next/link";

import type { CafeSettings } from "@/db/settings";
import { siteConfig } from "@/lib/site";

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? `62${digits.slice(1)}` : digits}`;
}

export function PublicFooter({ settings }: { settings?: CafeSettings }) {
  const name = settings?.cafeName || siteConfig.name;
  const instagram = settings?.instagram || "https://instagram.com";
  const whatsapp = settings?.whatsapp ? whatsappHref(settings.whatsapp) : "https://wa.me/628111111111";

  return (
    <footer className="bg-[#2d2926] py-5 text-[#dbd2c2]">
      <div className="shell flex flex-col gap-3 text-[0.53rem] font-bold tracking-[0.13em] uppercase sm:flex-row sm:items-center sm:justify-between" data-reveal>
        <p>{name} © {new Date().getFullYear()}</p>
        <div className="flex gap-5"><a className="transition-colors hover:text-white" href={instagram} rel="noreferrer" target="_blank">Instagram</a><a className="transition-colors hover:text-white" href={whatsapp} rel="noreferrer" target="_blank">WhatsApp</a><Link className="transition-colors hover:text-white" href="/privacy">Privacy</Link></div>
      </div>
    </footer>
  );
}
