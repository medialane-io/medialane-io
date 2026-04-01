import type { Metadata } from "next";
import { DropContent } from "./drop-content";

export const metadata: Metadata = {
  title: "Collection Drop | Medialane",
  description: "Mint limited edition drops. Set your supply cap, open a mint window, and let your community collect.",
};

export default function DropPage() {
  return <DropContent />;
}
