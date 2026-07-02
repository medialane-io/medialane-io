import type { Metadata } from "next";
import { ClubContent } from "./club-content";

export const metadata: Metadata = {
  title: "IP Club | Medialane",
  description: "Membership clubs with an on-chain NFT membership card.",
};

export default function ClubPage() {
  return <ClubContent />;
}
