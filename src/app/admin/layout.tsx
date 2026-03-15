import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { sessionClaims } = await auth();
  if ((sessionClaims?.metadata as any)?.role !== "admin") redirect("/portfolio");

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Admin Panel</p>
        <nav className="flex gap-4 mt-3 border-b border-border pb-3">
          {[
            { label: "Dashboard", href: "/admin" },
            { label: "Claims", href: "/admin/claims" },
            { label: "Collections", href: "/admin/collections" },
          ].map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
