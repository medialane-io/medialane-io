import { NextResponse } from "next/server";
import announcements from "../../../../public/data/announcements.json";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  const sorted = [...announcements].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return NextResponse.json(sorted);
}
