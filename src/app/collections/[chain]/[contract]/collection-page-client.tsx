"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { UserRoundCog } from "lucide-react";
import { CollectionPage, type CollectionPageSlots } from "@medialane/ui";
import { Button } from "@medialane/ui/button";
import { CollectionServiceAction } from "@/components/services/collection-service-action";
import { TransferCollectionOwnershipDialog } from "@/components/collection/transfer-ownership-dialog";
import { useGatedContent } from "@/hooks/use-gated-content";
import { useMarketActions } from "@/lib/use-market-actions";


function TransferOwnership({ collectionId, currentOwner, collectionName }: { collectionId: string; currentOwner: string; collectionName: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <UserRoundCog className="h-4 w-4" />
        Transfer ownership
      </Button>
      <TransferCollectionOwnershipDialog collectionId={collectionId} currentOwner={currentOwner} collectionName={collectionName} open={open} onOpenChange={setOpen} />
    </>
  );
}

const SLOTS: CollectionPageSlots = {
  useMarketActions,
  useGatedContent,
  ServiceAction: CollectionServiceAction,
  TransferOwnership,
};

export default function CollectionPageClient() {
  const { contract } = useParams<{ contract: string }>();
  return <CollectionPage contract={contract} slots={SLOTS} />;
}
