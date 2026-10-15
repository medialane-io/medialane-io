import { createAppGateway } from "@medialane/sdk";
import { ALLOW } from "./allowlist";

const gateway = createAppGateway({
  appId: "MEDIALANE_IO",
  backendUrl: process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL ?? "http://localhost:3001",
  apiKey: process.env.MEDIALANE_API_KEY,
  appSecret: process.env.MEDIALANE_APP_SECRET,
  allow: ALLOW,
});

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }): Promise<Response> {
  return gateway(req, (await ctx.params).path);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
