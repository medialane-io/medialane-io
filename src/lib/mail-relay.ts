import { createHmac, timingSafeEqual } from "node:crypto";
import { parseTemplateRequest, renderTemplate, type RenderedEmail } from "./mail-templates";
const SINGLE_EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;
const FROM_NAME = /^[^\r\n<>@:]{1,40}$/;
const HMAC_KEY = "mail-relay-auth";
const PROVIDER_ERROR_CODE = /^[A-Z]{2,5}_\d{3,5}$/;

export const ZEPTOMAIL_URL = "https://cpaas.zoho.com/v1.1/email";

export interface RelayEmail extends RenderedEmail {
  to: string;
  fromName: string;
}

export const isSingleEmailAddress = (value: string): boolean => value.length <= 254 && SINGLE_EMAIL.test(value);

export function isRelayAuthorized(secret: string, provided: string): boolean {
  const expected = createHmac("sha256", HMAC_KEY).update(secret).digest();
  const actual = createHmac("sha256", HMAC_KEY).update(provided).digest();
  return timingSafeEqual(expected, actual);
}

const text = (value: unknown, max: number): string | null =>
  typeof value === "string" && value.length > 0 && value.length <= max ? value : null;

export function parseRelayRequest(body: unknown, appUrl: string): RelayEmail | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;

  const to = text(b.to, 254);
  const fromName = b.fromName === undefined ? "Medialane.io" : text(b.fromName, 40);
  const request = parseTemplateRequest(body);
  if (!to || !fromName || !request) return null;
  if (!isSingleEmailAddress(to) || !FROM_NAME.test(fromName)) return null;
  return { to, fromName, ...renderTemplate(request, appUrl) };
}

export function zeptoMailBody(email: RelayEmail, fromAddress: string) {
  return {
    from: { address: fromAddress, name: email.fromName },
    to: [{ email_address: { address: email.to } }],
    subject: email.subject,
    htmlbody: email.html,
    textbody: email.text,
  };
}

export interface SendFailure {
  status: number;
  code?: string;
}

// Keeps only the HTTP status and ZeptoMail's error code; its messages can contain addresses.
export function sendFailure(status: number, body: unknown): SendFailure {
  const failure: SendFailure = { status };
  if (typeof body !== "object" || body === null) return failure;
  const b = body as { error?: { code?: unknown }; data?: { error_code?: unknown } };
  const code = b.error?.code ?? b.data?.error_code;
  if (typeof code === "string" && PROVIDER_ERROR_CODE.test(code)) failure.code = code;
  return failure;
}
