"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Menu, X } from "lucide-react";
import { MAIN_SITE_URL, type SiteContent } from "@/lib/site-content";
import { FIRM } from "@/lib/firm";

export function SiteHeader({ content, home, applyHref, otherHref }: { content: SiteContent; home: string; applyHref: string; otherHref: string }) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: `${home}#process`, label: content.nav.process },
    { href: `${home}#fees`, label: content.nav.fees },
    { href: `${home}#why`, label: content.nav.why },
    { href: `${home}#tenders`, label: content.nav.tenders },
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
        <nav className="hidden items-center gap-5 text-[14px] font-medium text-navy-900/80 xl:flex" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-navy-900">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <a href={MAIN_SITE_URL} target="_blank" rel="noreferrer" className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-navy-900/70 hover:bg-navy-100 md:inline-flex">
            {content.nav.mainSite}
            <ExternalLink className="size-3.5" />
          </a>
          <Link href={otherHref} className="rounded-md px-3 py-2 text-sm font-semibold text-navy-900/80 hover:bg-navy-100" lang={content.lang === "en" ? "ar" : "en"}>
            {content.otherLang.label}
          </Link>
          <Link href={applyHref} className="site-btn-gold hidden px-4 py-2 text-sm sm:inline-flex">
            {content.nav.cta}
          </Link>
          <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-md p-2 text-navy-900 xl:hidden" aria-label="Menu" aria-expanded={open}>
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-paper-200 bg-paper-50 xl:hidden" aria-label="Main">
          <div className="site-wrap flex flex-col py-2">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-[15px] font-medium text-navy-900">
                {l.label}
              </a>
            ))}
            <a href={MAIN_SITE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 py-3 text-[15px] font-medium text-navy-900/70">
              {content.nav.mainSite}
              <ExternalLink className="size-3.5" />
            </a>
            <Link href={applyHref} className="site-btn-gold mt-2 mb-3">
              {content.nav.cta}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
