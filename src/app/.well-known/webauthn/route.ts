const RELATED_ORIGINS = [
  "https://www.medialane.io",
  "https://medialane.io",
  "https://portal.medialane.io",
  "https://starknet.medialane.io",
];

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    { origins: RELATED_ORIGINS },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
