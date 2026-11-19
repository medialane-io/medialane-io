import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";
import { AirdropContent } from "@/components/airdrop/airdrop-content";

const title = msg("Creator's Airdrop");
const description = msg("How the Medialane Creator's Airdrop works: what earns XP, how distributions happen, and how to join.");

export const generateMetadata = pageMetadata({
  path: "/airdrop",
  title,
  description,
});

export default function AirdropPage() {
  return <AirdropContent />;
}
