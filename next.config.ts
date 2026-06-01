import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // X-XSS-Protection removed — deprecated in all modern browsers and actively
  // harmful in some older IE versions. CSP is the correct replacement but requires
  // mapping all Clerk/ChipiPay domains first — deferred until domains are confirmed.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Both `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` were
  // removed 2026-05-26 — the original blockers (DropFactoryABI export, 71
  // legacy lint errors) are resolved. tsc --noEmit is clean and all 52
  // ESLint errors were fixed (any casts narrowed, unescaped entities,
  // <a>→<Link>, empty interface, require→import). 149 warnings (mostly
  // no-unused-vars) remain; warnings don't block builds in Next 15.
  //
  // If a transient type or lint issue lands, fix it instead of toggling
  // these back on — restoring the bypass would hide real regressions.
  async redirects() {
    return [
      { source: "/terms",          destination: "https://docs.medialane.io/guidelines/terms",          permanent: true },
      { source: "/privacy",        destination: "https://docs.medialane.io/guidelines/privacy",        permanent: true },
      { source: "/campaign-terms", destination: "https://docs.medialane.io/guidelines/campaign-terms", permanent: true },
      { source: "/portfolio/remix-offers", destination: "/portfolio/licensing", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    // All external images are proxied server-side through /api/ipfs and /api/img,
    // so Vercel's /_next/image optimizer is not needed and hits quota on free plan.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        pathname: "/ipfs/**",
      },
      {
        // Dedicated Pinata gateways (e.g. myapp.mypinata.cloud)
        protocol: "https",
        hostname: "**.mypinata.cloud",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "dweb.link",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "cloudflare-ipfs.com",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "**.clerk.com",
      },
      {
        // NFT token images can be hosted on any external CDN — allow all HTTPS sources.
        // Restricting by hostname breaks images for any collection not on Pinata/IPFS.
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ws: false,
      };
    }
    return config;
  },
};

export default nextConfig;
