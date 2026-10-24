"use client";

import { useParams } from "next/navigation";
import { CollectionPage, type CollectionPageSlots } from "@medialane/ui";
import { CollectionServiceAction } from "@/components/services/collection-service-action";
import { useGatedContent } from "@/hooks/use-gated-content";
import { useMarketActions } from "@/lib/use-market-actions";


const SLOTS: CollectionPageSlots = {
  useMarketActions,
  useGatedContent,
  ServiceAction: CollectionServiceAction,
};

export default function CollectionPageClient() {
  const { contract } = useParams<{ contract: string }>();
  return <CollectionPage contract={contract} slots={SLOTS} />;
}
