import type { Metadata } from "next";
import { CoinsMount } from "./coins-mount";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Coins";
const description = "Discover creator coins and memecoins on Medialane.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/coins"),
  ...buildSocialMetadata({ title, description, imageAlt: "Medialane Coins" }),
};

export default function CoinsPage() {
  return (
    <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8 pt-20 pb-8">
      <CoinsMount />
    </div>
  );
}
