import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./auth-shell.module.css";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <aside className={styles.brandPanel}>
        <Link className={styles.brandMark} href="/" aria-label="Kōhi Coffee home">KŌHI</Link>
        <div className={styles.brandMeta} aria-label="Studio location">
          <span>Content studio</span>
          <span>Jakarta</span>
        </div>

        <div className={styles.heroCopy}>
          <h2 className={styles.heroTitle}>Keep the good things in motion.</h2>
          <p className={styles.heroDescription}>Manage your menu, stories, and the tables waiting to be filled.</p>
        </div>

        <p className={styles.brandFooter}>Kōhi Coffee&nbsp;&nbsp;©&nbsp;&nbsp;2025</p>
      </aside>

      <section className={styles.formPanel} aria-labelledby="auth-title">
        <div className={styles.formContent}>
          <p className={styles.eyebrow}>Admin access</p>
          <h1 className={styles.formTitle} id="auth-title">Welcome back.</h1>
          <p className={styles.formIntro}>Sign in to manage Kōhi Coffee.</p>
          {children}
        </div>
      </section>
    </main>
  );
}
