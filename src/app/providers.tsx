"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { Zap } from "lucide-react";
import { SignedIn } from "@clerk/nextjs";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { SessionPreferencesSwitch } from "@/components/chipi/session-preferences-switch";
import { Aurora } from "@/components/ui/aurora";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { MedialaneLogo } from "@/components/brand/medialane-logo";
import { SWRConfig } from "swr";
import { ChipiSessionUnlockProvider } from "@/contexts/chipi-session-unlock-context";
import { usePathname } from "next/navigation";

function MobileIconTrigger() {
  const { toggleSidebar } = useSidebar();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <button onClick={toggleSidebar} className="md:hidden flex items-center focus-visible:outline-none">
      <img src="/icon.png" alt="Medialane" className="h-5 w-5 opacity-90" />
    </button>
  );
}

function StandaloneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}

function MainShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (sessionStorage.getItem("ml-mainnet-notice-shown")) return;
    sessionStorage.setItem("ml-mainnet-notice-shown", "1");
    toast.warning("Medialane is live on Starknet Mainnet — early testing phase. Proceed with caution.", {
      duration: 12000,
      id: "mainnet-notice",
    });
  }, []);

  return (
    <SidebarProvider defaultOpen={false}>
      <ChipiSessionUnlockProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="absolute top-3 left-3 z-50 flex items-center gap-1.5">
          <SidebarTrigger />
          <MobileIconTrigger />
        </div>
        {/* SessionPreferencesSwitch hidden — surfaced inside account/wallet settings instead */}
        <main className="flex-1 bg-background overflow-x-hidden">{children}</main>
        <footer className="bg-background border-t border-border/60 px-6 py-8 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p className="text-xs">© {new Date().getFullYear()} Medialane DAO</p>
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
            <div className="flex items-center gap-2">
              <MedialaneLogo />
            </div>
          </div>
        </footer>
      </SidebarInset>
      </ChipiSessionUnlockProvider>
    </SidebarProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/br" || pathname.startsWith("/br/")) {
    return <StandaloneShell>{children}</StandaloneShell>;
  }
  return <MainShell>{children}</MainShell>;
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
        <Toaster
          richColors
          position="bottom-right"
          closeButton
          gap={6}
          toastOptions={{
            classNames: {
              toast: "rounded-2xl shadow-2xl border border-border/40 font-sans",
              title: "font-semibold tracking-tight text-[13px]",
              description: "text-xs opacity-75",
              closeButton: "rounded-full border-border/50 hover:bg-muted",
            },
          }}
        />
      </SWRConfig>
    </ThemeProvider>
  );
}
