// Lets medialane.io use passkeys created for the www.medialane.io relying party.
export const dynamic = "force-static";

export function GET(): Response {
  return Response.json({ origins: ["https://medialane.io"] });
}
