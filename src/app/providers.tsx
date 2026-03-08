"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import Link from "next/link";
import { Zap } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { SessionExpiryBanner } from "@/components/layout/session-expiry-banner";
import { Aurora } from "@/components/ui/aurora";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SidebarTrigger className="absolute top-3 left-3 z-50" />
        <SessionExpiryBanner />
        <main className="flex-1 bg-background">{children}</main>
        <footer className="bg-background border-t border-border/60 px-6 py-8 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">Medialane</span>
              <span>· IP marketplace on Starknet</span>
            </div>
            <nav className="flex items-center gap-4 flex-wrap justify-center">
              <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
              <Link href="/collections" className="hover:text-foreground transition-colors">Collections</Link>
              <Link href="/launchpad" className="hover:text-foreground transition-colors">Launchpad</Link>
              <Link href="/activity" className="hover:text-foreground transition-colors">Activity</Link>
              <a href="https://twitter.com/medialane_io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Twitter</a>
            </nav>
            <p className="text-xs">© {new Date().getFullYear()} Medialane</p>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <Aurora />
      <Shell>{children}</Shell>
      <CartDrawer />
      <Toaster richColors position="bottom-right" />
    </ThemeProvider>
  );
}
