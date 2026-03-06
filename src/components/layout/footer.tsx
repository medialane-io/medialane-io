"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";

const NAV = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/collections", label: "Collections" },
  { href: "/launchpad", label: "Launchpad" },
  { href: "/create", label: "Create" },
  { href: "/activities", label: "Activity" },
];

const LEGAL = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-10 space-y-8">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8">
          {/* Brand */}
          <div className="space-y-3 max-w-xs">
            <Link href="/" className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <span className="font-bold text-base tracking-tight">medialane</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Creator launchpad and IP marketplace on Starknet. Gasless transactions, invisible wallets.
            </p>
          </div>

          {/* Nav columns */}
          <div className="flex gap-12 text-sm">
            <div className="space-y-3">
              <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Platform
              </p>
              <ul className="space-y-2">
                {NAV.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Network
              </p>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://starknet.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Starknet
                  </a>
                </li>
                <li>
                  <a
                    href="https://voyager.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Voyager Explorer
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/40 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Medialane. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {LEGAL.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
