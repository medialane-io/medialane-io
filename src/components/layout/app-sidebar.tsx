"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Telescope, Compass, Briefcase, Plus, Activity,
  LayoutGrid, Users, BookOpen, FileCode2, Info, Mail, LifeBuoy,
  Sun, Moon, ShoppingBag, LogIn, PlusCircle, Search,
  ChevronRight,
} from "lucide-react";
import { useSessionKey } from "@/hooks/use-session-key";
import { useUnreadOffers } from "@/hooks/use-unread-offers";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { MedialaneLogo } from "../brand/medialane-logo";
import { MedialaneIcon } from "../brand/medialane-icon";
import { NotificationsItem } from "@/components/layout/notifications-sheet";

// ── Sub-menu data ────────────────────────────────────────────────────────────

const EXPLORE_SUB = [
  { href: "/collections", label: "Collections", icon: LayoutGrid },
  { href: "/creators",    label: "Creators",    icon: Users      },
  { href: "/activities",  label: "Activity",    icon: Activity   },
];

const RESOURCES_SUB = [
  { href: "/learn",   label: "Learn",   icon: BookOpen  },
  { href: "/docs",    label: "Docs",    icon: FileCode2 },
  { href: "/about",   label: "About",   icon: Info      },
  { href: "/contact", label: "Contact", icon: Mail      },
  { href: "/support", label: "Support", icon: LifeBuoy  },
];

// ── Collapsible nav group ────────────────────────────────────────────────────

interface CollapsibleNavItemProps {
  label: string;
  icon: React.ElementType;
  sub: { href: string; label: string; icon: React.ElementType }[];
  defaultOpen?: boolean;
  tooltip?: string;
  onClose: () => void;
}

function CollapsibleNavItem({
  label, icon: Icon, sub, defaultOpen = false, tooltip, onClose,
}: CollapsibleNavItemProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(defaultOpen);
  const { state, isMobile, setOpen: setSidebarOpen } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";

  const isAnySubActive = sub.some((s) => pathname === s.href || pathname?.startsWith(s.href + "/"));

  if (collapsed) {
    // In icon-only mode: clicking expands the sidebar and opens the group
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={tooltip ?? label}
          isActive={isAnySubActive}
          onClick={() => {
            setSidebarOpen(true);
            setOpen(true);
          }}
        >
          <Icon />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={tooltip ?? label}
            isActive={isAnySubActive && !open}
          >
            <Icon />
            <span>{label}</span>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {sub.map(({ href, label: subLabel, icon: SubIcon }) => {
              const active = pathname === href || (href !== "/launchpad" && pathname?.startsWith(href + "/"));
              return (
                <SidebarMenuSubItem key={href}>
                  <SidebarMenuSubButton asChild isActive={active} onClick={onClose}>
                    <Link href={href}>
                      <SubIcon className="h-3.5 w-3.5" />
                      {subLabel}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

// ── Utility items ─────────────────────────────────────────────────────────────

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

// ── Sidebar ──────────────────────────────────────────────────────────────────

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoaded, isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const unreadOffers = useUnreadOffers(isSignedIn ? walletAddress : null);
  const { setOpen, setOpenMobile, isMobile, state } = useSidebar();

  const closeSidebar = () => {
    if (isMobile) setOpenMobile(false);
    else setOpen(false);
  };

  // Whether to auto-expand collapsible groups on load
  const onLaunchpad = !!(pathname?.startsWith("/launchpad") || pathname?.startsWith("/create"));
  const onExplore   = !!(pathname === "/collections" || pathname?.startsWith("/creators") || pathname === "/activities");
  const onResources = !!(["/learn", "/docs", "/about", "/contact", "/support"].some(
    (p) => pathname === p || pathname?.startsWith(p + "/")
  ));

  // Top-level flat nav (no collapsible)
  const TOP_NAV = [
    { href: "/discover",   label: "Discover",    icon: Telescope, exact: true,  prefetch: undefined },
    { href: "/marketplace",label: "Marketplace", icon: Compass,   exact: true,  prefetch: undefined },
  ];

  return (
    <Sidebar collapsible="icon">

      {/* Brand */}
      <SidebarMenu className="p-2">
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild onClick={closeSidebar}>
            {isMobile || state === "expanded" ? <MedialaneLogo /> : <MedialaneIcon />}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <SidebarContent>

        {/* ── Main navigation ─────────────────────────────── */}
        <SidebarGroup>
          <SidebarMenu>

            {/* Flat items above Launchpad */}
            {TOP_NAV.slice(0, 2).map(({ href, label, icon: Icon, exact, prefetch }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  isActive={exact ? pathname === href : !!pathname?.startsWith(href)}
                  tooltip={label}
                  onClick={closeSidebar}
                >
                  <Link href={href} prefetch={prefetch}>
                    <Icon />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {/* Launchpad — direct link */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={onLaunchpad}
                tooltip="Launchpad"
                onClick={closeSidebar}
              >
                <Link href="/launchpad">
                  <Plus />
                  <span>Launchpad</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Portfolio with unread badge */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={!!pathname?.startsWith("/portfolio")}
                tooltip={unreadOffers > 0 ? `Portfolio (${unreadOffers} new offer${unreadOffers > 1 ? "s" : ""})` : "Portfolio"}
                onClick={closeSidebar}
              >
                <Link href="/portfolio" prefetch={false} className="relative">
                  <Briefcase />
                  <span>Portfolio</span>
                  {unreadOffers > 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 h-4 min-w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center px-1">
                      {unreadOffers > 9 ? "9+" : unreadOffers}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

          </SidebarMenu>
        </SidebarGroup>

        {/* ── Explore (Collections + Creators) ────────────── */}
        <SidebarGroup>
          <SidebarMenu>
            <CollapsibleNavItem
              label="Explore"
              icon={Compass}
              sub={EXPLORE_SUB}
              defaultOpen={onExplore}
              tooltip="Explore"
              onClose={closeSidebar}
            />
          </SidebarMenu>
        </SidebarGroup>

        {/* ── Resources (Docs + DAO merged) ───────────────── */}
        <SidebarGroup>
          <SidebarMenu>
            <CollapsibleNavItem
              label="Resources"
              icon={BookOpen}
              sub={RESOURCES_SUB}
              defaultOpen={onResources}
              tooltip="Resources"
              onClose={closeSidebar}
            />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ── Utilities ────────────────────────────────────── */}
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
            <CartItem />
            <NotificationsItem />
            <ThemeToggleItem />
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>

      {/* ── User / Auth ──────────────────────────────────────── */}
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
                      <Button variant="outline" size="sm" className="w-full">Sign in</Button>
                    )}
                  </SignInButton>
                  <SignUpButton mode="modal">
                    {!isMobile && state === "collapsed" ? (
                      <SidebarMenuButton tooltip="Start">
                        <PlusCircle />
                        <span className="sr-only">Start</span>
                      </SidebarMenuButton>
                    ) : (
                      <Button size="sm" className="w-full">Start</Button>
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
