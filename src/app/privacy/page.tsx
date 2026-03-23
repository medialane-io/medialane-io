import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Medialane",
  description: "Privacy Policy for the Medialane platform.",
};

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">
        {num}. {title}
      </h2>
      <div className="text-muted-foreground leading-relaxed space-y-3 text-sm">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 pt-12 pb-16 max-w-3xl space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">Last updated: March 14, 2026</p>
        <p className="text-muted-foreground leading-relaxed">
          This Privacy Policy describes how Medialane DAO collects, uses, and protects
          your personal information when you use the Medialane platform.
        </p>
      </div>

      <div className="space-y-8">
        <Section num="1" title="Information We Collect">
          <p>We collect the following categories of information:</p>
          <p><strong className="text-foreground">Account information:</strong> Email address, name, and profile data provided to our
          authentication provider (Clerk) when you create an account.</p>
          <p><strong className="text-foreground">Wallet information:</strong> Your Starknet wallet address, derived from your
          authentication session via ChipiPay. We do not store your private keys — they
          are managed client-side by ChipiPay&apos;s infrastructure.</p>
          <p><strong className="text-foreground">Transaction data:</strong> onchain transaction data associated with your wallet
          address, including NFT mints, listings, purchases, and transfers. This data is
          publicly available on the Starknet blockchain.</p>
          <p><strong className="text-foreground">Usage data:</strong> Log data including IP address, browser type, pages visited,
          and timestamps. Collected automatically when you use the Service.</p>
          <p><strong className="text-foreground">Content:</strong> Files, images, and metadata you upload when minting NFTs.</p>
        </Section>

        <Section num="2" title="How We Use Your Information">
          <p>We use your information to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Provide and operate the Medialane platform</li>
            <li>Authenticate your identity and manage your account</li>
            <li>Process marketplace transactions and enforce royalties</li>
            <li>Display your assets, collections, and activity on the platform</li>
            <li>Send transactional notifications related to your account</li>
            <li>Detect and prevent fraud, abuse, and security incidents</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Section>

        <Section num="3" title="Blockchain Data">
          <p>
            Blockchain transactions are publicly recorded on Starknet and cannot be
            deleted or modified. Your wallet address and transaction history are
            permanently visible onchain to anyone with access to a blockchain explorer.
          </p>
          <p>
            By using the Medialane marketplace, you acknowledge that your onchain
            activity — including purchases, listings, and transfers — is publicly
            accessible and permanent.
          </p>
        </Section>

        <Section num="4" title="Data Sharing">
          <p>We do not sell your personal information. We share data only with:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-foreground">Clerk</strong> — our authentication provider, for identity management</li>
            <li><strong className="text-foreground">ChipiPay</strong> — our wallet infrastructure provider</li>
            <li><strong className="text-foreground">Pinata</strong> — IPFS pinning service for your uploaded content</li>
            <li><strong className="text-foreground">Railway</strong> — cloud infrastructure provider hosting our backend</li>
            <li><strong className="text-foreground">Legal authorities</strong> — when required by law or valid legal process</li>
          </ul>
          <p>
            Each third-party service processes data according to their own privacy policy.
            We encourage you to review those policies.
          </p>
        </Section>

        <Section num="5" title="Data Retention">
          <p>
            We retain your account data for as long as your account is active or as needed
            to provide the Service. If you delete your account, we will delete your personal
            data within 30 days, except where we are required to retain it for legal or
            compliance reasons.
          </p>
          <p>
            Content uploaded to IPFS is stored on a decentralised network. We cannot
            guarantee deletion of IPFS-pinned content after it has been publicly propagated.
          </p>
        </Section>

        <Section num="6" title="Cookies and Tracking">
          <p>
            Medialane uses session cookies necessary for authentication and platform
            functionality. We do not use third-party advertising trackers or sell
            behavioural data to ad networks.
          </p>
        </Section>

        <Section num="7" title="Your Rights">
          <p>
            Depending on your jurisdiction, you may have the right to access, correct,
            delete, or export your personal data. To exercise these rights, contact us at{" "}
            <a href="mailto:privacy@medialane.io" className="text-primary hover:underline">
              privacy@medialane.io
            </a>.
          </p>
          <p>
            Note that blockchain data cannot be deleted or modified by us or you — it is
            inherent to the nature of public blockchains.
          </p>
        </Section>

        <Section num="8" title="Security">
          <p>
            We implement industry-standard security measures to protect your personal
            information, including encrypted communications (HTTPS), access controls,
            and session management. However, no method of transmission or storage is
            100% secure — use the platform at your own risk.
          </p>
        </Section>

        <Section num="9" title="Children">
          <p>
            The Service is not directed to children under 18. We do not knowingly collect
            personal information from minors. If you believe a minor has provided us with
            personal information, contact us at{" "}
            <a href="mailto:privacy@medialane.io" className="text-primary hover:underline">
              privacy@medialane.io
            </a>.
          </p>
        </Section>

        <Section num="10" title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of
            material changes by posting the updated policy on this page with a revised
            effective date. Continued use of the Service after changes constitutes
            acceptance of the updated policy.
          </p>
        </Section>

        <Section num="11" title="Contact">
          <p>
            For privacy-related questions or requests, contact us at{" "}
            <a href="mailto:privacy@medialane.io" className="text-primary hover:underline">
              privacy@medialane.io
            </a>.
          </p>
        </Section>
      </div>
    </div>
  );
}
