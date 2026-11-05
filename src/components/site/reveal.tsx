"use client";

import { useEffect } from "react";

/**
 * Surveyor's reveal: elements marked data-reveal fade and rise 12px as they
 * enter the viewport. Without JavaScript (or with reduced motion) everything
 * is visible at once — the `js` class gates the hidden initial state.
 */
export function Reveal() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) return;
    root.classList.add("js");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      root.classList.remove("js");
    };
  }, []);
  return null;
}
