import { createImageProxyHandler } from "@medialane/sdk/server";

export const runtime = "nodejs";

const handler = createImageProxyHandler({
  backend: {
    appId: "MEDIALANE_IO",
    backendUrl: process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL ?? "http://localhost:3001",
    apiKey: process.env.MEDIALANE_API_KEY,
    appSecret: process.env.MEDIALANE_APP_SECRET,
  },
});

export function GET(req: Request) {
  return handler(req);
}
