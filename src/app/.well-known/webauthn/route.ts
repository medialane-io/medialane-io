export const dynamic = "force-static";

export function GET(): Response {
  return Response.json({ origins: ["https://medialane.io"] });
}
