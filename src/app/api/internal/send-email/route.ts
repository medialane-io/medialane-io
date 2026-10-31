import { type NextRequest, NextResponse } from "next/server";
import { ZEPTOMAIL_URL, isRelayAuthorized, parseRelayRequest, sendFailure, zeptoMailBody } from "@/lib/mail-relay";
import { APP_URL } from "@/lib/seo";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const relaySecret = process.env.MAIL_RELAY_SECRET;
  if (!relaySecret) return NextResponse.json({ error: "MAIL_RELAY_SECRET not configured" }, { status: 500 });
  if (!isRelayAuthorized(relaySecret, req.headers.get("x-relay-secret") ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = parseRelayRequest(await req.json().catch(() => null), APP_URL);
  if (!email) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const token = process.env.ZEPTOMAIL_TOKEN;
  const fromAddress = process.env.CONTACT_FROM_EMAIL;
  if (!token || !fromAddress) {
    return NextResponse.json({ error: "Email sending is not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(ZEPTOMAIL_URL, {
      method: "POST",
      headers: { Authorization: `Zoho-enczapikey ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(zeptoMailBody(email, fromAddress)),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) return NextResponse.json({ ok: true });
    console.error("[mail-relay] send failed", sendFailure(res.status, await res.json().catch(() => null)));
  } catch (err) {
    console.error("[mail-relay] send failed", { status: 0, code: err instanceof Error ? err.name : undefined });
  }
  return NextResponse.json({ error: "Send failed" }, { status: 502 });
}
