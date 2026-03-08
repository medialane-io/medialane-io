"use client";

import { useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Sun, Moon, Search, ShoppingBag, Zap } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { SessionExpiryBanner } from "@/components/layout/session-expiry-banner";
import { Aurora } from "@/components/ui/aurora";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useCart } from "@/hooks/use-cart";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-8 w-8" />;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function TopBarActions() {
  const { isSignedIn, isLoaded } = useUser();
  const { items, toggleCart } = useCart();
  const cartCount = items.length;

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href="/search" aria-label="Search">
          <Search className="h-4 w-4" />
        </Link>
      </Button>

      <ThemeToggle />

      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8"
        onClick={toggleCart}
        aria-label="Cart"
      >
        <ShoppingBag className="h-4 w-4" />
        {cartCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        )}
      </Button>

      {isLoaded && !isSignedIn && (
        <>
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" className="h-8 text-sm">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm" className="h-8 hidden sm:inline-flex text-sm">
              Get started
            </Button>
          </SignUpButton>
        </>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="relative flex flex-col flex-1 min-h-svh">
          <header className="absolute inset-x-0 top-0 z-50 flex items-center gap-2 px-3 pt-3 pointer-events-none">
            <div className="pointer-events-auto bg-black/20 dark:bg-black/35 backdrop-blur-xl rounded-xl border border-white/10 shadow-sm">
              <SidebarTrigger className="h-9 w-9" />
            </div>
            <div className="ml-auto pointer-events-auto bg-black/20 dark:bg-black/35 backdrop-blur-xl rounded-full border border-white/10 shadow-sm px-1 py-1 flex items-center gap-0.5">
              <TopBarActions />
            </div>
          </header>
          <SessionExpiryBanner />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border/60 px-6 py-8 mt-auto">
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
        </div>
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
