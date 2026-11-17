"use client";

import { usePathname } from "next/navigation";
import {
  NavCommandMenu,
  NavBrandButton,
  ThemeAmbientBackground,
  useCreatorProfile,
} from "@medialane/ui";
import { NavThemeToggle } from "@medialane/ui/nav-theme-toggle";
import { NAV_COMMANDS } from "@/lib/nav-commands";
import { NavConnectButton } from "@/components/nav-connect-button";
import { HeaderWalletTrigger } from "@/components/nav-wallet-trigger";
import { MediaWalletApp } from "@/components/media-wallet-app";
import { SiteFooter } from "@/components/site-footer";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { resolveImage } from "@/lib/utils";

function StandaloneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}

function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const suppressAmbient =
    pathname.startsWith("/asset/") ||
    pathname.startsWith("/collections/") ||
    pathname.startsWith("/creator/");
  const { address: walletAddress } = useWalletNativeSession();
  const { profile } = useCreatorProfile(walletAddress ?? undefined);
  const themeImageUrl = suppressAmbient ? null : resolveImage(profile?.avatarImage);

  return (
    <>
      <NavCommandMenu
        commands={NAV_COMMANDS}
        footerSlot={<NavThemeToggle />}
        showKeyboardHints={false}
        brandSlot={<NavConnectButton />}
        search
      />
      <MediaWalletApp />
      <div className="relative min-h-screen flex flex-col bg-background">
        <ThemeAmbientBackground imageUrl={themeImageUrl} />
        <div className="fixed top-4 left-4 sm:left-6 lg:left-8 z-50">
          <NavBrandButton />
        </div>
        <div className="fixed top-4 right-4 sm:right-6 lg:right-8 z-50">
          <HeaderWalletTrigger />
        </div>
        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        <SiteFooter />
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/mint") return <StandaloneShell>{children}</StandaloneShell>;
  return <MainShell>{children}</MainShell>;
}
