import type { Metadata } from "next";
import { Suspense } from "react";
import { canonical } from "@/lib/seo";
import ConfirmEmailContent from "./confirm-email-content";
import { msg } from "@medialane/ui/i18n";

export const metadata: Metadata = {
  title: msg("Confirm Your Email"),
  description: msg("Confirm your email to keep your Medialane account."),
  alternates: canonical("/confirm-email"),
  robots: { index: false, follow: false },
};

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
