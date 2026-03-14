"use client";

import { ThemeProvider } from "next-themes";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { Zap } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { SessionExpiryBanner } from "@/components/layout/session-expiry-banner";
import { Aurora } from "@/components/ui/aurora";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MedialaneLogo } from "@/components/brand/medialane-logo";
import { SWRConfig } from "swr";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <SidebarTrigger className="absolute top-3 left-3 z-50" />
        <SessionExpiryBanner />
        <main className="flex-1 bg-background overflow-x-hidden">{children}</main>
        <footer className="bg-background border-t border-border/60 px-6 py-8 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MedialaneLogo />
            </div>
            <nav className="flex items-center gap-4 flex-wrap justify-center">
              <Link href="/marketplace" className="hover:text-foreground transition-colors">Trade</Link>
              <Link href="/launchpad" className="hover:text-foreground transition-colors">Launch</Link>
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/learn" className="hover:text-foreground transition-colors">Learn</Link>
              <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <a href="https://x.com/medialane_io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">X</a>
            </nav>
            <p className="text-xs">© {new Date().getFullYear()} Medialane DAO</p>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <SWRConfig
        value={{
          onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "Something went wrong";
            toast.error(msg);
          },
        }}
      >
        <Aurora />
        <Shell>{children}</Shell>
        <CartDrawer />
        <Toaster richColors position="bottom-right" />
      </SWRConfig>
    </ThemeProvider>
  );
}
