import { CoinsMount } from "./coins-mount";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Coins");
const description = msg("Discover creator coins and memecoins.");

export const generateMetadata = pageMetadata({
  path: "/coins",
  title,
  description,
  imageAlt: msg("Coins"),
});

export default function CoinsPage() {
  return <CoinsMount />;
}
