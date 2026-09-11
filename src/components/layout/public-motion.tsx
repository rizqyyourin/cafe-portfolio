"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import styles from "./public-motion.module.css";

/** Progressively enhance public pages; server-rendered content stays visible without JS. */
export function PublicMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const registered = new Set<HTMLElement>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        (target as HTMLElement).dataset.motionState = "visible";
        observer.unobserve(target);
      });
    }, { rootMargin: "0px 0px -5% 0px", threshold: 0 });

    function registerElements() {
      // Menu filters replace their results without changing the current route.
      for (const element of registered) {
        if (!root!.contains(element)) {
          observer.unobserve(element);
          registered.delete(element);
        }
      }

      root!.querySelectorAll<HTMLElement>("[data-reveal], [data-stagger] > *").forEach((element) => {
        if (registered.has(element)) return;
        registered.add(element);

        const group = element.parentElement;
        if (group?.hasAttribute("data-stagger")) {
          const index = Array.from(group.children).indexOf(element);
          element.style.setProperty("--reveal-delay", `${Math.min(index, 4) * 70}ms`);
        }

        // Do not hide content already being read, including restored scroll positions.
        if (preference.matches || element.getBoundingClientRect().top < window.innerHeight) {
          element.dataset.motionState = "visible";
          return;
        }

        element.dataset.motionState = "pending";
        observer.observe(element);
      });
    }

    function revealAll() {
      if (!preference.matches) return;
      observer.disconnect();
      registered.forEach((element) => { element.dataset.motionState = "visible"; });
    }

    function revealFocused(event: FocusEvent) {
      if (!(event.target instanceof Element)) return;
      let element = event.target.closest<HTMLElement>('[data-motion-state="pending"]');
      while (element) {
        element.dataset.motionState = "visible";
        observer.unobserve(element);
        element = element.parentElement?.closest<HTMLElement>('[data-motion-state="pending"]') ?? null;
      }
    }

    registerElements();
    const mutations = new MutationObserver(registerElements);
    mutations.observe(root, { childList: true, subtree: true });
    preference.addEventListener("change", revealAll);
    root.addEventListener("focusin", revealFocused);

    return () => {
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener("change", revealAll);
      root.removeEventListener("focusin", revealFocused);
      registered.forEach((element) => {
        delete element.dataset.motionState;
        element.style.removeProperty("--reveal-delay");
      });
    };
  }, [pathname]);

  return <div className={`${styles.root} min-h-screen overflow-x-clip`} ref={rootRef}>{children}</div>;
}
