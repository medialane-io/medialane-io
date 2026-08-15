
import { type NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

function buildVerificationCodeEmailHtml(code: string): string {
  return `
    <div style="max-width:480px;margin:0 auto;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <div style="text-align:center;padding-bottom:28px;">
        <img src="https://medialane.io/medialane-light-logo.png" alt="Medialane" height="28" style="height:28px;" />
      </div>
      <div style="background:#f6f7f9;border-radius:16px;padding:32px 24px;text-align:center;">
        <p style="margin:0 0 4px;color:#111827;font-size:15px;">Your verification code</p>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#111827;margin:16px 0;">${code}</div>
        <p style="margin:0;color:#6b7280;font-size:13px;">This code expires in 10 minutes.</p>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const relaySecret = process.env.MAIL_RELAY_SECRET;
  if (!relaySecret) {
    return NextResponse.json({ error: "MAIL_RELAY_SECRET not configured" }, { status: 500 });
  }
  const provided = req.headers.get("x-relay-secret") ?? "";

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
