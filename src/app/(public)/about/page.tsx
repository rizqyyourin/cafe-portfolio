import type { Metadata } from "next";
import Image from "next/image";

import styles from "./about.module.css";

export const metadata: Metadata = { title: "About", description: "Kōhi Coffee is a small pause in the middle of the city." };

const images = {
  counter: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=2000&q=85",
  quietTable: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85",
  hands: "https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=1200&q=85",
} as const;

export default function AboutPage() {
  return (
    <article className={styles.page}>
      <div className={styles.shell}>
        <p className={styles.kicker}>About Kōhi <span>/</span> Est. 2021</p>
        <header className={styles.hero} data-enter>
          <h1>A small pause in the middle of the city.</h1>
          <p>We make space for slow mornings, familiar faces, and the quiet ritual of a well-made cup.</p>
        </header>
        <figure className={styles.heroImage} data-reveal="image" data-hero-image><Image alt="Kōhi's warm counter filled with coffee cups and everyday details" fill priority sizes="(max-width: 760px) calc(100vw - 2.5rem), 100vw" src={images.counter} /></figure>

        <section className={styles.story} data-stagger>
          <div><p className={styles.storyEyebrow}>Our story</p><h2>Built around the things that bring people back.</h2></div>
          <div className={styles.storyCopy}><p>Kōhi began with a humble bar, a handful of stools, and a stubborn belief: the everyday deserves attention. We started by learning the names of our neighbours — and how they take their coffee.</p><p>Today, we&apos;re still here for the details: thoughtful beans, warm plates, and service that feels quietly personal.</p></div>
        </section>

        <section className={styles.values} data-stagger>
          <figure><Image alt="A quiet, softly lit coffee table" fill sizes="(max-width: 760px) calc(100vw - 2.5rem), 48vw" src={images.quietTable} /></figure>
          <div><p className={styles.storyEyebrow}>The little things</p><h2>Good coffee is only the beginning.</h2><p>We take care with what we serve, who we welcome, and the kind of place we leave for the people around us.</p><ul><li>Seasonal, carefully sourced beans</li><li>Freshly made food, every day</li><li>A neighbourhood table for everyone</li></ul></div>
        </section>
      </div>
      <section className={styles.closing}><div className={styles.shell} data-stagger><p>From the first coffee to the last conversation, we&apos;re glad you&apos;re here.</p><figure><Image alt="A barista preparing coffee" fill sizes="(max-width: 760px) calc(100vw - 2.5rem), 38vw" src={images.hands} /></figure></div></section>
    </article>
  );
}
