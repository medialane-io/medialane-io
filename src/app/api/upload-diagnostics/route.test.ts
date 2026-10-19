import { afterEach, beforeEach, expect, test } from "bun:test";
import { POST } from "./route";

const realLog = console.log;
let logged: string[] = [];

beforeEach(() => {
  logged = [];
  console.log = (line: string) => logged.push(line);
});

afterEach(() => {
  console.log = realLog;
});

const report = {
  kind: "image",
  fileSize: 3143143,
  fileType: "image/jpeg",
  failedAfterMs: 41,
  error: "TypeError: Failed to fetch",
  fileReadable: "ok",
  uploadHostReachable: "ok",
  retry: "TypeError: Failed to fetch",
  online: true,
  connection: "4g",
};

const post = (body: string, headers: Record<string, string> = {}) =>
  POST({
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    text: async () => body,
  } as unknown as Request);

test("a report is logged as one JSON line with the device's user agent", async () => {
  const res = await post(JSON.stringify(report), { "user-agent": "Mozilla/5.0 (Linux; Android 10; K) Chrome/155.0.0.0 Mobile" });
  expect(res.status).toBe(204);
  expect(logged).toHaveLength(1);
  expect(JSON.parse(logged[0])).toEqual({
    event: "upload_diagnostics",
    ...report,
    userAgent: "Mozilla/5.0 (Linux; Android 10; K) Chrome/155.0.0.0 Mobile",
  });
});

test("fields outside the report and fields of the wrong type are dropped", async () => {
  await post(JSON.stringify({ ...report, walletAddress: "0xabc", fileSize: "big" }));
  const line = JSON.parse(logged[0]);
  expect(line.walletAddress).toBeUndefined();
  expect(line.fileSize).toBeUndefined();
  expect(line.kind).toBe("image");
});

test("long strings are cut to 300 characters", async () => {
  await post(JSON.stringify({ ...report, error: "x".repeat(1000) }));
  expect(JSON.parse(logged[0]).error).toHaveLength(300);
});

test("a cross-origin report is refused", async () => {
  const res = await post(JSON.stringify(report), { origin: "https://elsewhere.example", host: "www.medialane.io" });
  expect(res.status).toBe(403);
  expect(logged).toHaveLength(0);
});

test("an oversized or malformed body is refused without logging", async () => {
  expect((await post("x".repeat(5000))).status).toBe(413);
  expect((await post("not json")).status).toBe(400);
  expect((await post("[1,2]")).status).toBe(400);
  expect(logged).toHaveLength(0);
});
