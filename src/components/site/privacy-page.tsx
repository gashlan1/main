import type { SiteContent } from "@/lib/site-content";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function PrivacyPage({ content }: { content: SiteContent }) {
  const ar = content.lang === "ar";
  const home = ar ? "/ar" : "/";
  const applyHref = ar ? "/ar/apply" : "/apply";
  const otherHref = ar ? "/privacy" : "/ar/privacy";
  return (
    <div className="site min-h-screen" dir={content.dir} lang={content.lang}>
      <SiteHeader content={content} home={home} applyHref={applyHref} otherHref={otherHref} />
      <main className="site-wrap max-w-3xl py-12 sm:py-16">
        <h1 className="site-h2">{content.privacy.title}</h1>
        <p className="mt-2 text-sm text-navy-900/60">{content.privacy.updated}</p>
        <div className="mt-8 space-y-6">
          {content.privacy.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold text-navy-900">{s.h}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-navy-900/80">{s.p}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter content={content} home={home} otherHref={otherHref} />
    </div>
  );
}
