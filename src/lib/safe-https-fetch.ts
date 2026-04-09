import dns from "node:dns/promises";
import net from "node:net";

/**
 * Returns true for RFC1918, loopback, link-local, CGNAT, and obvious IPv6 local scopes.
 * Used to block SSRF via /api/img and similar server-side HTTPS fetches.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const s = ip.toLowerCase();
    if (s === "::1") return true;
    const head = s.split(":")[0] || "";
    if (head === "fe80" || head === "fec0") return true;
    if (head.startsWith("ff")) return true;
    if (head.length >= 2) {
      const hi = parseInt(head.slice(0, 2), 16);
      if (hi >= 0xfc && hi <= 0xfd) return true;
    }
    return false;
  }
  return true;
}

function blockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h.endsWith(".local")) return true;
  return false;
}

/**
 * Ensures `url` is https: and resolves only to public IPs (or a public literal).
 * Returns an error message string if unsafe, or null if OK.
 */
export async function assertSafeHttpsUrlForProxy(url: URL): Promise<string | null> {
  if (url.protocol !== "https:") {
    return "Only https URLs allowed";
  }
  if (url.username || url.password) {
    return "URL must not embed credentials";
  }
  const host = url.hostname;
  if (blockedHostname(host)) {
    return "Host not allowed";
  }
  if (net.isIP(host)) {
    return isPrivateOrReservedIp(host) ? "Address not allowed" : null;
  }
  try {
    const records = await dns.lookup(host, { all: true, verbatim: true });
    if (records.length === 0) return "Could not resolve host";
    for (const { address } of records) {
      if (isPrivateOrReservedIp(address)) {
        return "Address not allowed";
      }
    }
  } catch {
    return "Could not resolve host";
  }
  return null;
}

const MAX_REDIRECTS = 8;

/**
 * Fetches a public HTTPS URL without following redirects blindly (redirect SSRF).
 * Each hop is validated; only https: targets are allowed.
 */
export async function fetchHttpsWithSafeRedirects(
  initial: URL,
  init: RequestInit
): Promise<Response> {
  let url = new URL(initial.href);
  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const unsafe = await assertSafeHttpsUrlForProxy(url);
    if (unsafe) {
      throw new Error(unsafe);
    }
    const res = await fetch(url.href, {
      ...init,
      redirect: "manual",
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) {
        return res;
      }
      const next = new URL(loc, url);
      url = next;
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}
