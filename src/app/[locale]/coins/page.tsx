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
  return (
    <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8 pt-20 pb-8">
      <CoinsMount />
    </div>
  );
}
