import { test, expect, describe } from "bun:test";
import { isRelayAuthorized, isSingleEmailAddress, parseRelayRequest, sendFailure, zeptoMailBody } from "./mail-relay";

test("the right secret is authorized and anything else is not", () => {
  expect(isRelayAuthorized("s3cret", "s3cret")).toBe(true);
  expect(isRelayAuthorized("s3cret", "other")).toBe(false);
  expect(isRelayAuthorized("s3cret", "")).toBe(false);
});

test("only a single plain address is accepted as the recipient", () => {
  expect(isSingleEmailAddress("alice@example.com")).toBe(true);
  expect(isSingleEmailAddress("a@b.co, c@d.co")).toBe(false);
  expect(isSingleEmailAddress("Alice <a@b.co>")).toBe(false);
  expect(isSingleEmailAddress("a@b.co\r\nBcc: c@d.co")).toBe(false);
});

test("a request that carries html instead of a template is refused", () => {
  expect(parseRelayRequest({ to: "a@b.co", subject: "Hi", html: "<p>x</p>", text: "x", fromName: "Medialane" }, "https://www.medialane.io")).toBeNull();
  expect(parseRelayRequest(null, "https://www.medialane.io")).toBeNull();
  expect(parseRelayRequest("x", "https://www.medialane.io")).toBeNull();
});

describe("a template request", () => {
  const APP = "https://www.medialane.io";
  const request = { to: "a@b.co", fromName: "Acme", template: "verification-code", data: { code: "482913" } };

  test("is rendered by the relay into the message to send", () => {
    const email = parseRelayRequest(request, APP);
    expect(email?.to).toBe("a@b.co");
    expect(email?.fromName).toBe("Acme");
    expect(email?.subject).toBe("Your verification code");
    expect(email?.html).toContain("482913");
  });

  test("the sender name defaults when left out", () => {
    const { fromName: _omitted, ...rest } = request;
    expect(parseRelayRequest(rest, APP)?.fromName).toBe("Medialane.io");
  });

  test("a bad recipient, sender name, template or data is refused", () => {
    expect(parseRelayRequest({ ...request, to: "a@b.co, c@d.co" }, APP)).toBeNull();
    expect(parseRelayRequest({ ...request, fromName: "Bank <x@y.z>" }, APP)).toBeNull();
    expect(parseRelayRequest({ ...request, template: "nope" }, APP)).toBeNull();
    expect(parseRelayRequest({ ...request, data: { code: "<b>1</b>" } }, APP)).toBeNull();
  });

  test("caller supplied html is ignored: only the template's own markup is sent", () => {
    const email = parseRelayRequest({ ...request, html: "<a href='https://evil.example'>x</a>", subject: "Pay now" }, APP);
    expect(email?.html).not.toContain("evil.example");
    expect(email?.subject).toBe("Your verification code");
  });
});

describe("a ZeptoMail request", () => {
  test("carries the sender, one recipient and both bodies", () => {
    const email = { to: "a@b.co", fromName: "Medialane", subject: "Hi", html: "<p>Hi</p>", text: "Hi" };
    expect(zeptoMailBody(email, "noreply@medialane.io")).toEqual({
      from: { address: "noreply@medialane.io", name: "Medialane" },
      to: [{ email_address: { address: "a@b.co" } }],
      subject: "Hi",
      htmlbody: "<p>Hi</p>",
      textbody: "Hi",
    });
  });
});

describe("a send failure", () => {
  test("keeps the status and the provider error code", () => {
    expect(sendFailure(401, { error: { code: "TM_4001", message: "Access Denied" } })).toEqual({ status: 401, code: "TM_4001" });
    expect(sendFailure(400, { data: { error_code: "TM_3004", message: "Invalid request" } })).toEqual({ status: 400, code: "TM_3004" });
  });

  test("never keeps messages or details, which can carry addresses", () => {
    const body = { error: { code: "TM_3201", message: "Invalid address a@b.co", details: [{ target: "a@b.co" }] } };
    expect(JSON.stringify(sendFailure(400, body))).not.toContain("a@b.co");
  });

  test("drops a code that is not in the expected shape", () => {
    expect(sendFailure(500, { error: { code: "a@b.co" } })).toEqual({ status: 500 });
    expect(sendFailure(500, null)).toEqual({ status: 500 });
    expect(sendFailure(500, "boom")).toEqual({ status: 500 });
  });
});
