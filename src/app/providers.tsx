"use client";

import { ThemeProvider } from "next-themes";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { Menu } from "lucide-react";
import { MedialaneLogo } from "@/components/brand/medialane-logo";
import { SWRConfig } from "swr";
import { ChipiSessionUnlockProvider } from "@/contexts/chipi-session-unlock-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
import { NavCommandMenu, useNavCommandMenu } from "@medialane/ui";
import { NAV_COMMANDS } from "@/lib/nav-commands";
import { NavAccountPanel } from "@/components/nav-account-panel";
import { AccountSyncOnLogin } from "@/components/shared/account-sync-on-login";
import { PasskeyCredentialSync } from "@/components/shared/passkey-credential-sync";
import { NavThemeToggle } from "@/components/nav-theme-toggle";

const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

function NavTrigger() {
  const { open } = useNavCommandMenu();
  return (
    <button
      onClick={open}
      className="flex items-center gap-1.5 focus-visible:outline-none group"
      aria-label="Open navigation"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.png" alt="Medialane" className="h-8 w-8 opacity-90 group-hover:opacity-100 transition-opacity" />
      <Menu className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
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
  return (
    <ChipiSessionUnlockProvider>
      <NavCommandMenu commands={NAV_COMMANDS} accountSlot={<NavAccountPanel />} footerSlot={<NavThemeToggle />} />
      <div className="relative min-h-screen flex flex-col bg-background">
        <div className="fixed top-4 left-4 sm:left-6 lg:left-8 z-50 flex items-center gap-1.5">
          <NavTrigger />
        </div>
        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        <footer className="px-4 sm:px-6 lg:px-8 py-8 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p className="text-xs">© {new Date().getFullYear()} Medialane DAO</p>
            <nav className="flex items-center gap-4 flex-wrap justify-center">
              <Link href="/marketplace" className="hover:text-foreground transition-colors">Trade</Link>
              <Link href="/launchpad" className="hover:text-foreground transition-colors">Launch</Link>
              <a href="https://docs.medialane.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Docs</a>
              <a href="https://docs.medialane.io/guidelines/terms" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Terms</a>
              <a href="https://docs.medialane.io/guidelines/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="https://x.com/medialane_io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">X</a>
            </nav>
            <div className="flex items-center gap-2">
              <MedialaneLogo />
            </div>
          </div>
        </footer>
      </div>
    </ChipiSessionUnlockProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (
    pathname === "/br" || pathname.startsWith("/br/") ||
    pathname === "/mint" ||
    pathname === "/airdrop"
  ) {
    return <StandaloneShell>{children}</StandaloneShell>;
  }
  return <MainShell>{children}</MainShell>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={300}>
      <SWRConfig
        value={{
          onError: (err: unknown) => {
            // 401/403 are auth state, not a runtime error worth screaming at the
            // user. A Clerk JWT can expire silently between page loads, and
            // every identity-aware hook (useMyWallet, gated content, etc.) will
            // 401 until the user re-signs-in. Surfacing the raw backend error
            // ("Invalid or expired session token") as a red toast made the
            // platform feel broken when it was just an expired session.
            // Each hook that cares about auth state already handles 401
            // locally (graceful empty/null fallback).
            const status =
              err && typeof err === "object" && "status" in err && typeof (err as { status: unknown }).status === "number"
                ? (err as { status: number }).status
                : null;
            if (status === 401 || status === 403) return;

            const msg = err instanceof Error ? err.message : "Something went wrong";
            toast.error(msg);
          },
        }}
      >
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
        <AccountSyncOnLogin />
        <PasskeyCredentialSync />
        <Shell>{children}</Shell>
        <Toaster
          richColors
          position="bottom-center"
          duration={3000}
          gap={4}
          toastOptions={{
            classNames: {
              toast: "rounded-xl shadow-lg border border-border/50 font-sans text-[13px] px-4 py-3",
              title: "font-medium",
              description: "text-xs opacity-70 mt-0.5",
              actionButton: "rounded-lg text-xs font-medium",
              cancelButton: "rounded-lg text-xs",
            },
          }}
        />
      </SWRConfig>
      </TooltipProvider>
    </ThemeProvider>
  );
}
