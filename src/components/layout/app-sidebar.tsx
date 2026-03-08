"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Home, Compass, Briefcase, PlusCircle, Zap, Activity, LayoutGrid, Telescope } from "lucide-react";
import { useUnreadOffers } from "@/hooks/use-unread-offers";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/discover", label: "Discover", icon: Telescope },
  { href: "/marketplace", label: "Marketplace", icon: Compass },
  { href: "/collections", label: "Collections", icon: LayoutGrid },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/launchpad", label: "Launchpad", icon: Zap },
  { href: "/activities", label: "Activity", icon: Activity },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoaded, isSignedIn } = useUser();
  const walletAddress = user?.publicMetadata?.publicKey as string | undefined;
  const unreadOffers = useUnreadOffers(isSignedIn ? walletAddress : null);

  return (
    <Sidebar collapsible="icon">
      {/* Brand */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shrink-0 shadow-lg shadow-primary/30">
                  <Zap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold tracking-tight">medialane</span>
                  <span className="truncate text-xs text-muted-foreground">IP on Starknet</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const showBadge = href === "/portfolio" && unreadOffers > 0;
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={exact ? pathname === href : !!pathname?.startsWith(href)}
                    tooltip={showBadge ? `${label} (${unreadOffers} new offer${unreadOffers > 1 ? "s" : ""})` : label}
                  >
                    <Link href={href} className="relative">
                      <Icon />
                      <span>{label}</span>
                      {showBadge && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 h-4 min-w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center px-1">
                          {unreadOffers > 9 ? "9+" : unreadOffers}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* User */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {isLoaded && isSignedIn ? (
              <div className="flex items-center gap-3 px-2 py-1.5">
                <UserButton afterSignOutUrl="/" />
                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  <span className="truncate font-medium text-sidebar-foreground">
                    {user?.fullName ?? user?.username ?? "Account"}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/60">
                    {user?.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
              </div>
            ) : (
              isLoaded && (
                <div className="flex flex-col gap-1.5 px-1 pb-1">
                  <SignInButton mode="modal">
                    <Button variant="outline" size="sm" className="w-full">
                      Sign in
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button size="sm" className="w-full">
                      Get started
                    </Button>
                  </SignUpButton>
                </div>
              )
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
