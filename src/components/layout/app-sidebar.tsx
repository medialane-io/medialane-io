"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Home, Compass, Briefcase, PlusCircle, Zap, Activity, LayoutGrid, Telescope, Search, Sun, Moon, ShoppingBag, LogIn, UserPlus, Info, BookOpen, FileCode2, Mail, LifeBuoy, Scale, Lock, Users } from "lucide-react";
import { IP_TYPE_CONFIG } from "@/lib/ip-type-config";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUnreadOffers } from "@/hooks/use-unread-offers";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { MedialaneLogo } from "../brand/medialane-logo";
import { MedialaneIcon } from "../brand/medialane-icon";
import { NotificationsItem } from "@/components/layout/notifications-sheet";

const NAV = [
  { href: "/discover", label: "Discover", icon: Telescope, exact: true },
  { href: "/marketplace", label: "Marketplace", icon: Compass, exact: true },
  { href: "/collections", label: "Collections", icon: LayoutGrid, exact: true },
  { href: "/creators",   label: "Creators",    icon: Users,      exact: true },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase, exact: true },
  { href: "/create", label: "Create", icon: PlusCircle, exact: true },
  { href: "/launchpad", label: "Launchpad", icon: Zap, exact: true },
  { href: "/activities", label: "Activity", icon: Activity, exact: true },
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
  const { walletAddress } = useSessionKey();
  const unreadOffers = useUnreadOffers(isSignedIn ? walletAddress : null);
  const { setOpen, setOpenMobile, isMobile, state } = useSidebar();

  const closeSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      {/* Brand */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild onClick={closeSidebar}>
              {isMobile || state === "expanded" ? <MedialaneLogo /> : <MedialaneIcon />}
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
                    onClick={closeSidebar}
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
              <SidebarMenuButton asChild tooltip="Search" onClick={closeSidebar}>
                <Link href="/search">
                  <Search />
                  <span>Search</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <ThemeToggleItem />
            <CartItem />
            <NotificationsItem />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Browse by IP type 
        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarMenu>
            {IP_TYPE_CONFIG.map(({ slug, label, icon: Icon, colorClass }) => (
              <SidebarMenuItem key={slug}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === `/${slug}`}
                  tooltip={label}
                  onClick={closeSidebar}
                >
                  <Link href={`/${slug}`}>
                    <Icon className={pathname === `/${slug}` ? colorClass : undefined} />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />*/}

        <SidebarGroup>
          <SidebarGroupLabel>Docs</SidebarGroupLabel>
          <SidebarMenu>
            {[
              { href: "/about",  label: "About",  icon: Info },
              { href: "/learn",  label: "Learn",  icon: BookOpen },
              { href: "/docs",   label: "Docs",   icon: FileCode2 },
            ].map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === href || (href !== "/about" && !!pathname?.startsWith(href))}
                  tooltip={label}
                  onClick={closeSidebar}
                >
                  <Link href={href}>
                    <Icon />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>DAO</SidebarGroupLabel>
          <SidebarMenu>
            {[
              { href: "/contact", label: "Contact Us",   icon: Mail },
              { href: "/support", label: "Support",      icon: LifeBuoy },
            ].map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === href}
                  tooltip={label}
                  onClick={closeSidebar}
                >
                  <Link href={href}>
                    <Icon />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* User */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {isLoaded && isSignedIn ? (
              <div className={cn(
                "flex items-center gap-3 py-1.5",
                !isMobile && state === "collapsed" ? "justify-center px-0" : "px-2"
              )}>
                <UserButton afterSignOutUrl="/" />
                {(isMobile || state === "expanded") && (
                  <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                    <span className="truncate font-medium text-sidebar-foreground">
                      {user?.fullName ?? user?.username ?? "Account"}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              isLoaded && (
                <div className={cn(
                  "flex gap-1.5 pb-1",
                  !isMobile && state === "collapsed" ? "flex-col items-center px-0" : "flex-col px-1"
                )}>
                  <SignInButton mode="modal">
                    {!isMobile && state === "collapsed" ? (
                      <SidebarMenuButton tooltip="Sign in">
                        <LogIn />
                        <span className="sr-only">Sign in</span>
                      </SidebarMenuButton>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full">
                        Sign in
                      </Button>
                    )}
                  </SignInButton>
                  <SignUpButton mode="modal">
                    {!isMobile && state === "collapsed" ? (
                      <SidebarMenuButton tooltip="Start">
                        <PlusCircle />
                        <span className="sr-only">Start</span>
                      </SidebarMenuButton>
                    ) : (
                      <Button size="sm" className="w-full">
                        Start
                      </Button>
                    )}
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
