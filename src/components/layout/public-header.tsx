"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { siteConfig } from "@/lib/site";
import styles from "./public-motion.module.css";

const navigation = [{ href: "/", label: "Home" }, ...siteConfig.nav];

export function PublicHeader({ cafeName = siteConfig.name }: { cafeName?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const isReservationPage = pathname === "/reservation";

  return (
    <header className="relative z-30 bg-background" onKeyDown={(event) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    }}>
      <div className="shell flex min-h-[4.85rem] items-center justify-between gap-5 py-4 md:min-h-25 md:py-5">
        <Link className="font-serif text-[1.45rem] font-semibold tracking-[-0.07em] text-[#302b27] md:text-[1.65rem]" href="/" onClick={() => setMenuOpen(false)} aria-label={`${cafeName} home`}>KŌHI</Link>
        <nav className={`hidden items-center lg:flex ${isReservationPage ? "gap-9" : "gap-7"}`} aria-label="Primary navigation">
          {navigation.map((item) => <Link aria-current={pathname === item.href ? "page" : undefined} className={`${styles.navLink} font-[var(--font-mono)] text-[0.6rem] tracking-[0.15em] uppercase transition-colors hover:text-[#9c875b] ${pathname === item.href ? "text-[#9c875b]" : "text-[#5f5850]"}`} href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        {!isReservationPage && <Link className="hidden min-h-10 items-center rounded-[4px] bg-[#2d2926] px-5 text-[0.58rem] font-bold tracking-[0.15em] text-[#f7f2e9] uppercase transition-colors hover:bg-[#49413b] md:inline-flex" href="/reservation">Reserve a table</Link>}
        <button ref={toggleRef} aria-controls="mobile-navigation" aria-expanded={menuOpen} className={`${styles.menuToggle} grid size-10 place-items-center text-[#302b27] lg:hidden`} onClick={() => setMenuOpen((isOpen) => !isOpen)} type="button">
          <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          {menuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
        </button>
      </div>
      <nav className={`${styles.mobileNav} absolute inset-x-0 top-full bg-[#f7f2e9] shadow-xl`} data-open={menuOpen} id="mobile-navigation" aria-label="Mobile navigation" aria-hidden={!menuOpen} inert={!menuOpen}>
        <div className={styles.mobileNavInner}>
          <div className="border-y border-[#ded2c2] px-5 py-6">
            <div className="mx-auto grid w-full max-w-md gap-1">
              {navigation.map((item) => <Link aria-current={pathname === item.href ? "page" : undefined} className={`${styles.mobileNavLink} border-b border-[#ded2c2] py-4 font-serif text-2xl ${pathname === item.href ? "text-[#9c875b]" : ""}`} href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>)}
              {!isReservationPage && <Link className="mt-4 inline-flex min-h-12 items-center justify-center rounded-[4px] bg-[#2d2926] px-5 text-[0.58rem] font-bold tracking-[0.15em] text-[#f7f2e9] uppercase" href="/reservation" onClick={() => setMenuOpen(false)}>Reserve a table</Link>}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
