import type { SiteContent } from "@/lib/site-content";
import { ApplyForm, type ApplyDefaults } from "./apply-form";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function ApplyPage({ content, defaults }: { content: SiteContent; defaults: ApplyDefaults }) {
  const ar = content.lang === "ar";
  const home = ar ? "/ar" : "/";
  const applyHref = ar ? "/ar/apply" : "/apply";
  const otherHref = ar ? "/apply" : "/ar/apply";
  return (
    <div className="site min-h-screen" dir={content.dir} lang={content.lang}>
      <SiteHeader content={content} home={home} applyHref={applyHref} otherHref={otherHref} />
      <main className="site-wrap max-w-2xl py-12 sm:py-16">
        <p className="site-eyebrow">{content.nav.cta}</p>
        <h1 className="site-h2">{content.apply.title}</h1>
        <p className="site-lead">{content.apply.intro}</p>
        <div className="mt-8">
          <ApplyForm content={content} defaults={defaults} />
        </div>
      </main>
      <SiteFooter content={content} home={home} otherHref={otherHref} />
    </div>
  );
}
