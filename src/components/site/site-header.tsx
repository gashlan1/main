"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Menu, X } from "lucide-react";
import { MAIN_SITE_URL, type SiteContent } from "@/lib/site-content";
import { FIRM } from "@/lib/firm";

export function SiteHeader({
  content,
  home,
  applyHref,
  otherHref,
  dark = false,
}: {
  content: SiteContent;
  home: string;
  applyHref: string;
  otherHref: string;
  /** Navy header with the white logo (Option B). */
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const shell = dark ? "border-white/10 bg-navy-950/90 text-white" : "border-paper-200 bg-paper-50/95";
  const linkTone = dark ? "text-white/75 hover:text-white" : "text-navy-900/80 hover:text-navy-900";
  const ghost = dark ? "text-white/80 hover:bg-white/10" : "text-navy-900/80 hover:bg-navy-100";
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
    <header className={`sticky top-0 z-30 border-b backdrop-blur ${shell}`}>
      <div className="site-wrap flex h-16 items-center justify-between gap-4">
        <Link href={home} className="flex items-center" aria-label={FIRM.name}>
          <Image src={dark ? "/brand/logo-white.png" : "/brand/logo-black.png"} alt={FIRM.name} width={132} height={49} priority />
        </Link>
        <nav className={`hidden items-center gap-5 text-[14px] font-medium xl:flex ${linkTone}`} aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <a href={MAIN_SITE_URL} target="_blank" rel="noreferrer" className={`hidden items-center gap-1 rounded-md px-3 py-2 text-sm font-medium md:inline-flex ${ghost}`}>
            {content.nav.mainSite}
            <ExternalLink className="size-3.5" />
          </a>
          <Link href={otherHref} className={`rounded-md px-3 py-2 text-sm font-semibold ${ghost}`} lang={content.lang === "en" ? "ar" : "en"}>
            {content.otherLang.label}
          </Link>
          <Link href={applyHref} className="site-btn-gold hidden px-4 py-2 text-sm sm:inline-flex">
            {content.nav.cta}
          </Link>
          <button type="button" onClick={() => setOpen((v) => !v)} className={`rounded-md p-2 xl:hidden ${dark ? "text-white" : "text-navy-900"}`} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className={`border-t xl:hidden ${dark ? "border-white/10 bg-navy-950" : "border-paper-200 bg-paper-50"}`} aria-label="Main">
          <div className="site-wrap flex flex-col py-2">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={`py-3 text-[15px] font-medium ${dark ? "text-white" : "text-navy-900"}`}>
                {l.label}
              </a>
            ))}
            <a href={MAIN_SITE_URL} target="_blank" rel="noreferrer" className={`flex items-center gap-1 py-3 text-[15px] font-medium ${dark ? "text-white/70" : "text-navy-900/70"}`}>
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
