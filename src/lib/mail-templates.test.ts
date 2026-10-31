import { describe, expect, test } from "bun:test";
import { htmlToText, parseTemplateRequest, renderTemplate, type TemplateRequest } from "./mail-templates";

const APP = "https://www.medialane.io";
const ADDRESS = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const TOKEN = "eyJwIjoiYSJ9.abc-DEF_123";
const DEADLINE = "2026-10-10T12:00:00.000Z";

const render = (request: TemplateRequest) => renderTemplate(request, APP);
const parse = (template: unknown, data: unknown) => parseTemplateRequest({ template, data });
const links = (html: string) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

describe("what the relay accepts", () => {
  test("every template with its exact fields", () => {
    expect(parse("verification-code", { code: "482913" })).not.toBeNull();
    expect(parse("verification-reminder", { confirmToken: TOKEN, deadline: DEADLINE })).not.toBeNull();
    expect(parse("guardian-set", { walletAddress: ADDRESS })).not.toBeNull();
    expect(parse("guardian-escape-triggered", { walletAddress: ADDRESS, readyAt: DEADLINE })).not.toBeNull();
    expect(parse("guardian-escape-completed", { walletAddress: ADDRESS })).not.toBeNull();
  });

  test("an unknown template, missing data or a non-object is refused", () => {
    expect(parse("anything-else", {})).toBeNull();
    expect(parse("verification-code", null)).toBeNull();
    expect(parse("verification-code", {})).toBeNull();
    expect(parseTemplateRequest(null)).toBeNull();
    expect(parseTemplateRequest("x")).toBeNull();
  });

  test("a code is exactly six digits", () => {
    for (const code of ["12345", "1234567", "12345a", "<b>1</b>", ""]) {
      expect(parse("verification-code", { code })).toBeNull();
    }
  });

  test("a wallet address is a hex address", () => {
    for (const walletAddress of ["", "0x", "not-an-address", `${ADDRESS}"><script>`, "0x" + "a".repeat(65)]) {
      expect(parse("guardian-set", { walletAddress })).toBeNull();
    }
  });

  test("a confirm token is the signed token shape and nothing else", () => {
    for (const confirmToken of ["", "nodot", "a.b.c", `${TOKEN}"><script>`, "http://evil.example/x.y", "a b.c"]) {
      expect(parse("verification-reminder", { confirmToken, deadline: DEADLINE })).toBeNull();
    }
  });

  test("a date is a real date", () => {
    expect(parse("verification-reminder", { confirmToken: TOKEN, deadline: "tomorrow" })).toBeNull();
    expect(parse("guardian-escape-triggered", { walletAddress: ADDRESS, readyAt: "" })).toBeNull();
  });
});

describe("the emails", () => {
  test("verification code: carries the code and its lifetime in both parts", () => {
    const { subject, html, text } = render({ template: "verification-code", data: { code: "482913" } });
    expect(subject).toBe("Your verification code");
    for (const body of [html, text]) {
      expect(body).toContain("482913");
      expect(body).toContain("10 minutes");
    }
    expect(text).toContain("If you didn't request this");
  });

  test("reminder: names the date, says what happens, links only to confirm", () => {
    const { subject, html, text } = render({ template: "verification-reminder", data: { confirmToken: TOKEN, deadline: new Date(DEADLINE) } });
    expect(subject).toBe("Confirm your email by 10 October to keep your Medialane account");
    for (const body of [html, text]) expect(body).toContain("10 October 2026");
    expect(text).toContain("cannot be reopened");
    expect(links(html)).toEqual([`${APP}/confirm-email#token=${TOKEN}`]);
    expect(`${html}${text}`.toLowerCase()).not.toContain("starknet");
  });

  test("guardian alerts show a short address, never the full one", () => {
    const cases: TemplateRequest[] = [
      { template: "guardian-set", data: { walletAddress: ADDRESS } },
      { template: "guardian-escape-triggered", data: { walletAddress: ADDRESS, readyAt: new Date(DEADLINE) } },
      { template: "guardian-escape-completed", data: { walletAddress: ADDRESS } },
    ];
    for (const request of cases) {
      const { subject, html, text } = render(request);
      expect(subject.length).toBeGreaterThan(0);
      expect(html).toContain("0x0123…cdef");
      expect(html).not.toContain(ADDRESS);
      expect(text).not.toContain("<");
    }
    expect(render(cases[1]!).html).toContain(new Date(DEADLINE).toUTCString());
  });

  test("the only links an email can contain point at the app", () => {
    const all: TemplateRequest[] = [
      { template: "verification-reminder", data: { confirmToken: TOKEN, deadline: new Date(DEADLINE) } },
      { template: "guardian-set", data: { walletAddress: ADDRESS } },
    ];
    for (const request of all) for (const link of links(render(request).html)) expect(link!.startsWith(`${APP}/`)).toBe(true);
  });
});

describe("the plain-text part", () => {
  test("keeps the words and drops the tags", () => {
    expect(htmlToText("<p>Hello <strong>there</strong></p>")).toBe("Hello there");
  });
  test("puts paragraphs and breaks on their own lines", () => {
    expect(htmlToText("<p>One</p><p>Two<br/>Three</p>")).toBe("One\nTwo\nThree");
  });
  test("decodes the entities the templates use and drops style and script", () => {
    expect(htmlToText("<style>p{}</style><script>x</script><p>A &rsaquo; B &amp; C &quot;d&quot;</p>")).toBe('A > B & C "d"');
  });
});
