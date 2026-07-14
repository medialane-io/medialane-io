import type { Metadata } from "next";
import { RemixContent } from "./remix-content";
import { canonical, buildSocialMetadata } from "@/lib/seo";

const title = "Remix | Launchpad";
const description = "Pick a work that is open to remixing and create a licensed derivative with attribution to the original creator.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/launchpad/remix"),
  ...buildSocialMetadata({ title, description }),
};

export default function RemixPage() {
  return <RemixContent />;
}
