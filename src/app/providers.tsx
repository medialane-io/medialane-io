"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { SessionExpiryBanner } from "@/components/layout/session-expiry-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <div className="relative min-h-screen flex flex-col">
        <Header />
        <SessionExpiryBanner />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <CartDrawer />
      <Toaster richColors position="bottom-right" />
    </ThemeProvider>
  );
}
