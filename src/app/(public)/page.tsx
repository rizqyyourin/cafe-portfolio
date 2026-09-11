import Image from "next/image";
import Link from "next/link";

import { getPublicFeaturedMenuItems } from "@/db/menu";
import { getPublicCafeSettings } from "@/db/settings";
import { getPublicTestimonials } from "@/db/testimonials";
import styles from "./home.module.css";
import { formatRupiah, getPublicMenuImageUrl } from "@/lib/site";

const images = {
  hero: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1800&q=85",
  interior: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85",
  pour: "https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=1000&q=85",
  beans: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=85",
  table: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=85",
} as const;

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

function HeroActions({ className }: { className?: string }) {
  return (
    <div className={`${styles.heroActions} ${className ?? ""}`}>
      <Link className={styles.goldButton} href="/menu">Explore menu <Arrow /></Link>
      <Link className={styles.outlineButton} href="/reservation">Reserve a table <Arrow /></Link>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, featuredMenuItems, testimonials] = await Promise.all([getPublicCafeSettings(), getPublicFeaturedMenuItems(), getPublicTestimonials()]);
  const featuredTestimonial = testimonials[0];
  const dailyHours = Object.values(settings.openingHours).filter(Boolean);
  const hoursText = dailyHours.length > 0 && new Set(dailyHours).size === 1 ? dailyHours[0] : "See our weekly hours";

  return (
    <>
      <section className={styles.hero}>
        <div className={`${styles.heroCopy} ${styles.sectionShell}`} data-enter>
          <h1>{settings.tagline}</h1>
          <p className={styles.lede}>{settings.description}</p>
          <HeroActions className={styles.desktopHeroActions} />
          <p className={styles.heroMeta}>Est. 2021 <span>/</span> Kemang, Jakarta</p>
        </div>

        <div className={styles.heroVisual} data-hero-image>
          <Image alt="A welcoming specialty coffee bar" fill priority sizes="(max-width: 780px) 100vw, 51vw" src={images.hero} />
          <div className={styles.heroShade} />
          <div className={styles.heroStamp}><span>Kōhi Coffee</span><span>Slow mornings</span></div>
        </div>
        <HeroActions className={styles.mobileHeroActions} />
      </section>

      <div className={styles.promiseBar} aria-label="Kōhi Coffee commitments">
        <span>Single origin beans</span><span>Baked fresh daily</span><span>Open every day</span><span>Good company</span>
      </div>

      <section className={`${styles.menuSection} ${styles.sectionShell}`}>
        <div className={styles.menuIntro} data-reveal>
          <p className={styles.sectionNumber}>01 <span>/</span> From the bar</p>
          <h2>Favourites,<br />made daily.</h2>
          <p>A few of the things our regulars come back for — simple, seasonal, and seriously good.</p>
          <Link className={styles.inlineLink} href="/menu">View full menu <Arrow /></Link>
        </div>

        <div className={styles.menuGrid} data-stagger>
          {featuredMenuItems.map((item, index) => (
            <article className={`${styles.menuCard} ${index === 2 ? styles.optionalMobileCard : ""}`} key={item.id}>
              <div className={styles.menuPhoto}>{item.imageUrl ? <Image alt={`${item.name} at Kōhi Coffee`} fill sizes="(max-width: 780px) calc(100vw - 3rem), 25vw" src={getPublicMenuImageUrl(item.imageUrl)} /> : null}</div>
              <p className={styles.itemCategory}>{item.categoryName}</p>
              <div className={styles.itemHeading}><h3>{item.name}</h3><span>{formatRupiah(item.price)}</span></div>
              <p className={styles.itemDescription}>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.storySection}>
        <div className={`${styles.storyGrid} ${styles.sectionShell}`}>
          <div className={`${styles.storyPhoto} ${styles.storyPhotoDesktop}`} data-reveal="image"><Image alt="A sunlit cafe interior with tables and plants" fill sizes="48vw" src={images.interior} /></div>
          <div className={styles.storyCopy} data-reveal>
            <p className={styles.sectionNumber}>02 <span>/</span> Our table</p>
            <h2>A neighbourhood ritual, made with intention.</h2>
            <div className={styles.storyPhotoMobile} aria-hidden="true"><Image alt="" fill sizes="calc(100vw - 3rem)" src={images.interior} /></div>
            <p>Kōhi started with a small bar, a few stools, and the belief that a great cup can make a day feel more considered. We keep things thoughtful, local, and delicious.</p>
            <Link className={styles.darkButton} href="/about">Read our story <Arrow /></Link>
          </div>
        </div>
      </section>

      <section className={`${styles.gallerySection} ${styles.sectionShell}`}>
        <div className={styles.galleryIntro} data-reveal>
          <p className={styles.sectionNumber}>03 <span>/</span> The space</p>
          <h2>Come for coffee.<br />Stay for the feeling.</h2>
          <p>Sunlight, concrete, green corners, and a seat that feels like yours.</p>
          <Link className={styles.inlineLink} href="/gallery">Explore the gallery <Arrow /></Link>
        </div>
        <div className={styles.galleryFrames} data-stagger>
          <figure className={styles.galleryFrame}><Image alt="Barista pouring milk into a latte" fill sizes="(max-width: 780px) 48vw, 22vw" src={images.pour} /></figure>
          <figure className={styles.galleryFrame}><Image alt="Freshly roasted coffee beans" fill sizes="(max-width: 780px) 48vw, 22vw" src={images.beans} /></figure>
          <figure className={`${styles.galleryFrame} ${styles.optionalMobileCard}`}><Image alt="A calm coffee table in the cafe" fill sizes="25vw" src={images.table} /></figure>
        </div>
      </section>

      <section className={styles.testimonial}>
        <div className={styles.sectionShell} data-stagger>
          <p className={styles.sectionNumber}>Words from our regulars</p>
          {featuredTestimonial ? <><blockquote>“{featuredTestimonial.content}”</blockquote><p className={styles.quoteAuthor}>— {featuredTestimonial.customerName}</p></> : <p className={styles.quoteAuthor}>More guest notes coming soon.</p>}
        </div>
      </section>

      <section className={`${styles.finalCta} ${styles.sectionShell}`} data-stagger>
        <div><h2>Your table is waiting.</h2><p>{settings.address} <span>·</span> {hoursText}</p></div>
        <div className={styles.finalActions}><Link className={styles.goldButton} href="/reservation">Reserve your table <Arrow /></Link><Link className={styles.outlineButton} href="/contact">Get directions <Arrow /></Link></div>
      </section>
    </>
  );
}
