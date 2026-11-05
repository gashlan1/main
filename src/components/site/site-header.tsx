"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { SiteContent } from "@/lib/site-content";
import { FIRM } from "@/lib/firm";

export function SiteHeader({ content, home, applyHref, otherHref }: { content: SiteContent; home: string; applyHref: string; otherHref: string }) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: `${home}#process`, label: content.nav.process },
    { href: `${home}#fees`, label: content.nav.fees },
    { href: `${home}#why`, label: content.nav.why },
    { href: `${home}#residency`, label: content.nav.residency },
    { href: `${home}#faq`, label: content.nav.faq },
    { href: `${home}#contact`, label: content.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-paper-200 bg-paper-50/95 backdrop-blur">
      <div className="site-wrap flex h-16 items-center justify-between gap-4">
        <Link href={home} className="flex items-center" aria-label={FIRM.name}>
          <Image src="/brand/logo-black.png" alt={FIRM.name} width={132} height={49} priority />
        </Link>
        <nav className="hidden items-center gap-6 text-[14px] font-medium text-navy-900/80 lg:flex" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-navy-900">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href={otherHref} className="rounded-md px-3 py-2 text-sm font-semibold text-navy-900/80 hover:bg-navy-100" lang={content.lang === "en" ? "ar" : "en"}>
            {content.otherLang.label}
          </Link>
          <Link href={applyHref} className="site-btn-gold hidden px-4 py-2 text-sm sm:inline-flex">
            {content.nav.cta}
          </Link>
          <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-md p-2 text-navy-900 lg:hidden" aria-label="Menu" aria-expanded={open}>
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-paper-200 bg-paper-50 lg:hidden" aria-label="Main">
          <div className="site-wrap flex flex-col py-2">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-[15px] font-medium text-navy-900">
                {l.label}
              </a>
            ))}
            <Link href={applyHref} className="site-btn-gold mt-2 mb-3">
              {content.nav.cta}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
