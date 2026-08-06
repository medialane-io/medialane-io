import type { Metadata } from "next";
import { PageContainer } from "@medialane/ui";
import { canonical, buildSocialMetadata } from "@/lib/seo";
import { WalletPanel } from "@/components/wallet/wallet-panel";

const title = "My Wallet";
const description = "Manage your Medialane wallet address, session, and balance.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/settings/wallet"),
  ...buildSocialMetadata({ title, description }),
};

export default function SettingsWalletPage() {
  return (
    <PageContainer className="box-border max-w-full pt-20 pb-16">
      <div className="space-y-4">
        <WalletPanel />
      </div>
    </PageContainer>
  );
}
