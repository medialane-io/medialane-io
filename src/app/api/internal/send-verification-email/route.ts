/**
 * Internal mail relay — NOT part of the /v1/* BFF proxy, not reachable by
 * browser clients. Exists because medialane-backend (Railway) cannot reach
 * the configured SMTP host (connection times out from Railway's network),
 * while this Vercel deployment's outbound network can. The backend calls
 * this over HTTPS with a shared secret instead of connecting to SMTP
 * directly for this one email.
 */
import { type NextRequest, NextResponse } from "next/server";
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
  const secret = req.headers.get("x-relay-secret");
  if (!secret || secret !== process.env.MAIL_RELAY_SECRET) {
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
    // Surface the real error message (temporary — this route is internal,
    // not browser-reachable, so no sensitive info leaks to a client) so a
    // failure is diagnosable instead of an opaque 502.
    return NextResponse.json({ error: "Send failed", detail: message }, { status: 502 });
  }
}
