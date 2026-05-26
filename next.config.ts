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
  // `typescript: { ignoreBuildErrors: true }` was removed 2026-05-26 —
  // the original blocker (DropFactoryABI export) shipped in SDK 0.20+ and
  // `tsc --noEmit` is now clean. Re-adding the bypass would hide real
  // regressions; if a transient type issue lands, fix it instead of toggling.
  //
  // ESLint runs separately via `bun lint` — gating the production build on it
  // would block deploys until every legacy `any` / unused var is cleaned up
  // (~71 errors as of 2026-05-25; tracked in plan Batch D.2). The flat config
  // added in PR #40 exists to make `bun lint` actionable, not to gate builds.
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      { source: "/terms",          destination: "https://docs.medialane.io/guidelines/terms",          permanent: true },
      { source: "/privacy",        destination: "https://docs.medialane.io/guidelines/privacy",        permanent: true },
      { source: "/campaign-terms", destination: "https://docs.medialane.io/guidelines/campaign-terms", permanent: true },
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
