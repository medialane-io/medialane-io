import { createAppSessionHandler } from "@medialane/sdk";

export const runtime = "nodejs";

const handler = createAppSessionHandler({
  appId: "MEDIALANE_IO",
  backendUrl: process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL ?? "http://localhost:3001",
  apiKey: process.env.MEDIALANE_API_KEY,
});

export const GET = (req: Request) => handler.GET(req);
export const DELETE = (req: Request) => handler.DELETE(req);
