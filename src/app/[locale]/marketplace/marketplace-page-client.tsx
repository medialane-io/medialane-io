"use client";

import {
  ActiveFilters,
  FeaturedListings,
  FiltersButton,
  FiltersDialog,
  MarketplaceSearch,
  PageContainer,
  PageHeader,
  StatPillRow,
  usePlatformStats,
  useMarketplaceFilters,
} from "@medialane/ui";
import { getTokenBySymbol } from "@medialane/sdk";
import { ListingsGrid } from "@/components/marketplace/listings-grid";
import { ActivityTicker } from "@/components/shared/activity-ticker";
import { useMarketActions } from "@/lib/use-market-actions";
import { useT } from "@medialane/ui/i18n";

function PlatformStatsBar() {
  const t = useT();
  const { stats } = usePlatformStats();

  return (
    <StatPillRow
      items={[
        { label: t("Markets"), value: stats?.markets ?? null },
        { label: t("Sales"), value: stats?.sales ?? null },
      ]}
    />
  );
}

export default function MarketplacePageClient() {
  const t = useT();
  const filters = useMarketplaceFilters();
  const market = useMarketActions();

  return (
    <PageContainer className="space-y-8">
      <PageHeader title={t("Onchain markets")}>
        <PlatformStatsBar />
      </PageHeader>

      <ActivityTicker limit={12} />

      <FeaturedListings market={market} heading={false} />
      {market.dialogs}

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <MarketplaceSearch />
          </div>
          <FiltersButton filters={filters} />
        </div>
        <ActiveFilters filters={filters} />
      </div>

      <FiltersDialog filters={filters} />

      <ListingsGrid
        sort={filters.sort}
        currency={filters.currency ? getTokenBySymbol(filters.currency)?.address : undefined}
        orderType={filters.orderType}
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
      />
    </PageContainer>
  );
}
