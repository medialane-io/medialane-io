/**
 * Internal mail relay — NOT part of the /v1/* BFF proxy, not reachable by
 * browser clients. Exists because medialane-backend (Railway, Hobby plan)
 * cannot open outbound SMTP connections at all — Railway blocks ports
 * 25/465/587 on Free/Trial/Hobby plans (connection times out on connect).
 * This Vercel deployment's outbound network is unrestricted, so the backend
 * relays the send here over HTTPS with a shared secret instead.
 */
import { type NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";

// nodemailer needs Node's raw TCP/TLS sockets — must run on the Node.js
// runtime, not Edge (Edge has no `net`/`tls` module and crashes hard,
// before this file's own try/catch can produce a real error response).
export const runtime = "nodejs";

function buildVerificationCodeEmailHtml(code: string): string {
  return `
    <p>Hi there,</p>
    <p>Your Medialane verification code is:</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
    <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    <p>— The Medialane Team</p>
  `;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const relaySecret = process.env.MAIL_RELAY_SECRET;
  if (!relaySecret) {
    return NextResponse.json({ error: "MAIL_RELAY_SECRET not configured" }, { status: 500 });
  }
  const provided = req.headers.get("x-relay-secret") ?? "";

  // HMAC both sides to a fixed 32-byte digest before comparing — avoids
  // length leakage from a raw timingSafeEqual on unequal-length inputs.
  const hmacKey = "mail-relay-auth";
  const expected = createHmac("sha256", hmacKey).update(relaySecret).digest();
  const actual = createHmac("sha256", hmacKey).update(provided).digest();
  if (!timingSafeEqual(expected, actual)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const to = typeof body.to === "string" ? body.to : null;
  const code = typeof body.code === "string" ? body.code : null;
  if (!to || !code) {
    return NextResponse.json({ error: "Missing to/code" }, { status: 400 });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: "SMTP is not configured" }, { status: 500 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject: "Your Medialane verification code",
      html: buildVerificationCodeEmailHtml(code),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[mail-relay] send failed", { message });
    return NextResponse.json({ error: "Send failed", detail: message }, { status: 502 });
  }
}
