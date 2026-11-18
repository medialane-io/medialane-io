import { Suspense } from "react";
import { pageMetadata } from "@/lib/seo";
import ConfirmEmailContent from "./confirm-email-content";
import { msg } from "@medialane/ui/i18n";

export const generateMetadata = pageMetadata({
  path: "/confirm-email",
  title: msg("Confirm Your Email"),
  description: msg("Confirm your email to keep your Medialane account."),
  robots: { index: false, follow: false },
  social: false,
});

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
