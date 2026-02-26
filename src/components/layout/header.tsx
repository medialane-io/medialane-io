"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { LayoutGrid, Compass, Briefcase, PlusCircle, Zap, Menu, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

const NAV_LINKS = [
  { href: "/marketplace", label: "Marketplace", icon: Compass },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/launchpad", label: "Launchpad", icon: Zap },
];

export function Header() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const { items, toggleCart } = useCart();
  const cartCount = items.length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <LayoutGrid className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">medialane</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname?.startsWith(href)
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side: cart + auth + mobile menu */}
        <div className="flex items-center gap-2">
          {/* Cart icon */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={toggleCart}
            aria-label="Open cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Button>

          {/* Auth */}
          {isLoaded && isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">Sign in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="hidden sm:inline-flex">Get started</Button>
              </SignUpButton>
            </>
          )}

          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-primary" />
                    <span className="font-bold">medialane</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 pt-4">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <SheetClose asChild key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                        pathname?.startsWith(href)
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              {isLoaded && !isSignedIn && (
                <div className="mt-auto flex flex-col gap-2 px-4 pb-6 pt-4 border-t border-border">
                  <SignInButton mode="modal">
                    <Button variant="outline" className="w-full">Sign in</Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button className="w-full">Get started</Button>
                  </SignUpButton>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
