import { createImageProxyHandler } from "@medialane/sdk/server";

export const runtime = "nodejs";

const handler = createImageProxyHandler();

export function GET(req: Request) {
  return handler(req);
}
