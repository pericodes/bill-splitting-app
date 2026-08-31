import type { MetadataRoute } from "next";
import { SITE_URL } from "@/landing/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/en"],
        disallow: ["/login", "/dashboard", "/profile", "/account", "/create-account", "/join"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
