import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SUPPORTED_TOKENS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address || address.length < 10) return address || "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function normalizeAddress(address: string): string {
  if (!address) return address;
  const hex = address.startsWith("0x") ? address.slice(2) : address;
  return "0x" + hex.padStart(64, "0").toLowerCase();
}

export function getCurrency(tokenAddress: string) {
  if (!tokenAddress) return { symbol: "TOKEN", decimals: 18 };
  const norm = normalizeAddress(tokenAddress).toLowerCase();
  for (const token of SUPPORTED_TOKENS) {
    if (normalizeAddress(token.address).toLowerCase() === norm) {
      return { symbol: token.symbol, decimals: token.decimals };
    }
  }
  return { symbol: "TOKEN", decimals: 18 };
}

function adaptiveDecimals(num: number): number {
  if (num === 0 || num >= 1) return 2;
  if (num >= 0.01) return 4;
  // Show enough decimals to reveal 2 significant figures (e.g. 0.000014 → 6)
  const leadingZeros = Math.floor(-Math.log10(Math.abs(num)));
  return leadingZeros + 2;
}

export function formatPrice(amount: string, decimals: number): string {
  if (!amount) return "0";
  try {
    const val = BigInt(amount);
    const num = Number(val) / Math.pow(10, decimals);
    return num.toLocaleString(undefined, {
      maximumFractionDigits: adaptiveDecimals(num),
    });
  } catch {
    return "0";
  }
}

export function formatDisplayPrice(price: string | number | null | undefined): string {
  if (price === null || price === undefined) return "";

  const priceStr = String(price);
  const parts = priceStr.split(" ");
  const numericPart = parts[0];
  const currencyPart = parts.length > 1 ? parts.slice(1).join(" ") : "";

  const num = Number(numericPart);
  if (isNaN(num)) return priceStr;

  const maxDecimals = adaptiveDecimals(num);
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: Math.min(2, maxDecimals),
    maximumFractionDigits: maxDecimals,
  });

  return currencyPart ? `${formatted} ${currencyPart}` : formatted;
}

export function ipfsToHttp(uri: string | null | undefined): string {
  if (!uri) return "/placeholder.svg";
  if (uri.startsWith("ipfs://")) {
    // Route through our server-side proxy (/api/ipfs/[...cid]) to avoid:
    //  - Pinata's CORP header blocking cross-origin image loads on free plans
    //  - Client-visible 429 rate-limit errors from the public gateway
    const cid = uri.slice(7); // strips "ipfs://"
    return `/api/ipfs/${cid}`;
  }
  return uri;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function timeUntil(dateStr: string | number): string {
  // Accept Unix seconds as number, numeric string (BigInt serialized), or ISO date string.
  const raw = typeof dateStr === "string" && /^\d+$/.test(dateStr.trim())
    ? Number(dateStr)
    : dateStr;
  const ms = typeof raw === "number" ? raw * 1000 : new Date(raw).getTime();
  const diff = ms - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}
