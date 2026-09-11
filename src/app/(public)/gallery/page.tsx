import type { Metadata } from "next";

import Image from "next/image";
import { getPublicMenuImageUrl } from "@/lib/site";
import { getPublicGalleryImages } from "@/db/gallery";
import styles from "./gallery.module.css";

export const metadata: Metadata = { title: "Gallery", description: "A few frames from the everyday at Kōhi Coffee." };
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const images = await getPublicGalleryImages();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.intro} data-enter>
          <p className={styles.kicker}>The space <span>/</span> In all its little moments</p>
          <h1>Seen at Kōhi.</h1>
          <p>The mornings, the plates, the sunlight — a few frames from our everyday.</p>
        </header>
        <section aria-label="Gallery photos" className={styles.grid} data-stagger>
          {images.map((image) => (
            <figure className={styles.photo} key={image.id} data-reveal="image">
              <Image alt={image.altText} fill sizes="(max-width: 700px) 72vw, 24vw" src={getPublicMenuImageUrl(image.imageUrl)} />
              <figcaption className={styles.caption}>{image.caption}</figcaption>
            </figure>
          ))}
          {images.length === 0 ? <p className={styles.emptyState}>No gallery photos just yet.</p> : null}
        </section>
        <p className={styles.follow} data-reveal>Follow along <span>/</span><br />@kohicoffee</p>
      </div>
    </div>
  );
}
