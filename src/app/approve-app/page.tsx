import type { Metadata } from "next";
import { Suspense } from "react";
import { canonical } from "@/lib/seo";
import { ApproveAppContent } from "./approve-app-content";

export const metadata: Metadata = {
  title: "Approve an app",
  description: "Let another Medialane app use your wallet.",
  alternates: canonical("/approve-app"),
  robots: { index: false, follow: false },
};

export default function ApproveAppPage() {
  return (
    <Suspense fallback={null}>
      <ApproveAppContent />
    </Suspense>
  );
}
