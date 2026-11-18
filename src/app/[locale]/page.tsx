import { HomePage } from "@/components/home";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";
import { fetchFeaturedCollections } from "@/lib/api-server";

const title = msg("Medialane — Creator Launchpad + NFT Marketplace");
const description = msg("Mint, license, and trade intellectual property as NFTs on Starknet, with a self-custody passkey wallet and programmable royalties.");

export const generateMetadata = pageMetadata({
  path: "/",
  title,
  description,
  imageAlt: msg("Medialane"),
});

export const revalidate = 60;

export default async function Page() {
  const featured = await fetchFeaturedCollections(3);
  return <HomePage initialFeatured={featured ?? undefined} />;
}
