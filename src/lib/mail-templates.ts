export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export type TemplateRequest =
  | { template: "verification-code"; data: { code: string } }
  | { template: "verification-reminder"; data: { confirmToken: string; deadline: Date } }
  | { template: "guardian-set"; data: { walletAddress: string } }
  | { template: "guardian-escape-triggered"; data: { walletAddress: string; readyAt: Date } }
  | { template: "guardian-escape-completed"; data: { walletAddress: string } };

const CODE = /^\d{6}$/;
const ADDRESS = /^0x[0-9a-fA-F]{1,64}$/;
const TOKEN = /^[A-Za-z0-9_-]{1,2000}\.[A-Za-z0-9_-]{1,200}$/;

const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
const matching = (value: unknown, pattern: RegExp): string | null =>
  typeof value === "string" && pattern.test(value) ? value : null;
const date = (value: unknown): Date | null => {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function parseTemplateRequest(body: unknown): TemplateRequest | null {
  const b = record(body);
  const data = record(b?.data);
  if (!b || !data) return null;

  switch (b.template) {
    case "verification-code": {
      const code = matching(data.code, CODE);
      return code ? { template: "verification-code", data: { code } } : null;
    }
    case "verification-reminder": {
      const confirmToken = matching(data.confirmToken, TOKEN);
      const deadline = date(data.deadline);
      return confirmToken && deadline ? { template: "verification-reminder", data: { confirmToken, deadline } } : null;
    }
    case "guardian-set":
    case "guardian-escape-completed": {
      const walletAddress = matching(data.walletAddress, ADDRESS);
      return walletAddress ? { template: b.template, data: { walletAddress } } : null;
    }
    case "guardian-escape-triggered": {
      const walletAddress = matching(data.walletAddress, ADDRESS);
      const readyAt = date(data.readyAt);
      return walletAddress && readyAt ? { template: "guardian-escape-triggered", data: { walletAddress, readyAt } } : null;
    }
    default:
      return null;
  }
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsaquo;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const IGNORE_FOOTER = "If you didn't sign up, you can ignore this email. Medialane will never ask you for your recovery key.";

function layout(content: string, footer: string): string {
  return `
    <div style="max-width:480px;margin:0 auto;padding:32px 16px;font-family:${FONT};color:#111827;">
      <div style="text-align:center;padding-bottom:28px;">
        <img src="https://medialane.io/medialane-light-logo.png" alt="Medialane" height="28" style="height:28px;" />
      </div>
      ${content}
      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:28px;">
        ${footer}
      </p>
    </div>
  `;
}

const formatDate = (value: Date): string =>
  value.toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });

const shortAddress = (address: string): string => `${address.slice(0, 6)}…${address.slice(-4)}`;

const button = (url: string): string =>
  `<a href="${escapeHtml(url)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">Confirm my email</a>`;

function verificationCode(code: string): RenderedEmail {
  const html = `
    <div style="max-width:480px;margin:0 auto;padding:32px 16px;font-family:${FONT};">
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
  const text = [
    `Your verification code is ${code}.`,
    "",
    "This code expires in 10 minutes.",
    "",
    "If you didn't request this, you can safely ignore this email.",
  ].join("\n");
  return { subject: "Your verification code", html, text };
}

function reminder(data: { confirmToken: string; deadline: Date }, appUrl: string): RenderedEmail {
  const when = formatDate(data.deadline);
  const url = `${appUrl}/confirm-email#token=${data.confirmToken}`;
  const consequence = `If it isn't confirmed by ${when}, your account will be closed and this email address will be released. A closed account cannot be reopened.`;

  const text = [
    `Your Medialane account closes on ${when} unless you confirm your email.`,
    "",
    `Confirm your email: ${url}`,
    "",
    consequence,
    "",
    IGNORE_FOOTER,
  ].join("\n");

  const html = layout(
    `
      <h1 style="margin:0 0 8px;font-size:22px;">Confirm your email to keep your account</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;">Your Medialane account closes on <strong>${escapeHtml(when)}</strong> unless you confirm your email.</p>
      <div style="background:#f6f7f9;border-radius:16px;padding:24px;text-align:center;">
        ${button(url)}
        <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">${escapeHtml(consequence)}</p>
      </div>`,
    IGNORE_FOOTER,
  );

  return { subject: `Confirm your email by ${when.replace(/ \d{4}$/, "")} to keep your Medialane account`, html, text };
}

const GUARDIAN_FOOTER =
  "Medialane will never ask you for your recovery key. Treat any message requesting it as an attempt to take your assets.";

function guardianAlert(subject: string, headline: string, bodyHtml: string): RenderedEmail {
  const html = `
    <div style="max-width:480px;margin:0 auto;padding:32px 16px;font-family:${FONT};">
      <div style="text-align:center;padding-bottom:28px;">
        <img src="https://medialane.io/medialane-light-logo.png" alt="Medialane" height="28" style="height:28px;" />
      </div>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:16px;padding:32px 24px;">
        <p style="margin:0 0 8px;color:#991b1b;font-size:15px;font-weight:700;">${headline}</p>
        ${bodyHtml}
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">
        ${GUARDIAN_FOOTER}
      </p>
    </div>
  `;
  return { subject, html, text: htmlToText(html) };
}

export function renderTemplate(request: TemplateRequest, appUrl: string): RenderedEmail {
  switch (request.template) {
    case "verification-code":
      return verificationCode(request.data.code);
    case "verification-reminder":
      return reminder(request.data, appUrl);
    case "guardian-set":
      return guardianAlert(
        "A guardian was added to your Medialane wallet",
        "A guardian was added to your wallet",
        `<p style="margin:0;color:#111827;font-size:14px;">A guardian can now help recover wallet ${shortAddress(request.data.walletAddress)} if you lose every
      device, but can never move your funds directly. If you set this up yourself, no action is needed.
      If you didn't, open Medialane and check Settings → Security &amp; Recovery.</p>`,
      );
    case "guardian-escape-triggered":
      return guardianAlert(
        "Security alert: a guardian started recovering your Medialane wallet",
        "A guardian started replacing your wallet's owner key",
        `<p style="margin:0 0 12px;color:#111827;font-size:14px;">Wallet ${shortAddress(request.data.walletAddress)} can get a new owner key on or after
      <strong>${request.data.readyAt.toUTCString()}</strong> unless you cancel it first.</p>
    <p style="margin:0;color:#111827;font-size:14px;">If this was you (recovering with a guardian), no action is needed.
      If it wasn't, open Medialane, go to Settings → Security &amp; Recovery, and cancel it now.</p>`,
      );
    case "guardian-escape-completed":
      return guardianAlert(
        "Security alert: your Medialane wallet's owner key was replaced",
        "Your wallet's owner key was just replaced by a guardian",
        `<p style="margin:0;color:#111827;font-size:14px;">Wallet ${shortAddress(request.data.walletAddress)} now has a new owner key, set by its guardian.
      If this was you completing a recovery, no action is needed. If it wasn't, your old device's key no longer
      controls this wallet — contact support right away.</p>`,
      );
  }
}
