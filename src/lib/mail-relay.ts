import { createHmac, timingSafeEqual } from "node:crypto";
import { parseTemplateRequest, renderTemplate, type RenderedEmail } from "./mail-templates";
const SINGLE_EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;
const FROM_NAME = /^[^\r\n<>@:]{1,40}$/;
const HMAC_KEY = "mail-relay-auth";
const SMTP_ERROR_CODE = /^E[A-Z_]{2,20}$/;
const SMTP_COMMAND = /^[A-Z][A-Z0-9 ]{0,19}$/;

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

export interface SmtpFailure {
  code?: string;
  responseCode?: number;
  command?: string;
}

// Keeps only nodemailer's fixed error fields; its message and server response can contain addresses.
export function smtpFailure(err: unknown): SmtpFailure {
  if (typeof err !== "object" || err === null) return {};
  const { code, responseCode, command } = err as Record<string, unknown>;
  const failure: SmtpFailure = {};
  if (typeof code === "string" && SMTP_ERROR_CODE.test(code)) failure.code = code;
  if (typeof responseCode === "number" && Number.isInteger(responseCode) && responseCode >= 200 && responseCode < 600) {
    failure.responseCode = responseCode;
  }
  if (typeof command === "string" && SMTP_COMMAND.test(command)) failure.command = command;
  return failure;
}
