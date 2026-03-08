"use client";

import Link from "next/link";
import { useCollections } from "@/hooks/use-collections";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { FeaturedCollectionCell } from "@/components/shared/featured-collection-cell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/ui/motion-primitives";
import { BRAND } from "@/lib/brand";
import { Compass, Sparkles, Layers, Zap, ArrowRight } from "lucide-react";

interface QuickAction {
  title: string;
  sub: string;
  href: string;
  icon: React.ElementType;
  from: string;
  to: string;
  iconColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Mint IP Asset",
    sub: "Register any creative work on-chain",
    href: "/create/asset",
    icon: Sparkles,
    from: BRAND.purple.from,
    to: BRAND.blue.to,
    iconColor: BRAND.purple.text,
  },
  {
    title: "Create Collection",
    sub: "Deploy your own NFT collection",
    href: "/create/collection",
    icon: Layers,
    from: BRAND.blue.from,
    to: BRAND.rose.to,
    iconColor: BRAND.blue.text,
  },
  {
    title: "Browse Market",
    sub: "Discover & buy IP assets",
    href: "/marketplace",
    icon: Compass,
    from: BRAND.rose.from,
    to: BRAND.orange.to,
    iconColor: BRAND.rose.text,
  },
  {
    title: "Launchpad",
    sub: "Featured creator drops",
    href: "/launchpad",
    icon: Zap,
    from: BRAND.orange.from,
    to: BRAND.purple.to,
    iconColor: BRAND.orange.text,
  },
];

function QuickActionCell({ title, sub, href, icon: Icon, from, to, iconColor }: QuickAction) {
  return (
    <Link href={href} className="block h-full">
      <div
        className={`bento-cell h-full min-h-[100px] p-3 sm:p-4 bg-gradient-to-br ${from} ${to} flex flex-col justify-between`}
      >
        <div className="h-8 w-8 rounded-xl bg-background/60 flex items-center justify-center">
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="mt-3">
          <p className="font-bold text-sm leading-snug">{title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{sub}</p>
        </div>
      </div>
    </Link>
  );
}

export function BentoSection() {
  const { collections: featured, isLoading: fl } = useCollections(1, 3, true);
  const { collections: all, isLoading: al } = useCollections(1, 3);
  const isLoading = fl || (featured.length === 0 && al);
  const cols = featured.length > 0 ? featured : all;

  return (
    <section className="px-4 space-y-4">
      <FadeIn>
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="section-label">Curated drops</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Layers className={`h-4 w-4 ${BRAND.purple.text}`} />
              <h2 className="text-xl font-bold">Collections</h2>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground text-sm">
            <Link href="/collections">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </FadeIn>

      {/* Bento grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-min">
        {/* Featured collection — 2×2 hero slot */}
        {isLoading ? (
          <div className="col-span-2 row-span-2 bento-cell">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ) : cols[0] ? (
          <FadeIn className="col-span-2 row-span-2">
            <FeaturedCollectionCell collection={cols[0]} large />
          </FadeIn>
        ) : null}

        {/* Quick action cells — fill right column */}
        {QUICK_ACTIONS.slice(0, 2).map((q, i) => (
          <FadeIn key={q.href} delay={0.1 + i * 0.08} className="col-span-1">
            <QuickActionCell {...q} />
          </FadeIn>
        ))}

        {/* Second featured collection */}
        {isLoading ? (
          <div className="col-span-2 bento-cell">
            <Skeleton className="aspect-[16/7] w-full" />
            <div className="p-3 space-y-1.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ) : cols[1] ? (
          <FadeIn className="col-span-2" delay={0.15}>
            <FeaturedCollectionCell collection={cols[1]} />
          </FadeIn>
        ) : null}

        {/* Remaining quick actions */}
        {QUICK_ACTIONS.slice(2).map((q, i) => (
          <FadeIn key={q.href} delay={0.2 + i * 0.08} className="col-span-1">
            <QuickActionCell {...q} />
          </FadeIn>
        ))}
      </div>

      {/* Third collection — full row */}
      {!isLoading && cols[2] && (
        <FadeIn delay={0.25}>
          <CollectionCard collection={cols[2]} />
        </FadeIn>
      )}
    </section>
  );
}
