import type { NextConfig } from "next";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL ?? "https://api.medialane.io";

const enforcedCsp = [
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
].join("; ");

const reportOnlyCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${BACKEND_ORIGIN} https://www.google-analytics.com https://region1.google-analytics.com`,
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: enforcedCsp },
  { key: "Content-Security-Policy-Report-Only", value: reportOnlyCsp },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // @medialane/ui's single barrel entry point pulls all ~65 components (and
  // their heaviest deps — framer-motion, Radix primitives, the full
  // lucide-react set) into any route importing even one small component.
  // Next's compiler rewrites barrel imports to per-file deep imports at
  // build time when the package is listed here. Confirmed via bun run
  // build: /rewards' First Load JS dropped 407kB → 254kB (~38%); other
  // routes were already narrowly importing and saw no measurable change
  // (see medialane-core memory: medialane-ui-barrel-bloat).
  experimental: {
    optimizePackageImports: ["@medialane/ui"],
  },
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
      // Chain-in-URL (2026-06-19): 301 legacy asset/collection/coin paths to the
      // chained `starknet` form. The (0x…) param regex keeps these from swallowing
      // the new chained routes or any non-address sibling path.
      { source: "/asset/:contract(0x[0-9a-fA-F]+)/:tokenId", destination: "/asset/starknet/:contract/:tokenId", permanent: true },
      { source: "/collections/:contract(0x[0-9a-fA-F]+)",    destination: "/collections/starknet/:contract",    permanent: true },
      { source: "/coins/:address(0x[0-9a-fA-F]+)",           destination: "/coins/starknet/:address",            permanent: true },
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
    // External images come straight from the public IPFS gateway or through
    // /api/img, so Vercel's /_next/image optimizer is not needed and would hit
    // the free-plan quota.
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
