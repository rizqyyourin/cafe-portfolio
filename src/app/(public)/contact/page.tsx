import type { Metadata } from "next";
import Image from "next/image";

import { getPublicCafeSettings } from "@/db/settings";
import { OpeningHoursModal } from "@/components/public/opening-hours-modal";
import styles from "./contact.module.css";

export const metadata: Metadata = { title: "Contact", description: "Find your way to Kōhi Coffee." };
export const dynamic = "force-dynamic";

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? `62${digits.slice(1)}` : digits}`;
}

function displayHours(hours: Record<string, string>) {
  const values = Object.values(hours).filter(Boolean);
  if (values.length > 0 && new Set(values).size === 1) return `Daily ${values[0]}`;
  return "See our weekly hours";
}

export default async function ContactPage() {
  const settings = await getPublicCafeSettings();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.intro} data-enter>
          <p className={styles.kicker}>Come say hello</p>
          <h1>Find your way in.</h1>
        </header>
        <section className={styles.details}>
          <div data-reveal="image">
            <figure className={styles.photo} data-hero-image>
              <Image alt="Coffee being prepared at a busy evening stall" fill priority sizes="(max-width: 760px) calc(100vw - 2.5rem), 58vw" src="https://images.unsplash.com/photo-1514066558159-fc8c737ef259?auto=format&fit=crop&w=1500&q=85" />
            </figure>
          </div>
          <address className={styles.info} data-stagger>
            <a className={styles.directions} href={settings.mapsUrl} rel="noreferrer" target="_blank"><p>Visit</p><strong>{settings.address}</strong></a>
            <div><p>Open</p><strong><OpeningHoursModal hours={settings.openingHours} triggerLabel={displayHours(settings.openingHours)} /></strong></div>
            <div><p>Contact</p><a href={phoneHref(settings.phone)}>{settings.phone}</a><a href={`mailto:${settings.email}`}>{settings.email}</a></div>
            <a className={styles.whatsapp} href={whatsappHref(settings.whatsapp)} rel="noreferrer" target="_blank">Chat on WhatsApp ↗</a>

          </address>
        </section>
      </div>
    </div>
  );
}
