import type { Metadata } from "next";

import { MenuCatalog } from "@/components/menu-catalog";
import { getPublicMenuPageData } from "@/db/menu";
import styles from "./menu.module.css";

export const metadata: Metadata = { title: "Menu", description: "Seasonal coffee, honest plates, and little things worth lingering over at Kōhi Coffee." };
export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const data = await getPublicMenuPageData();

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <header data-enter>
          <p className={styles.kicker}>Our menu <span>/</span> Made with intention</p>
          <h1>The good stuff.</h1>
          <p className={styles.intro}>Seasonal coffee, honest plates, and little things worth lingering over.</p>
        </header>
        <MenuCatalog categories={data.categories} items={data.items} />
        <aside className={styles.availability} data-reveal><p>Menu availability can change with the rhythm of the day.</p><a href="mailto:hello@kohicoffee.example">Ask us about allergens <span aria-hidden="true">→</span></a></aside>
      </div>
    </section>
  );
}
