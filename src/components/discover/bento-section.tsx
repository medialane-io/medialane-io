"use client";

import Link from "next/link";
import { useCollections } from "@/hooks/use-collections";
import { CollectionCard, CollectionCardSkeleton } from "@/components/shared/collection-card";
import { FeaturedCollectionCell } from "@/components/shared/featured-collection-cell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/ui/motion-primitives";
import { BRAND } from "@/lib/brand";
import { ipfsToHttp } from "@/lib/utils";
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
    <Link href={href} className="block h-full group">
      <div
        className={`bento-cell h-full min-h-[100px] p-3 sm:p-4 bg-gradient-to-br ${from} ${to} flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1`}
      >
        <div className="h-9 w-9 rounded-xl bg-background/60 flex items-center justify-center shadow-inner group-hover:bg-background/80 transition-colors">
          <Icon className={`h-4.5 w-4.5 ${iconColor} group-hover:scale-110 transition-transform duration-300`} />
        </div>
        <div className="mt-3">
          <p className="font-bold text-sm leading-snug">{title}</p>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-snug group-hover:text-foreground transition-colors">{sub}</p>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

        {/* Quick action cells — fill right column in a 2x2 square */}
        {QUICK_ACTIONS.map((q, i) => (
          <FadeIn key={q.href} delay={0.1 + i * 0.08} className="col-span-1">
            <QuickActionCell {...q} />
          </FadeIn>
        ))}
      </div>

      {/* Remaining collections — full row split in half */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {isLoading ? (
          <>
            <CollectionCardSkeleton />
            <CollectionCardSkeleton />
          </>
        ) : (
          <>
            {cols[1] && (
              <FadeIn delay={0.15}>
                <CollectionCard collection={cols[1]} />
              </FadeIn>
            )}
            {cols[2] && (
              <FadeIn delay={0.25}>
                <CollectionCard collection={cols[2]} />
              </FadeIn>
            )}
          </>
        )}
      </div>

      {/* Featured Drops — large cards with full-bleed image */}
      {featured.length > 0 && (
        <FadeIn delay={0.3}>
          <section className="mt-4">
            <p className="section-label mb-1">Featured drops</p>
            <div className="flex items-center gap-2 mb-4">
              <Zap className={`h-4 w-4 ${BRAND.orange.text}`} />
              <h2 className="text-xl font-bold">Featured Collections</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((col) => (
                <Link key={col.contractAddress ?? col.id} href={`/collections/${col.contractAddress}`} className="group">
                  <div className="rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow duration-300">
                    <div className="aspect-video relative overflow-hidden">
                      {col.image ? (
                        <img
                          src={ipfsToHttp(col.image)}
                          alt={col.name ?? ""}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--brand-purple)/0.2)] to-[hsl(var(--brand-blue)/0.2)]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="font-semibold text-white truncate">{col.name ?? "Unnamed"}</p>
                        <div className="flex justify-between text-xs text-white/80 mt-1">
                          <span>{col.totalSupply ?? 0} items</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

    </section>
  );
}
