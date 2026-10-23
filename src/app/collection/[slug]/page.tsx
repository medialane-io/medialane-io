import { redirect, notFound } from "next/navigation";
import { collectionHref } from "@/lib/routes";
import { getMedialaneClient } from "@/lib/medialane-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function CollectionSlugPage({ params }: Props) {
  const { slug } = await params;

  const collection = await getMedialaneClient().api.collections.findBySlug(slug).catch(() => null);
  if (!collection?.contractAddress) notFound();

  redirect(collectionHref("STARKNET", collection.contractAddress));
}
