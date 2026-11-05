import Image from "next/image";
import Link from "next/link";
import { MAIN_SITE_URL, TENDERS_URL, type SiteContent } from "@/lib/site-content";
import { FIRM } from "@/lib/firm";

export function SiteFooter({ content, home, otherHref }: { content: SiteContent; home: string; otherHref: string }) {
  const privacyHref = content.lang === "ar" ? "/ar/privacy" : "/privacy";
  return (
    <footer className="border-t border-paper-200 bg-paper-100">
      <div className="site-wrap grid gap-8 py-12 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="max-w-sm">
          <Image src="/brand/logo-black.png" alt={FIRM.name} width={132} height={49} />
          <p className="mt-3 text-sm text-navy-900/70">{content.footer.legalName}</p>
          <p className="mt-1 text-sm text-navy-900/70">{content.contact.officesValue}</p>
          <p className="mt-1 text-sm text-navy-900/70" dir="ltr">
            {FIRM.phone} · {FIRM.email}
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-900/60">{content.footer.sitesTitle}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={MAIN_SITE_URL} target="_blank" rel="noreferrer" className="text-navy-900/80 hover:text-navy-900">
                aglc.sa
              </a>
            </li>
            <li>
              <Link href={home} className="text-navy-900/80 hover:text-navy-900">
                inc.aglc.sa
              </Link>
            </li>
            <li>
              <a href={TENDERS_URL} target="_blank" rel="noreferrer" className="text-navy-900/80 hover:text-navy-900">
                tender.aglc.sa
              </a>
            </li>
            <li>
              <Link href={privacyHref} className="text-navy-900/80 hover:text-navy-900">
                {content.footer.privacy}
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-navy-900/60 hover:text-navy-900">
                {content.footer.staff}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-900/60">{content.footer.resourcesTitle}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {content.footer.resources.map((r) => (
              <li key={r.href}>
                <a href={r.href} target="_blank" rel="noreferrer" className="text-navy-900/80 hover:text-navy-900">
                  {r.label}
                </a>
              </li>
            ))}
            <li>
              <Link href={otherHref} className="font-semibold text-navy-900/80 hover:text-navy-900">
                {content.otherLang.label}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="site-wrap border-t border-paper-200 py-4 text-xs text-navy-900/60">
        © {new Date().getFullYear()} {content.footer.legalName}. {content.footer.rights}
      </div>
    </footer>
  );
}
