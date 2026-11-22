import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";
import VerifyEmailContent from "./verify-email-content";

const title = msg("Verify your email");
const description = msg("Confirm the email to list assets and claim a username.");

export const generateMetadata = pageMetadata({
  path: "/verify",
  title,
  description,
  social: false,
});

export default function VerifyPage() {
  return <VerifyEmailContent />;
}
