import type { Metadata } from "next";

import { ReservationForm } from "@/components/reservation-form";
import { getPublicCafeSettings } from "@/db/settings";
import { getReservationDefaults } from "@/lib/reservation-defaults";
import styles from "./reservation.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reserve a table",
  description: "Send a reservation request to Kōhi Coffee.",
};

export default async function ReservationPage() {
  const defaults = getReservationDefaults();
  const settings = await getPublicCafeSettings();
  const dailyHours = Object.values(settings.openingHours).filter(Boolean);
  const hoursText = dailyHours.length > 0 && new Set(dailyHours).size === 1 ? dailyHours[0] : "See our contact page";

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro} data-enter>
          <p className={styles.kicker}>
            <span>Reservation</span>
            <span className={styles.divider}>/</span>
            <span>We&apos;ll save you a seat</span>
          </p>
          <h1 className={styles.title}>
            Bring good
            <br />
            company.
          </h1>
          <p className={styles.description}>
            Send us your request and our team will confirm your table over WhatsApp.
          </p>
          <aside className={styles.note}>
            <h2>A little note before you book.</h2>
            <p>Your request is not confirmed until you hear from us.<br />We&apos;ll get back to you as soon as we can.</p>
            <p className={styles.hours}>
              <span>Open daily</span>
              <span>{hoursText}</span>
            </p>
          </aside>
        </section>

        <section className={styles.formCard} data-reveal aria-label="Reservation request form">
          <ReservationForm defaultDate={defaults.date} defaultTime={defaults.time} />
        </section>
      </div>
    </div>
  );
}
