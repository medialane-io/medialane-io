import { redirect, notFound } from "next/navigation";
import { collectionHref } from "@/lib/routes";
import { fetchCollectionBySlug } from "@/lib/api-server";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export default async function CollectionSlugPage({ params }: Props) {
  const { slug } = await params;

  const collection = await fetchCollectionBySlug(slug);
  if (!collection?.contractAddress) notFound();

  redirect(collectionHref("STARKNET", collection.contractAddress));
}
