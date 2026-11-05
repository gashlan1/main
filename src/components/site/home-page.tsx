import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { MAIN_SITE_URL, type SiteContent } from "@/lib/site-content";
import { FIRM } from "@/lib/firm";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

function sar(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function HomePage({ content }: { content: SiteContent }) {
  const ar = content.lang === "ar";
  const home = ar ? "/ar" : "/";
  const applyHref = ar ? "/ar/apply" : "/apply";
  const otherHref = content.otherLang.href;
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");

  return (
    <div className="site min-h-screen" dir={content.dir} lang={content.lang}>
      <SiteHeader content={content} home={home} applyHref={applyHref} otherHref={otherHref} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="pointer-events-none absolute -top-40 end-[-10%] size-[520px] rounded-full bg-gold-500/15 blur-3xl" aria-hidden />
        <div className="site-wrap grid gap-12 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:py-24">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">{content.hero.eyebrow}</p>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[58px]" style={{ textWrap: "balance" }}>
              {content.hero.title} <span className="text-gold-300">{content.hero.titleAccent}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">{content.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={applyHref} className="site-btn-gold">
                {content.hero.cta}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
              <a href="#fees" className="site-btn-light">
                {content.hero.secondary}
              </a>
            </div>
            <ul className="mt-10 grid gap-3 text-[15px] text-white/85 sm:grid-cols-3">
              {content.hero.facts.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-1 size-4 shrink-0 text-gold-300" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* The actual deliverable: a fixed-fee proposal on the firm's letterhead. */}
          <div className="relative" dir="ltr">
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl bg-gold-500/20" aria-hidden />
            <div className="relative rounded-xl bg-paper-50 p-6 text-navy-950 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between gap-4 border-b border-paper-200 pb-4">
                <Image src="/brand/logo-black.png" alt="" width={120} height={45} />
                <div className="text-right text-[10px] leading-relaxed text-navy-900/60">
                  {FIRM.address}
                  <br />
                  {FIRM.email} | {FIRM.website}
                </div>
              </div>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-600">{content.proposal.eyebrow}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">{content.proposal.title}</h2>
              <p className="mt-2 text-sm text-navy-900/70">{content.proposal.text}</p>
              <ol className="mt-4 divide-y divide-paper-200 border-y border-paper-200 text-[13px]">
                {content.proposal.lines.map((line, i) => {
                  const [label, amount] = line.split(" — ");
                  const total = i === content.proposal.lines.length - 2;
                  const enclosure = i === content.proposal.lines.length - 1;
                  return (
                    <li key={line} className={`flex items-baseline justify-between gap-4 py-2 ${total ? "font-semibold" : ""} ${enclosure ? "text-navy-900/60 italic" : ""}`} dir={content.dir}>
                      <span>{label}</span>
                      {amount ? <span className="shrink-0 tabular-nums">{amount}</span> : null}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="bg-paper-100 py-20 scroll-mt-16">
        <div className="site-wrap">
          <p className="site-eyebrow">{content.process.eyebrow}</p>
          <h2 className="site-h2">{content.process.title}</h2>
          <p className="site-lead">{content.process.intro}</p>
          <ol className="mt-10 grid gap-6 md:grid-cols-2">
            {content.process.steps.map((step, i) => (
              <li key={step.title} className="site-card flex gap-5">
                <span className="font-display text-4xl font-semibold leading-none text-gold-500">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-lg font-semibold text-navy-900">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-navy-900/75">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-12 rounded-xl border border-paper-200 bg-white p-6 sm:p-8">
            <h3 className="font-display text-2xl font-semibold text-navy-900">{content.process.checklistTitle}</h3>
            <ol className="mt-6 grid gap-x-10 gap-y-5 md:grid-cols-2">
              {content.process.checklist.map((item, i) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">{i + 1}</span>
                  <div>
                    <div className="font-semibold text-navy-900">{item.title}</div>
                    <div className="text-sm text-navy-900/70">{item.text}</div>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-navy-900/60">{content.process.note}</p>
          </div>
        </div>
      </section>

      {/* Fees */}
      <section id="fees" className="bg-white py-20 scroll-mt-16">
        <div className="site-wrap">
          <p className="site-eyebrow">{content.fees.eyebrow}</p>
          <h2 className="site-h2">{content.fees.title}</h2>
          <p className="site-lead">{content.fees.intro}</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {content.fees.packages.map((pkg) => (
              <article key={pkg.key} className={`relative flex flex-col rounded-xl border bg-white p-6 ${pkg.recommended ? "border-gold-500 shadow-[0_12px_40px_-12px_rgba(184,146,58,0.45)]" : "border-paper-200"}`}>
                {pkg.recommended ? (
                  <span className="absolute -top-3 start-6 rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold text-navy-950">{content.fees.recommended}</span>
                ) : null}
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-900/60">{pkg.tagline}</p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-navy-900">{pkg.name}</h3>
                <p className="mt-4 font-display text-4xl font-semibold text-navy-900">
                  <span className="text-lg font-sans font-medium text-navy-900/60">{content.fees.currency} </span>
                  <span className="tabular-nums">{sar(pkg.price)}</span>
                </p>
                <p className="text-sm text-navy-900/60">
                  {content.fees.approx} {sar(pkg.usd)} · {content.fees.plusVat}
                </p>
                <p className="mt-5 text-sm font-semibold text-navy-900">{pkg.lead}</p>
                <ul className="mt-2 flex-1 space-y-2 text-[15px] text-navy-900/80">
                  {pkg.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-1 size-4 shrink-0 text-gold-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`${applyHref}?package=${pkg.key}`} className={`mt-6 ${pkg.recommended ? "site-btn-gold" : "site-btn-outline"}`}>
                  {content.fees.choose}
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
            <div>
              <h3 className="font-display text-2xl font-semibold text-navy-900">{content.fees.servicesTitle}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-navy-900/75">{content.fees.servicesIntro}</p>
              <p className="mt-4 text-sm text-navy-900/60">{content.fees.servicesNote}</p>
              <p className="mt-4 text-sm text-navy-900/60">{content.fees.footnote}</p>
            </div>
            <div className="divide-y divide-paper-200 rounded-xl border border-paper-200">
              {content.fees.groups.map((group, gi) => (
                <details key={group.title} className="group" open={gi === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-[15px] font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
                    <span>
                      {group.title} <span className="font-normal text-navy-900/50">({group.services.length})</span>
                    </span>
                    <span className="text-navy-900/40 transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <table className="w-full border-t border-paper-200 text-sm">
                    <tbody>
                      {group.services.map((s) => (
                        <tr key={s.code} className="border-b border-paper-200/70 last:border-0">
                          <td className="px-4 py-2.5 font-mono text-xs text-navy-900/50" dir="ltr">
                            {s.code}
                          </td>
                          <td className="px-2 py-2.5 text-navy-900">{s.name}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-end font-semibold tabular-nums text-navy-900">
                            {s.price === null ? (
                              <span className="font-normal text-navy-900/60">{content.fees.onRequest}</span>
                            ) : (
                              <>
                                {content.fees.currency} {sar(s.price)}
                                {s.unit ? <span className="font-normal text-navy-900/50"> {content.fees.units[s.unit]}</span> : null}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The firm */}
      <section id="why" className="bg-navy-900 py-20 text-white scroll-mt-16">
        <div className="site-wrap">
          <p className="site-eyebrow text-gold-300">{content.why.eyebrow}</p>
          <h2 className="site-h2 text-white">{content.why.title}</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {content.why.points.map((p) => (
              <div key={p.title} className="border-t border-gold-500/60 pt-5">
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/75">{p.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
            <div>
              <h3 className="font-display text-2xl font-semibold">{content.why.firmTitle}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/75">{content.why.firmText}</p>
              <a href={MAIN_SITE_URL} target="_blank" rel="noreferrer" className="site-btn-light mt-6">
                {content.why.mainSiteCta}
                <ExternalLink className="size-4" />
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">{content.why.practiceTitle}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {content.why.practiceAreas.map((area) => (
                  <li key={area} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[13px] text-white/85">
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-14">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">{content.why.foundersTitle}</p>
            <ul className="mt-4 grid gap-5 md:grid-cols-3">
              {content.why.founders.map((f) => (
                <li key={f.name} className="rounded-xl border border-white/10 bg-white/5 p-5">
                  {f.photo ? (
                    <Image src={f.photo} alt={f.name} width={88} height={88} className="size-[88px] rounded-full border-2 border-gold-500/70 object-cover" />
                  ) : (
                    <span className="flex size-[88px] items-center justify-center rounded-full border-2 border-gold-500/70 font-display text-2xl text-gold-300" aria-hidden>
                      {f.name.split(/\s+/)[0][0]}
                    </span>
                  )}
                  <h4 className="mt-4 font-semibold">{f.name}</h4>
                  <p className="text-sm text-gold-300">{f.role}</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{f.credentials}</p>
                </li>
              ))}
            </ul>
            <p className="mt-5 max-w-3xl text-[14px] leading-relaxed text-white/65">{content.why.teamText}</p>
          </div>
        </div>
      </section>

      {/* Tenders */}
      <section id="tenders" className="border-y border-gold-500/40 bg-gold-200/40 py-16 scroll-mt-16">
        <div className="site-wrap grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
          <div>
            <p className="site-eyebrow">{content.tenders.eyebrow}</p>
            <h2 className="site-h2">{content.tenders.title}</h2>
            <p className="site-lead">{content.tenders.text}</p>
            <ul className="mt-6 grid gap-2 text-[15px] text-navy-900/85 sm:grid-cols-1">
              {content.tenders.points.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <Check className="mt-1 size-4 shrink-0 text-gold-600" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="site-card border-gold-500/50 bg-white/80 text-center">
            <p className="font-display text-3xl font-semibold text-navy-900" dir="ltr">
              tender.aglc.sa
            </p>
            <p className="mt-2 text-sm text-navy-900/70">{content.tenders.eyebrow}</p>
            <a href={content.tenders.url} target="_blank" rel="noreferrer" className="site-btn-gold mt-6 w-full">
              {content.tenders.cta}
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Residency */}
      <section id="residency" className="bg-paper-100 py-20 scroll-mt-16">
        <div className="site-wrap">
          <p className="site-eyebrow">{content.residency.eyebrow}</p>
          <h2 className="site-h2">{content.residency.title}</h2>
          <p className="site-lead">{content.residency.intro}</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {content.residency.tracks.map((t) => (
              <div key={t.title} className="site-card">
                <h3 className="font-display text-xl font-semibold text-navy-900">{t.title}</h3>
                <ul className="mt-3 space-y-2 text-[15px] text-navy-900/80">
                  {t.items.map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-1 size-4 shrink-0 text-gold-600" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Link href={`${applyHref}?service=residency`} className="site-btn-outline mt-8">
            {content.residency.cta}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white py-20 scroll-mt-16">
        <div className="site-wrap max-w-3xl">
          <p className="site-eyebrow">{content.faq.eyebrow}</p>
          <h2 className="site-h2">{content.faq.title}</h2>
          <div className="mt-8 divide-y divide-paper-200 border-y border-paper-200">
            {content.faq.items.map((item, i) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-start gap-4 text-[17px] font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
                  <span className="mt-0.5 w-7 shrink-0 font-display text-base text-gold-600">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">{item.q}</span>
                  <span className="mt-1 text-navy-900/40 transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 ps-11 text-[15px] leading-relaxed text-navy-900/75">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-xs text-navy-900/55">{content.faq.disclaimer}</p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-navy-950 py-20 text-white scroll-mt-16">
        <div className="site-wrap grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <p className="site-eyebrow text-gold-300">{content.contact.eyebrow}</p>
            <h2 className="site-h2 text-white">{content.contact.title}</h2>
            <p className="site-lead text-white/75">{content.contact.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={applyHref} className="site-btn-gold">
                {content.contact.cta}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
              {whatsapp ? (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="site-btn-light">
                  <MessageCircle className="size-4" />
                  {content.contact.whatsapp}
                </a>
              ) : null}
            </div>
          </div>
          <dl className="grid gap-5 rounded-xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <div className="flex gap-4">
              <Phone className="mt-1 size-5 shrink-0 text-gold-300" />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">{content.contact.phone}</dt>
                <dd className="mt-1 text-lg" dir="ltr">
                  {FIRM.phone}
                </dd>
              </div>
            </div>
            <div className="flex gap-4">
              <Mail className="mt-1 size-5 shrink-0 text-gold-300" />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">{content.contact.email}</dt>
                <dd className="mt-1 text-lg">{FIRM.email}</dd>
              </div>
            </div>
            <div className="flex gap-4">
              <MapPin className="mt-1 size-5 shrink-0 text-gold-300" />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">{content.contact.offices}</dt>
                <dd className="mt-1 text-lg">{content.contact.officesValue}</dd>
              </div>
            </div>
          </dl>
        </div>
      </section>

      <SiteFooter content={content} home={home} otherHref={otherHref} />
    </div>
  );
}
