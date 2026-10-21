import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { isRelayAuthorized, parseRelayRequest } from "@/lib/mail-relay";
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
      from: { name: email.fromName, address: process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER },
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    return NextResponse.json({ ok: true });
  } catch {
    console.error("[mail-relay] send failed");
    return NextResponse.json({ error: "Send failed" }, { status: 502 });
  }
}
