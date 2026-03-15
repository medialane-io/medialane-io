import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL!;
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY!;

async function getPendingReportCount(): Promise<number> {
  try {
    const [pendingRes, underReviewRes] = await Promise.all([
      fetch(`${BACKEND_URL}/admin/reports?status=PENDING&limit=1`, {
        headers: { "x-api-key": ADMIN_KEY },
        cache: "no-store",
      }),
      fetch(`${BACKEND_URL}/admin/reports?status=UNDER_REVIEW&limit=1`, {
        headers: { "x-api-key": ADMIN_KEY },
        cache: "no-store",
      }),
    ]);
    const [pending, underReview] = await Promise.all([
      pendingRes.json(),
      underReviewRes.json(),
    ]);
    return (pending.total ?? 0) + (underReview.total ?? 0);
  } catch {
    return 0;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { sessionClaims } = await auth();
  if ((sessionClaims?.metadata as any)?.role !== "admin") redirect("/portfolio");

  const pendingReports = await getPendingReportCount();

  const navItems = [
    { label: "Dashboard", href: "/admin", badge: undefined },
    { label: "Claims", href: "/admin/claims", badge: undefined },
    { label: "Collections", href: "/admin/collections", badge: undefined },
    { label: "Reports", href: "/admin/reports", badge: pendingReports > 0 ? pendingReports : undefined },
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
