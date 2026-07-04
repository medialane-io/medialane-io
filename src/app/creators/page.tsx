import type { Metadata } from "next";
import CreatorsPageClient from "./creators-client";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Creators";
const description = "Meet the creators building on Medialane — discover artists, musicians, photographers, and developers minting IP onchain.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/creators"),
  ...buildSocialMetadata({ title, description, imageAlt: "Medialane Creators" }),
};

export default function CreatorsPage() {
  return <CreatorsPageClient />;
}
