import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL!;
const API_KEY = process.env.NEXT_PUBLIC_MEDIALANE_API_KEY!;

function normalizeAddress(addr: string): string {
  const hex = addr.toLowerCase().replace(/^0x/, "");
  return "0x" + hex.padStart(64, "0");
}

export async function POST(req: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Forward the Clerk JWT so the backend can derive reporterUserId from it.
  // The backend's clerkJwtOnly middleware validates this token — reporterUserId
  // is never accepted from the request body.
  const clerkToken = await getToken();
  if (!clerkToken) {
    return NextResponse.json({ error: "Could not obtain session token" }, { status: 401 });
  }

  let body: {
    targetType: "TOKEN" | "COLLECTION" | "CREATOR" | "COMMENT";
    targetContract?: string;
    targetTokenId?: string;
    targetAddress?: string;
    targetId?: string;
    categories: string[];
    description?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.targetType || !body.categories?.length) {
    return NextResponse.json(
      { error: "targetType and categories are required" },
      { status: 400 }
    );
  }

  const validTypes = ["TOKEN", "COLLECTION", "CREATOR", "COMMENT"];
  if (!validTypes.includes(body.targetType)) {
    return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
  }

  const normalizedContract = body.targetContract
    ? normalizeAddress(body.targetContract)
    : undefined;
  const normalizedAddress = body.targetAddress
    ? normalizeAddress(body.targetAddress)
    : undefined;

  let targetKey: string;
  if (body.targetType === "TOKEN" && normalizedContract && body.targetTokenId) {
    targetKey = `TOKEN:${normalizedContract}:${body.targetTokenId}`;
  } else if (body.targetType === "COLLECTION" && normalizedContract) {
    targetKey = `COLLECTION:${normalizedContract}`;
  } else if (body.targetType === "CREATOR" && normalizedAddress) {
    targetKey = `CREATOR:${normalizedAddress}`;
  } else if (body.targetType === "COMMENT" && body.targetId) {
    targetKey = `COMMENT::${body.targetId}`;
  } else {
    return NextResponse.json(
      { error: "Invalid target fields for targetType" },
      { status: 400 }
    );
  }

  const res = await fetch(`${BACKEND_URL}/v1/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // x-api-key for tenant auth (global apiKeyAuth middleware)
      "x-api-key": API_KEY,
      // Clerk JWT for reporter identity (clerkJwtOnly middleware derives reporterUserId from it)
      "Authorization": `Bearer ${clerkToken}`,
    },
    body: JSON.stringify({
      targetType: body.targetType,
      targetKey,
      targetContract: normalizedContract,
      targetTokenId: body.targetTokenId,
      targetAddress: normalizedAddress,
      targetId: body.targetId,
      categories: body.categories,
      description: body.description,
      // reporterUserId intentionally omitted — backend derives it from the JWT sub claim
    }),
  });

  if (res.status === 409) {
    return NextResponse.json({ error: "Already reported" }, { status: 409 });
  }
  if (res.status === 429) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
