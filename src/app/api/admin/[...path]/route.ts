import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

function getBackendUrl(): string {
  return process.env.MEDIALANE_BACKEND_URL || process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL || "";
}

function getAdminKey(): string {
  return process.env.ADMIN_API_KEY || "";
}

async function proxy(req: NextRequest, path: string[]) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims as Record<string, unknown> | null)?.role;
  if (!userId || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const backend = getBackendUrl();
  const adminKey = getAdminKey();
  if (!backend || !adminKey) {
    return NextResponse.json(
      { error: "Admin proxy is not configured" },
      { status: 500 }
    );
  }

  const invalidSegment = path.some(
    (s) =>
      !s ||
      s === "." ||
      s === ".." ||
      s.includes("..") ||
      s.includes("//") ||
      s.includes("\\")
  );
  if (invalidSegment) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const q = req.nextUrl.searchParams.toString();
  const url = `${backend}/${path.join("/")}${q ? `?${q}` : ""}`;

  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.text();

  const response = await fetch(url, {
    method: req.method,
    headers: {
      "x-api-key": adminKey,
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
