import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/onboarding",
        "/confirm-email",
        "/portfolio/",
        "/create/",
        "/sign-in",
        "/sign-up",
        "/welcome",

        "/launchpad/*/create",
        "/launchpad/*/manage",
        "/launchpad/*/my-drops",
        "/launchpad/*/my-events",
        "/launchpad/*/mint",
      ],
    },
  };
}
