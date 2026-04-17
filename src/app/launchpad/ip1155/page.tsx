import type { Metadata } from "next";
import { IP1155Content } from "./ip1155-content";

export const metadata: Metadata = {
  title: "IP Collection 1155 | Launchpad | Medialane",
  description: "Manage your multi-edition ERC-1155 IP collections — mint new token editions or deploy a new collection.",
};

export default function IP1155Page() {
  return <IP1155Content />;
}
