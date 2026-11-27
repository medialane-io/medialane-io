import { redirect, notFound } from "next/navigation";
import { withLocale } from "@medialane/ui/i18n";
import { collectionHref } from "@/lib/routes";
import { fetchCollectionBySlug } from "@/lib/api-server";

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

export default async function CollectionSlugPage({ params }: Props) {
  const { slug, locale } = await params;

  const collection = await fetchCollectionBySlug(slug);
  if (!collection?.contractAddress) notFound();

  redirect(withLocale(collectionHref("STARKNET", collection.contractAddress), locale));
}
