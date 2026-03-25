import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL!;
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY!;

async function getPendingReportCount(): Promise<number> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/admin/reports?status=PENDING,UNDER_REVIEW&limit=1`,
      {
        headers: { "x-api-key": ADMIN_KEY },
        cache: "no-store",
      }
    );
    const data = await res.json();
    return data.total ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  // Primary check: JWT session claims (fast, no API call).
  // Fallback: Clerk API in case the JWT template is not configured or the token is stale.
  let isAdmin = (sessionClaims?.metadata as any)?.role === "admin";
  if (!isAdmin) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      isAdmin = user.publicMetadata?.role === "admin";
    } catch {
      // If the API call fails, deny access
    }
  }

  if (!isAdmin) redirect("/portfolio");

  const pendingReports = await getPendingReportCount();

  const navItems = [
    { label: "Dashboard", href: "/admin", badge: undefined },
    { label: "Claims", href: "/admin/claims", badge: undefined },
    { label: "Collections", href: "/admin/collections", badge: undefined },
    { label: "Reports",     href: "/admin/reports",     badge: pendingReports > 0 ? pendingReports : undefined },
    { label: "Tokens",      href: "/admin/tokens",      badge: undefined },
    { label: "Creators",    href: "/admin/creators",    badge: undefined },
    { label: "Maintenance", href: "/admin/maintenance", badge: undefined },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Admin Panel</p>
        <nav className="flex gap-4 mt-3 border-b border-border pb-3">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {item.label}
              {item.badge !== undefined && (
                <span className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
