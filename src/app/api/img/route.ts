import { lookup } from "node:dns/promises";
import { createImageProxyHandler } from "@medialane/sdk";
import { limiterFor } from "@/lib/rate-limit-policy";

export const runtime = "nodejs";

const handler = createImageProxyHandler({
  checkRateLimit: limiterFor("proxy:image"),
  
  resolveHostname: async (hostname) => {
    const records = await lookup(hostname, { all: true, verbatim: true });
    return records.map((record) => record.address);
  },
});

export function GET(req: Request) {
  return handler(req);
}
