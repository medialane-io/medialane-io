"use client";

import {
  ActiveFilters,
  FiltersButton,
  FiltersDialog,
  MarketplaceSearch,
  PageContainer,
  StatPillRow,
  usePlatformStats,
  useMarketplaceFilters,
} from "@medialane/ui";
import { getTokenBySymbol } from "@medialane/sdk";
import { ListingsGrid } from "@/components/marketplace/listings-grid";
import { ActivityTicker } from "@/components/shared/activity-ticker";

function PlatformStatsBar() {
  const { stats } = usePlatformStats();

  return (
    <StatPillRow
      items={[
        { label: "Markets", value: stats?.markets ?? null },
        { label: "Sales", value: stats?.sales ?? null },
      ]}
    />
  );
}

export default function MarketplacePageClient() {
  const filters = useMarketplaceFilters();

  return (
    <PageContainer className="box-border max-w-full pt-14 pb-8 space-y-8">

      <div className="space-y-2 pt-8">
        <h1 className="text-3xl font-bold">Onchain markets</h1>
        <PlatformStatsBar />
      </div>

      <ActivityTicker limit={12} />

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
