"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LEARN_NAV = [
  { label: "Overview",               href: "/learn" },
  { label: "NFTs",                   href: "/learn/nft" },
  { label: "Creator Launchpad",      href: "/learn/creator-launchpad" },
  { label: "Marketplace",            href: "/learn/marketplace" },
  { label: "Web3 & Starknet",        href: "/learn/web3" },
  { label: "Protect Your IP",        href: "/learn/protect-your-ip" },
  { label: "Programmable Licensing", href: "/learn/programmable-licensing" },
];

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto px-4 pt-12 pb-16 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Learn</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Understand IP ownership, blockchain technology, and how Medialane works.
        </p>
      </div>

      <nav className="overflow-x-auto scrollbar-hide -mx-4 px-4 border-b border-border/60">
        <div className="flex items-center gap-0 min-w-max">
          {LEARN_NAV.map((item) => {
            const active =
              item.href === "/learn"
                ? pathname === "/learn"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2.5 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px",
                  active
                    ? "text-foreground font-medium border-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div>{children}</div>
    </div>
  );
}
