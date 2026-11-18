import { readStringEnv } from "./env";
import { msg } from "@medialane/ui/i18n";

export {
  SUPPORTED_TOKENS,
  STARKNET_MARKETPLACE_721_CONTRACT,
  STARKNET_MARKETPLACE_1155_CONTRACT,
  STARKNET_COLLECTION_721_CONTRACT,
  STARKNET_COLLECTION_1155_CONTRACT,
  STARKNET_GENESIS_MINT_CONTRACT as MINT_CONTRACT,
} from "@medialane/sdk";

const isServer = typeof window === "undefined";

export const MEDIALANE_BACKEND_URL = isServer
  ? readStringEnv(process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL, "http://localhost:3001")
  : `${window.location.origin}/api/proxy`;

export const MEDIALANE_API_KEY = isServer
  ? readStringEnv(process.env.MEDIALANE_API_KEY)
  : "";

if (!isServer && MEDIALANE_API_KEY) {
  throw new Error(
    "MEDIALANE_API_KEY is non-empty in the browser bundle — the server-only " +
    "secret may be leaking. Check that no env var with a NEXT_PUBLIC_ prefix " +
    "carries the API key, and that the isServer branch above is intact."
  );
}

export const IPFS_GATEWAY = (() => {
  const configured = process.env.NEXT_PUBLIC_PINATA_GATEWAY?.trim();
  if (!configured) return null;
  const withScheme = configured.startsWith("http") ? configured : `https://${configured}`;
  return withScheme.endsWith("/") ? `${withScheme}ipfs/` : `${withScheme}/ipfs/`;
})();

export const EXPLORER_URL =
  readStringEnv(process.env.NEXT_PUBLIC_EXPLORER_URL, "https://voyager.online");

export const DURATION_OPTIONS = [
  { label: msg("1 Day"), seconds: 86400 },
  { label: msg("7 Days"), seconds: 604800 },
  { label: msg("30 Days"), seconds: 2592000 },
  { label: msg("6 Months"), seconds: 15552000 },
  { label: msg("1 Year"), seconds: 31536000 },
  { label: msg("2 Years"), seconds: 63072000 },
] as const;
