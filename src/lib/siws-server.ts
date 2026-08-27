import { createHmac, timingSafeEqual } from "crypto";

// The backend signs identity tokens over a domain tag plus the payload, so a
// token's kind is part of what is signed and an account-session token can never
// be replayed as an identity one. This app verifies tokens the backend issues,
// so it must accept the tagged form *before* the backend starts producing it —
// otherwise every SIWS-gated route here 401s during the rollout.
//
// The untagged branch is for tokens issued before that change; it can go once
// the 24h identity TTL has elapsed since the backend rolled out.
const DOMAIN = "siws-identity-v1";

function signatureMatches(secret: string, payload: string, provided: string): boolean {
  const candidates = [
    createHmac("sha256", secret).update(DOMAIN).update(".").update(payload).digest("hex"),
    createHmac("sha256", secret).update(payload).digest("hex"),
  ];
  for (const expected of candidates) {
    if (provided.length !== expected.length) continue;
    try {
      if (timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"))) return true;
    } catch {
      continue;
    }
  }
  return false;
}

export function verifySiwsToken(raw: string): string | null {
  const secret = process.env.SIWS_SECRET;
  if (!secret) return null;
  if (!raw.startsWith("siws_")) return null;

  const inner = raw.slice(5);
  const dot = inner.lastIndexOf(".");
  if (dot === -1) return null;

  const payload = inner.slice(0, dot);
  const provided = inner.slice(dot + 1);
  if (!signatureMatches(secret, payload, provided)) return null;

  let data: { sub?: string; exp?: number };
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!data.sub || !data.exp) return null;
  if (data.exp < Math.floor(Date.now() / 1000)) return null;

  return data.sub;
}

export function getSiwsWallet(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return verifySiwsToken(authHeader.slice(7));
}
