import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL!;
// Server-only — NO NEXT_PUBLIC_ prefix. Never exposed to the browser bundle.
const ADMIN_API_KEY = process.env.ADMIN_API_KEY!;

async function requireAdmin(): Promise<boolean> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return false;
  // Fast path: check JWT claims first (no extra API call)
  if ((sessionClaims?.metadata as Record<string, unknown>)?.role === "admin") return true;
  // Fallback: verify via Clerk API (handles stale tokens)
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.publicMetadata?.role === "admin";
  } catch {
    return false;
  }
}

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { path } = await params;

  // Reject traversal attempts — empty segments, ".", and ".." are all disallowed.
  // Without this guard, a crafted path like ["..","v1","portal","keys"] would resolve
  // to /v1/portal/keys on the backend with the admin API key already injected.
  const isSafe = path.every((seg) => seg !== "" && seg !== "." && seg !== "..");
  if (!isSafe) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const url = new URL(req.url);
  const targetUrl = `${BACKEND_URL}/admin/${path.join("/")}${url.search}`;

  const headers: Record<string, string> = {
    "x-api-key": ADMIN_API_KEY,
    "Content-Type": "application/json",
  };

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  const res = await fetch(targetUrl, init);
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as DELETE,
};
