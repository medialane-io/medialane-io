import type { Metadata } from "next";
import CreatorsPageClient from "./creators-client";

export const metadata: Metadata = {
  title: "Creators | Medialane",
  description: "Discover verified creators on Medialane.",
};

export default function CreatorsPage() {
  return <CreatorsPageClient />;
}
