import CopyButton from "./CopyButton";
import { featureIcons, IconExternal, IconGithub } from "./icons";
import type { LandingContent } from "./content";
import { GITHUB_URL, PERICODES_URL, SITE_NAME, SITE_URL } from "./site";

function CodeBlock({
  code,
  copyLabel,
  copiedLabel,
}: {
  code: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <div className="relative mt-2">
      <pre className="overflow-x-auto rounded-xl bg-[#0f172a] p-4 pr-16 text-[13px] leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
      <CopyButton code={code} copyLabel={copyLabel} copiedLabel={copiedLabel} />
    </div>
  );
}

function JsonLd({ content }: { content: LandingContent }) {
  const path = content.locale === "en" ? "/en" : "/";
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: ["es", "en"],
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: "Pericodes",
        url: PERICODES_URL,
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        url,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        inLanguage: content.htmlLang,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        author: { "@id": `${SITE_URL}/#org` },
        codeRepository: GITHUB_URL,
        description: content.seo.description,
      },
      {
        "@type": "HowTo",
        name: content.deploy.title,
        description: content.deploy.subtitle,
        inLanguage: content.htmlLang,
        step: [
          ...content.deploy.cloneCommands.map((step, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: step.label,
            text: step.command,
          })),
          {
            "@type": "HowToStep",
            position: content.deploy.cloneCommands.length + 1,
            name: content.deploy.schemaTitle,
            text: content.deploy.schemaCommand,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faq.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

export default function LandingPage({ content }: { content: LandingContent }) {
  const { copy, copied } = content.deploy;
  const Icon = featureIcons;

  return (
    <>
      <JsonLd content={content} />
      {content.locale === "en" ? (
        <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.lang="en"' }} />
      ) : null}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-on-primary"
      >
        {content.nav.skip}
      </a>

      <header className="sticky top-0 z-40 border-b border-outline-variant/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <a href={content.locale === "en" ? "/en" : "/"} className="flex items-center gap-2 min-w-0">
            <img
              src="/bill-splitting-app-logo.svg"
              alt={SITE_NAME}
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg"
              decoding="async"
            />
            <span className="truncate text-sm font-bold text-primary sm:text-base">{SITE_NAME}</span>
          </a>
          <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-3">
            <a href="#funciones" className="hidden text-sm font-medium text-on-surface-variant hover:text-primary md:inline">
              {content.nav.features}
            </a>
            <a href="#codigo-abierto" className="hidden text-sm font-medium text-on-surface-variant hover:text-primary md:inline">
              {content.nav.openSource}
            </a>
            <a href="#desplegar" className="hidden text-sm font-medium text-on-surface-variant hover:text-primary lg:inline">
              {content.nav.deploy}
            </a>
            <span className="flex items-center rounded-full border border-outline-variant bg-surface-container-low p-0.5 text-xs font-semibold">
              <span className="rounded-full bg-primary px-2 py-1 text-on-primary" aria-current="page">
                {content.nav.languageName}
              </span>
              <a
                href={content.nav.languageOtherHref}
                hrefLang={content.locale === "es" ? "en" : "es"}
                className="px-2 py-1 text-on-surface-variant hover:text-primary"
              >
                {content.nav.languageOther}
              </a>
            </span>
            <a
              href="/login"
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary hover:opacity-90"
            >
              {content.nav.useApp}
            </a>
          </nav>
        </div>
      </header>

      <main id="contenido" lang={content.htmlLang}>
        <section className="relative overflow-hidden border-b border-outline-variant bg-gradient-to-b from-primary-container/80 to-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.15fr_0.85fr] md:items-center md:py-20">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-semibold text-on-primary-container">
                <IconGithub className="h-4 w-4" />
                {content.hero.badge}
              </p>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-on-surface sm:text-5xl">
                {content.hero.title}
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-on-surface-variant sm:text-lg">
                {content.hero.lead}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-sm hover:opacity-90"
                >
                  {content.hero.ctaApp}
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-5 py-3 text-sm font-semibold text-on-surface hover:border-primary hover:text-primary"
                >
                  <IconGithub />
                  {content.hero.ctaGithub}
                  <IconExternal className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-4 text-sm text-outline">{content.hero.note}</p>
            </div>
            <aside className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                {content.how.title}
              </p>
              <ol className="mt-4 space-y-4">
                {content.how.steps.map((step) => (
                  <li key={step.n} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary-container">
                      {step.n}
                    </span>
                    <div>
                      <p className="font-semibold text-on-surface">{step.title}</p>
                      <p className="mt-0.5 text-sm text-on-surface-variant">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        <section id="funciones" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold text-on-surface">{content.features.title}</h2>
          <p className="mt-2 max-w-2xl text-on-surface-variant">{content.features.subtitle}</p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.features.items.map((item) => {
              const ItemIcon = Icon[item.icon];
              return (
                <li
                  key={item.title}
                  className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                    <ItemIcon />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-on-surface">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{item.body}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="codigo-abierto" className="scroll-mt-20 border-y border-outline-variant bg-primary-container/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-on-surface">{content.openSource.title}</h2>
              <p className="mt-4 text-pretty leading-relaxed text-on-surface-variant">{content.openSource.body}</p>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <IconGithub />
                {content.openSource.repoLabel}
              </a>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface">{content.openSource.contributeTitle}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{content.openSource.contributeBody}</p>
              <ol className="mt-6 space-y-5">
                {content.openSource.contributeSteps.map((step, i) => (
                  <li key={step.title}>
                    <p className="text-sm font-semibold text-on-surface">
                      {i + 1}. {step.title}
                    </p>
                    {step.body ? <p className="mt-1 text-sm text-on-surface-variant">{step.body}</p> : null}
                    {step.command ? (
                      <CodeBlock code={step.command} copyLabel={copy} copiedLabel={copied} />
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="requisitos" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold text-on-surface">{content.requirements.title}</h2>
          <p className="mt-2 max-w-2xl text-on-surface-variant">{content.requirements.subtitle}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {content.requirements.items.map((item) => (
              <li key={item.title} className="rounded-2xl border border-outline-variant bg-white p-5">
                <h3 className="font-semibold text-on-surface">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="desplegar" className="scroll-mt-20 border-t border-outline-variant bg-surface-container-low">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-bold text-on-surface">{content.deploy.title}</h2>
            <p className="mt-2 max-w-3xl text-on-surface-variant">{content.deploy.subtitle}</p>

            <article className="mt-10 rounded-2xl border border-outline-variant bg-white p-6">
              <h3 className="text-xl font-semibold">{content.deploy.neonTitle}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{content.deploy.neonIntro}</p>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-on-surface">
                {content.deploy.neonSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>

            <article className="mt-6 rounded-2xl border border-outline-variant bg-white p-6">
              <h3 className="text-xl font-semibold">{content.deploy.envTitle}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{content.deploy.envIntro}</p>
              <CodeBlock code={content.deploy.envFile} copyLabel={copy} copiedLabel={copied} />
            </article>

            <article className="mt-6 rounded-2xl border border-outline-variant bg-white p-6">
              <h3 className="text-xl font-semibold">{content.deploy.cloneTitle}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{content.deploy.cloneIntro}</p>
              <ol className="mt-4 space-y-4">
                {content.deploy.cloneCommands.map((step, i) => (
                  <li key={step.label}>
                    <p className="text-sm font-semibold text-on-surface">
                      {i + 1}. {step.label}
                    </p>
                    <CodeBlock code={step.command} copyLabel={copy} copiedLabel={copied} />
                  </li>
                ))}
              </ol>
            </article>

            <article className="mt-6 rounded-2xl border border-outline-variant bg-white p-6">
              <h3 className="text-xl font-semibold">{content.deploy.schemaTitle}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{content.deploy.schemaIntro}</p>
              <CodeBlock code={content.deploy.schemaCommand} copyLabel={copy} copiedLabel={copied} />
            </article>

            <article className="mt-6 rounded-2xl border border-outline-variant bg-white p-6">
              <h3 className="text-xl font-semibold">{content.deploy.localTitle}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{content.deploy.localIntro}</p>
              <CodeBlock code={content.deploy.localCommand} copyLabel={copy} copiedLabel={copied} />
            </article>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-outline-variant bg-white p-6">
                <h3 className="text-xl font-semibold">{content.deploy.vercelTitle}</h3>
                <p className="mt-2 text-sm text-on-surface-variant">{content.deploy.vercelIntro}</p>
                <ol className="mt-4 space-y-5">
                  {content.deploy.vercelSteps.map((step, i) => (
                    <li key={step.title}>
                      <p className="text-sm font-semibold text-on-surface">
                        {i + 1}. {step.title}
                      </p>
                      {step.body ? <p className="mt-1 text-sm text-on-surface-variant">{step.body}</p> : null}
                      {step.command ? (
                        <CodeBlock code={step.command} copyLabel={copy} copiedLabel={copied} />
                      ) : null}
                    </li>
                  ))}
                </ol>
              </article>
              <article className="rounded-2xl border border-outline-variant bg-white p-6">
                <h3 className="text-xl font-semibold">{content.deploy.netlifyTitle}</h3>
                <p className="mt-2 text-sm text-on-surface-variant">{content.deploy.netlifyIntro}</p>
                <ol className="mt-4 space-y-5">
                  {content.deploy.netlifySteps.map((step, i) => (
                    <li key={step.title}>
                      <p className="text-sm font-semibold text-on-surface">
                        {i + 1}. {step.title}
                      </p>
                      {step.body ? <p className="mt-1 text-sm text-on-surface-variant">{step.body}</p> : null}
                      {step.command ? (
                        <CodeBlock code={step.command} copyLabel={copy} copiedLabel={copied} />
                      ) : null}
                    </li>
                  ))}
                </ol>
              </article>
            </div>

            <p className="mt-8 rounded-xl border border-primary/20 bg-primary-container/50 p-4 text-sm text-on-primary-container">
              <strong>{content.deploy.afterTitle}.</strong> {content.deploy.afterBody}
            </p>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold text-on-surface">{content.faq.title}</h2>
          <div className="mt-8 divide-y divide-outline-variant rounded-2xl border border-outline-variant bg-white">
            {content.faq.items.map((item) => (
              <details key={item.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold text-on-surface marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-3">
                    {item.q}
                    <span className="shrink-0 text-outline" aria-hidden="true">
                      <span className="group-open:hidden">+</span>
                      <span className="hidden group-open:inline">−</span>
                    </span>
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-on-surface-variant">
            {content.footer.credit}{" "}
            <a href={PERICODES_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
              {content.footer.pericodes}
            </a>
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary">
              {content.footer.github}
            </a>
            <a href="/login" className="text-on-surface-variant hover:text-primary">
              {content.footer.useApp}
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
