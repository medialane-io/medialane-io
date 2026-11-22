import { AccountsPage as AccountsPageClient } from "@medialane/ui";
import { pageMetadata } from "@/lib/seo";
import { msg } from "@medialane/ui/i18n";

const title = msg("Accounts");
const description = msg("Browse accounts on Medialane.");

export const generateMetadata = pageMetadata({
  path: "/accounts",
  title,
  description,
  imageAlt: msg("Medialane Accounts"),
});

export default function AccountsPage() {
  return <AccountsPageClient />;
}
