import type { MetadataRoute } from "next";
import { SITE_URL } from "@/landing/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: { es: SITE_URL, en: `${SITE_URL}/en` } },
    },
    {
      url: `${SITE_URL}/en`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: { es: SITE_URL, en: `${SITE_URL}/en` } },
    },
  ];
}
