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

export function formatPrice(amount: string, decimals: number): string {
  if (!amount) return "0";
  try {
    const val = BigInt(amount);
    const formatted = Number(val) / Math.pow(10, decimals);
    return formatted.toLocaleString(undefined, {
      maximumFractionDigits: decimals <= 6 ? 2 : 4,
    });
  } catch {
    return "0";
  }
}

export function formatAmount(amount: string, decimals: number): string {
  return formatPrice(amount, decimals);
}

export function ipfsToHttp(uri: string | null | undefined): string {
  if (!uri) return "/placeholder.svg";
  if (uri.startsWith("ipfs://")) {
    const cid = uri.slice(7);
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
  return uri;
}

export function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}
