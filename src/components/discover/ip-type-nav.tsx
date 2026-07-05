"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IP_TYPE_CONFIG } from "@medialane/ui";
import { cn } from "@/lib/utils";

export function IpTypeNav() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black">Browse by Type</h2>
        <Link
          href="/nft"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {IP_TYPE_CONFIG.map(({ slug, label, icon: Icon, colorClass, bgClass }) => (
          <Link
            key={slug}
            href={`/${slug}`}
            className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-card/80 transition-all hover:shadow-md hover:shadow-black/10"
          >
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", bgClass)}>
              <Icon className={cn("h-5 w-5", colorClass)} />
            </div>
            <span className="text-xs font-semibold text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
