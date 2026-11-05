import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/lib/site-content";
import { FIRM } from "@/lib/firm";

export function SiteFooter({ content, home, otherHref }: { content: SiteContent; home: string; otherHref: string }) {
  return (
    <footer className="border-t border-paper-200 bg-paper-100">
      <div className="site-wrap flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Image src="/brand/logo-black.png" alt={FIRM.name} width={132} height={49} />
          <p className="mt-3 text-sm text-navy-900/70">{content.footer.legalName}</p>
          <p className="mt-1 text-sm text-navy-900/70">{content.contact.officesValue}</p>
          <p className="mt-1 text-sm text-navy-900/70">
            {FIRM.phone} · {FIRM.email}
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm" aria-label="Footer">
          <a href={`${home}#process`} className="text-navy-900/80 hover:text-navy-900">
            {content.nav.process}
          </a>
          <a href={`${home}#fees`} className="text-navy-900/80 hover:text-navy-900">
            {content.nav.fees}
          </a>
          <a href={`${home}#residency`} className="text-navy-900/80 hover:text-navy-900">
            {content.nav.residency}
          </a>
          <a href={`${home}#faq`} className="text-navy-900/80 hover:text-navy-900">
            {content.nav.faq}
          </a>
          <Link href={otherHref} className="text-navy-900/80 hover:text-navy-900">
            {content.otherLang.label}
          </Link>
          <Link href="/login" className="text-navy-900/60 hover:text-navy-900">
            {content.footer.staff}
          </Link>
        </nav>
      </div>
      <div className="site-wrap border-t border-paper-200 py-4 text-xs text-navy-900/60">
        © {new Date().getFullYear()} {content.footer.legalName}. {content.footer.rights}
      </div>
    </footer>
  );
}
