import type { Metadata } from "next";
import type { LandingContent, LandingLocale } from "./content";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "./site";

export function landingMetadata(content: LandingContent, locale: LandingLocale): Metadata {
  const path = locale === "en" ? "/en" : "/";
  const url = `${SITE_URL}${path === "/" ? "" : path}`;

  return {
    title: { absolute: content.seo.title },
    description: content.seo.description,
    keywords: content.seo.keywords,
    applicationName: SITE_NAME,
    authors: [{ name: "Pericodes", url: "https://pericodes.com/" }],
    creator: "Pericodes",
    publisher: "Pericodes",
    category: "finance",
    alternates: {
      canonical: path,
      languages: {
        es: "/",
        en: "/en",
        "x-default": "/",
      },
    },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      locale: content.seo.ogLocale,
      alternateLocale: locale === "es" ? ["en_US"] : ["es_ES"],
      title: content.seo.title,
      description: content.seo.description,
      images: [
        {
          url: OG_IMAGE,
          width: 512,
          height: 512,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: content.seo.title,
      description: content.seo.description,
      images: [OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}
