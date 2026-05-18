import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/onboarding",
        "/portfolio/",
        "/create/",
        "/notifications",
        "/sign-in",
        "/sign-up",
        "/welcome",
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
