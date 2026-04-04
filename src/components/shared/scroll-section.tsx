"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScrollSectionProps {
  /** Icon element rendered inside the colored badge */
  icon: React.ReactNode;
  /** Tailwind classes for the icon badge (background + shadow) */
  iconBg: string;
  title: string;
  /** "See all" link destination */
  href: string;
  /** Button label — defaults to "See all" */
  linkLabel?: string;
  /** Scroll items: wrap each in a sized snap-start div */
  children: React.ReactNode;
}

/**
 * Shared layout shell for horizontal-scroll sections (collections, listings, etc.).
 * Renders a section header (icon + title + "see all" link) above a snap-scroll row.
 * Callers are responsible for rendering items, skeletons, and empty states as children.
 */
export function ScrollSection({
  icon,
  iconBg,
  title,
  href,
  linkLabel = "See all",
  children,
}: ScrollSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={href} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 snap-x snap-mandatory pb-2" style={{ width: "max-content" }}>
          {children}
        </div>
      </div>
    </section>
  );
}
