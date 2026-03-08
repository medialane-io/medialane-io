"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Home, Compass, Briefcase, PlusCircle, Zap, Activity, LayoutGrid, Telescope, Search, Sun, Moon, ShoppingBag } from "lucide-react";
import { useUnreadOffers } from "@/hooks/use-unread-offers";
import { useCart } from "@/hooks/use-cart";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { MedialaneLogo } from "../brand/medialane-logo";

const NAV = [
  { href: "/discover", label: "Discover", icon: Telescope },
  { href: "/marketplace", label: "Marketplace", icon: Compass },
  { href: "/collections", label: "Collections", icon: LayoutGrid },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/launchpad", label: "Launchpad", icon: Zap },
  { href: "/activities", label: "Activity", icon: Activity },
];

function ThemeToggleItem() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        tooltip={theme === "dark" ? "Light mode" : "Dark mode"}
      >
        {theme === "dark" ? <Sun /> : <Moon />}
        <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function CartItem() {
  const { items, toggleCart } = useCart();
  const count = items.length;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={toggleCart} tooltip={count > 0 ? `Cart (${count})` : "Cart"}>
        <div className="relative">
          <ShoppingBag className="size-4" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </div>
        <span>Cart{count > 0 ? ` (${count})` : ""}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

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
              <MedialaneLogo />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        <SidebarGroup>
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
        <SidebarSeparator />

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Search">
                <Link href="/search">
                  <Search />
                  <span>Search</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <ThemeToggleItem />
            <CartItem />
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
                      Start
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
