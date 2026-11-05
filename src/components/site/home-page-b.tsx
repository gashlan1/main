import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { MAIN_SITE_URL, type SiteContent } from "@/lib/site-content";
import { FIRM } from "@/lib/firm";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { Reveal } from "./reveal";

function sar(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/**
 * Option B — "Gilded Survey". Same copy as the default page; a chart-like
 * treatment: navy ground, gold hairline instruments, large serif headlines,
 * the five phases as nodes on a line, ledgers for fees and filings.
 */
export function HomePageB({ content }: { content: SiteContent }) {
  const ar = content.lang === "ar";
  const home = ar ? "/ar/b" : "/b";
  const applyHref = ar ? "/ar/apply" : "/apply";
  const otherHref = ar ? "/b" : "/ar/b";
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const phases = content.proposal.lines.slice(0, 5).map((l) => l.split(" — ")[0].replace(/^[^:]+:\s*/, ""));
  const stats = ar
    ? [
        { n: "32", t: "خدمة بأسعار منفردة" },
        { n: "2", t: "يوما عمل حتى عرض الأتعاب" },
        { n: "12", t: "مجال ممارسة في المكتب" },
        { n: "100%", t: "تملّك أجنبي لمعظم الأنشطة" },
      ]
    : [
        { n: "32", t: "services priced individually" },
        { n: "2", t: "business days to a written proposal" },
        { n: "12", t: "practice areas behind your company" },
        { n: "100%", t: "foreign ownership for most activities" },
      ];

  return (
    <div className="site min-h-screen" dir={content.dir} lang={content.lang}>
      <Reveal />
      <SiteHeader content={content} home={home} applyHref={applyHref} otherHref={otherHref} dark />

      {/* Hero: the chart */}
      <section className="relative isolate overflow-hidden bg-navy-950 text-white">
        <Image
          src="/brand/option-b/hero-survey.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[center_72%]"
        />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-navy-950/75 via-navy-950/25 to-navy-950/80" aria-hidden />
        <div className="site-wrap grid gap-14 pb-20 pt-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:pb-28 lg:pt-28">
          <div>
            <p className="b-label flex max-w-xl items-center gap-3 text-gold-300 tracking-[0.16em]">
              <span className="inline-block size-2 rotate-45 bg-gold-300" aria-hidden />
              {content.hero.eyebrow}
            </p>
            <h1 className="mt-6 font-display text-[44px] font-semibold leading-[1.02] sm:text-6xl lg:text-[76px]" style={{ textWrap: "balance" }}>
              {content.hero.title}
              <br />
              <span className="text-gold-300">{content.hero.titleAccent}</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/75">{content.hero.subtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={applyHref} className="site-btn-gold">
                {content.hero.cta}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
              <a href="#fees" className="site-btn-light border-gold-300/40">
                {content.hero.secondary}
              </a>
            </div>
          </div>

          {/* Instrument: the proposal as a glass plate */}
          <div className="relative rounded-md border border-gold-300/30 bg-navy-950/60 p-6 backdrop-blur-sm sm:p-7" dir="ltr">
            <div className="flex items-center justify-between">
              <p className="b-label text-gold-300" dir={content.dir}>
                {content.proposal.eyebrow}
              </p>
              <span className="font-mono text-[11px] text-white/45">REF. INQ-2026-J-DRVG</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-semibold" dir={content.dir}>
              {content.proposal.title}
            </h2>
            <ol className="mt-5 divide-y divide-white/10 border-y border-white/10 text-[13px]">
              {content.proposal.lines.slice(0, 6).map((line, i) => {
                const [label, amount] = line.split(" — ");
                const total = i === 5;
                return (
                  <li key={line} className={`flex items-baseline justify-between gap-4 py-2.5 ${total ? "font-semibold text-gold-300" : "text-white/80"}`} dir={content.dir}>
                    <span className="flex items-baseline gap-3">
                      {!total ? <span className="font-mono text-[11px] text-gold-300/70">0{i + 1}</span> : null}
                      <span>{label}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">{amount}</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-[12px] italic text-white/50" dir={content.dir}>
              {content.proposal.lines[6]}
            </p>
          </div>
        </div>

        {/* The five phases as nodes on a line */}
        <div className="site-wrap pb-12">
          <div className="relative border-t border-gold-300/40 pt-5">
            <ol className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-5">
              {phases.map((p, i) => (
                <li key={p} className="relative">
                  <span className={`absolute -top-[26px] start-0 hidden size-[9px] rounded-full border border-gold-300 sm:block ${i === 0 ? "bg-gold-300" : "bg-navy-950"}`} aria-hidden />
                  <span className="b-label block text-gold-300/80">0{i + 1}</span>
                  <span className="mt-1 block text-[13px] leading-snug text-white/75">{p}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-paper-200 bg-paper-50">
        <dl className="site-wrap grid grid-cols-2 divide-paper-200 md:grid-cols-4 md:divide-x">
          {stats.map((s) => (
            <div key={s.t} className="px-2 py-8 md:px-6 first:ps-0">
              <dt className="font-display text-4xl font-semibold tabular-nums text-navy-900">{s.n}</dt>
              <dd className="mt-1 text-sm text-navy-900/65">{s.t}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Process: timeline + ledger */}
      <section id="process" className="bg-paper-50 py-20 scroll-mt-16">
        <div className="site-wrap">
          <div data-reveal>
            <p className="site-eyebrow">{content.process.eyebrow}</p>
            <h2 className="site-h2 max-w-3xl">{content.process.title}</h2>
            <p className="site-lead">{content.process.intro}</p>
          </div>
          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <ol className="relative border-s border-gold-500/50 ps-8" data-reveal>
              {content.process.steps.map((step, i) => (
                <li key={step.title} className="relative pb-10 last:pb-0">
                  <span className="absolute -start-[calc(2rem+6px)] top-1 flex size-3 items-center justify-center rounded-full bg-paper-50 ring-1 ring-gold-500">
                    <span className="size-1.5 rounded-full bg-gold-500" />
                  </span>
                  <span className="b-label text-gold-600">0{i + 1}</span>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-navy-900">{step.title}</h3>
                  <p className="mt-2 max-w-md text-[15px] leading-relaxed text-navy-900/75">{step.text}</p>
                </li>
              ))}
            </ol>
            <div className="rounded-md border border-paper-200 bg-white p-6 sm:p-8" data-reveal>
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-2xl font-semibold text-navy-900">{content.process.checklistTitle}</h3>
                <span className="b-label text-navy-900/40">I–VIII</span>
              </div>
              <ol className="mt-5 divide-y divide-dotted divide-paper-200">
                {content.process.checklist.map((item, i) => (
                  <li key={item.title} className="grid grid-cols-[32px_1fr] gap-3 py-3">
                    <span className="font-mono text-xs text-gold-600">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="text-[15px] font-semibold text-navy-900">{item.title}</div>
                      <div className="text-sm text-navy-900/65">{item.text}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-xs text-navy-900/55">{content.process.note}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fees on navy */}
      <section id="fees" className="b-grid bg-navy-900 py-20 text-white scroll-mt-16">
        <div className="site-wrap">
          <div data-reveal>
            <p className="site-eyebrow text-gold-300">{content.fees.eyebrow}</p>
            <h2 className="site-h2 text-white">{content.fees.title}</h2>
            <p className="site-lead text-white/70">{content.fees.intro}</p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3" data-reveal>
            {content.fees.packages.map((pkg) => (
              <article key={pkg.key} className={`relative flex flex-col rounded-md p-7 ${pkg.recommended ? "bg-paper-50 text-navy-900 ring-2 ring-gold-400" : "border border-white/12 bg-white/[0.04] text-white"}`}>
                {pkg.recommended ? <span className="absolute -top-3 start-6 bg-gold-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-950">{content.fees.recommended}</span> : null}
                <p className={`b-label ${pkg.recommended ? "text-gold-700" : "text-gold-300"}`}>{pkg.tagline}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold">{pkg.name}</h3>
                <p className="mt-5 font-display text-5xl font-semibold tabular-nums">
                  <span className={`font-sans text-base font-medium ${pkg.recommended ? "text-navy-900/60" : "text-white/55"}`}>{content.fees.currency} </span>
                  {sar(pkg.price)}
                </p>
                <p className={`mt-1 text-sm ${pkg.recommended ? "text-navy-900/60" : "text-white/55"}`}>
                  {content.fees.approx} {sar(pkg.usd)} · {content.fees.plusVat}
                </p>
                <div className={`my-5 h-px ${pkg.recommended ? "bg-gold-500/40" : "bg-white/15"}`} />
                <p className="text-sm font-semibold">{pkg.lead}</p>
                <ul className={`mt-2 flex-1 space-y-2 text-[15px] ${pkg.recommended ? "text-navy-900/80" : "text-white/75"}`}>
                  {pkg.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className={`mt-1 size-4 shrink-0 ${pkg.recommended ? "text-gold-600" : "text-gold-300"}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`${applyHref}?package=${pkg.key}`} className={`mt-7 ${pkg.recommended ? "site-btn-gold" : "site-btn-light"}`}>
                  {content.fees.choose}
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start" data-reveal>
            <div>
              <h3 className="font-display text-2xl font-semibold">{content.fees.servicesTitle}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70">{content.fees.servicesIntro}</p>
              <p className="mt-4 text-sm text-white/50">{content.fees.servicesNote}</p>
              <p className="mt-3 text-sm text-white/50">{content.fees.footnote}</p>
            </div>
            <div className="divide-y divide-white/10 rounded-md border border-white/12 bg-navy-950/50">
              {content.fees.groups.map((group, gi) => (
                <details key={group.title} className="group" open={gi === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-3 py-3.5 text-[15px] font-semibold sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span>
                      {group.title} <span className="font-normal text-white/45">({group.services.length})</span>
                    </span>
                    <span className="text-gold-300 transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <table className="w-full border-t border-white/10 text-sm">
                    <tbody>
                      {group.services.map((s) => (
                        <tr key={s.code} className="border-b border-white/[0.06] last:border-0">
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-gold-300/70 sm:px-5" dir="ltr">
                            {s.code}
                          </td>
                          <td className="px-2 py-2.5 text-white/85">{s.name}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-end font-semibold tabular-nums sm:px-5">
                            {s.price === null ? (
                              <span className="font-normal text-white/50">{content.fees.onRequest}</span>
                            ) : (
                              <>
                                {content.fees.currency} {sar(s.price)}
                                {s.unit ? <span className="font-normal text-white/45"> {content.fees.units[s.unit]}</span> : null}
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

      {/* The firm on paper */}
      <section id="why" className="bg-paper-100 py-20 scroll-mt-16">
        <div className="site-wrap">
          <div data-reveal>
            <p className="site-eyebrow">{content.why.eyebrow}</p>
            <h2 className="site-h2">{content.why.title}</h2>
          </div>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2" data-reveal>
            {content.why.points.map((p, i) => (
              <div key={p.title} className="border-t border-gold-500/60 pt-4">
                <span className="b-label text-gold-600">0{i + 1}</span>
                <h3 className="mt-1 text-lg font-semibold text-navy-900">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-navy-900/75">{p.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" data-reveal>
            <div>
              <h3 className="font-display text-2xl font-semibold text-navy-900">{content.why.firmTitle}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-navy-900/75">{content.why.firmText}</p>
              <a href={MAIN_SITE_URL} target="_blank" rel="noreferrer" className="site-btn-outline mt-6">
                {content.why.mainSiteCta}
                <ExternalLink className="size-4" />
              </a>
            </div>
            <div>
              <p className="b-label text-gold-600">{content.why.practiceTitle}</p>
              <ol className="mt-3 columns-1 gap-x-8 sm:columns-2">
                {content.why.practiceAreas.map((area, i) => (
                  <li key={area} className="flex items-baseline gap-3 border-b border-dotted border-paper-200 py-2 text-[14.5px] text-navy-900/85">
                    <span className="font-mono text-[11px] text-gold-600">{String(i + 1).padStart(2, "0")}</span>
                    {area}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-16" data-reveal>
            <p className="b-label text-gold-600">{content.why.foundersTitle}</p>
            <ul className="mt-5 grid gap-6 md:grid-cols-3">
              {content.why.founders.map((f) => (
                <li key={f.name} className="flex gap-5">
                  {f.photo ? (
                    <Image src={f.photo} alt={f.name} width={120} height={120} className="size-[120px] shrink-0 rounded-md border border-gold-500/60 object-cover p-1" />
                  ) : null}
                  <div>
                    <h4 className="font-display text-xl font-semibold text-navy-900">{f.name}</h4>
                    <p className="text-sm text-gold-700">{f.role}</p>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-navy-900/70">{f.credentials}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-3xl text-[14px] leading-relaxed text-navy-900/65">{content.why.teamText}</p>
          </div>
        </div>
      </section>

      {/* Tenders ledger */}
      <section id="tenders" className="b-ledger bg-navy-950 py-20 text-white scroll-mt-16">
        <div className="site-wrap grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center" data-reveal>
          <div>
            <p className="site-eyebrow text-gold-300">{content.tenders.eyebrow}</p>
            <h2 className="site-h2 text-white">{content.tenders.title}</h2>
            <p className="site-lead text-white/70">{content.tenders.text}</p>
            <ul className="mt-6 grid gap-2 text-[15px] text-white/80">
              {content.tenders.points.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <Check className="mt-1 size-4 shrink-0 text-gold-300" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-gold-300/40 bg-navy-900/80 p-8 text-center backdrop-blur-sm">
            <p className="b-label text-gold-300">{content.tenders.eyebrow}</p>
            <p className="mt-3 font-display text-3xl font-semibold" dir="ltr">
              tender.aglc.sa
            </p>
            <a href={content.tenders.url} target="_blank" rel="noreferrer" className="site-btn-gold mt-6 w-full">
              {content.tenders.cta}
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Residency */}
      <section id="residency" className="bg-paper-50 py-20 scroll-mt-16">
        <div className="site-wrap">
          <div data-reveal>
            <p className="site-eyebrow">{content.residency.eyebrow}</p>
            <h2 className="site-h2">{content.residency.title}</h2>
            <p className="site-lead">{content.residency.intro}</p>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3" data-reveal>
            {content.residency.tracks.map((t, i) => (
              <div key={t.title} className="border-t border-gold-500/60 pt-4">
                <span className="b-label text-gold-600">0{i + 1}</span>
                <h3 className="mt-1 font-display text-xl font-semibold text-navy-900">{t.title}</h3>
                <ul className="mt-3 space-y-2 text-[15px] text-navy-900/80">
                  {t.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-1 size-4 shrink-0 text-gold-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Link href={`${applyHref}?service=residency`} className="site-btn-outline mt-10">
            {content.residency.cta}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-paper-200 bg-white py-20 scroll-mt-16">
        <div className="site-wrap">
          <div data-reveal>
            <p className="site-eyebrow">{content.faq.eyebrow}</p>
            <h2 className="site-h2">{content.faq.title}</h2>
          </div>
          <div className="mt-8 grid gap-x-12 md:grid-cols-2" data-reveal>
            {[content.faq.items.slice(0, 4), content.faq.items.slice(4)].map((col, ci) => (
              <div key={ci} className="divide-y divide-paper-200 border-t border-paper-200">
                {col.map((item, i) => (
                  <details key={item.q} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-start gap-4 text-[16px] font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
                      <span className="mt-0.5 w-7 shrink-0 font-mono text-xs text-gold-600">{String(ci * 4 + i + 1).padStart(2, "0")}</span>
                      <span className="flex-1">{item.q}</span>
                      <span className="mt-1 text-gold-600 transition-transform group-open:rotate-45" aria-hidden>
                        +
                      </span>
                    </summary>
                    <p className="mt-3 ps-11 text-[15px] leading-relaxed text-navy-900/75">{item.a}</p>
                  </details>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-navy-900/55">{content.faq.disclaimer}</p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="b-grid bg-navy-950 py-20 text-white scroll-mt-16">
        <div className="site-wrap grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center" data-reveal>
          <div>
            <p className="site-eyebrow text-gold-300">{content.contact.eyebrow}</p>
            <h2 className="site-h2 text-white">{content.contact.title}</h2>
            <p className="site-lead text-white/70">{content.contact.intro}</p>
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
          <dl className="grid gap-5 border-s border-gold-300/40 ps-6">
            <div className="flex gap-4">
              <Phone className="mt-1 size-5 shrink-0 text-gold-300" />
              <div>
                <dt className="b-label text-white/50">{content.contact.phone}</dt>
                <dd className="mt-1 text-lg" dir="ltr">
                  {FIRM.phone}
                </dd>
              </div>
            </div>
            <div className="flex gap-4">
              <Mail className="mt-1 size-5 shrink-0 text-gold-300" />
              <div>
                <dt className="b-label text-white/50">{content.contact.email}</dt>
                <dd className="mt-1 text-lg">{FIRM.email}</dd>
              </div>
            </div>
            <div className="flex gap-4">
              <MapPin className="mt-1 size-5 shrink-0 text-gold-300" />
              <div>
                <dt className="b-label text-white/50">{content.contact.offices}</dt>
                <dd className="mt-1 text-lg">{content.contact.officesValue}</dd>
              </div>
            </div>
          </dl>
        </div>
      </section>

      <SiteFooter content={content} home={home} otherHref={otherHref} />

      {/* Draft switch, only on this variant */}
      <Link
        href={ar ? "/ar" : "/"}
        className="fixed bottom-4 end-4 z-40 rounded-full border border-gold-500/60 bg-navy-950/90 px-4 py-2 text-xs font-semibold text-gold-300 shadow-lg backdrop-blur hover:bg-navy-900"
        style={{ bottom: "max(16px, env(safe-area-inset-bottom, 0px))" }}
      >
        {ar ? "الخيار ب · عرض الخيار أ" : "Option B · view Option A"}
      </Link>
    </div>
  );
}
