import { isSameOrigin } from "@medialane/sdk";

export const runtime = "nodejs";

const MAX_BODY_CHARS = 4096;
const FIELDS: Record<string, "string" | "number" | "boolean"> = {
  kind: "string",
  fileSize: "number",
  fileType: "string",
  failedAfterMs: "number",
  error: "string",
  fileReadable: "string",
  uploadHostReachable: "string",
  retry: "string",
  online: "boolean",
  connection: "string",
};

export async function POST(req: Request): Promise<Response> {
  if (!isSameOrigin(req)) return new Response(null, { status: 403 });
  const text = await req.text();
  if (text.length > MAX_BODY_CHARS) return new Response(null, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return new Response(null, { status: 400 });

  const report: Record<string, string | number | boolean> = {};
  for (const [key, type] of Object.entries(FIELDS)) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === type) report[key] = typeof value === "string" ? value.slice(0, 300) : (value as number | boolean);
  }

  console.log(JSON.stringify({
    event: "upload_diagnostics",
    ...report,
    userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
  }));
  return new Response(null, { status: 204 });
}
