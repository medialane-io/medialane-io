import { PageContainer } from "@medialane/ui";

export function AssetUnavailable({ isIndexing }: { isIndexing: boolean }) {
  return (
    <PageContainer className="py-24 text-center">
      <p className="text-2xl font-bold">{isIndexing ? "Preparing this asset" : "Asset not found"}</p>
      <p className="text-muted-foreground mt-2">
        {isIndexing ? "It is live onchain and will appear here in a moment." : "Check the collection address and token ID."}
      </p>
    </PageContainer>
  );
}
