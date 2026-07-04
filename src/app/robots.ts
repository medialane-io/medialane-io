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
        // Owner-only launchpad tools — thin/duplicate-title forms, not indexable content.
        "/launchpad/*/create",
        "/launchpad/*/manage",
        "/launchpad/*/my-drops",
        "/launchpad/*/my-events",
        "/launchpad/*/mint",
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
