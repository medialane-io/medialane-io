import { NextRequest, NextResponse } from "next/server";

interface AirdropRegistration {
  name: string;
  email: string;
  role: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AirdropRegistration>;

    if (!body.email || !body.email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    // TODO: replace console.log with Resend / Mailchimp / DB call when ready
    console.log("[airdrop/register]", {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      role: body.role ?? "other",
      ts: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
