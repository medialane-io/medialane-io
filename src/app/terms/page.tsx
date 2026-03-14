import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | Medialane",
  description: "Terms of Use for the Medialane platform.",
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

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 pt-12 pb-16 max-w-3xl space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Terms of Use</h1>
        <p className="text-muted-foreground text-sm">Last updated: March 14, 2026</p>
        <p className="text-muted-foreground leading-relaxed">
          Please read these Terms of Use carefully before using the Medialane platform.
          By accessing or using Medialane, you agree to be bound by these terms.
        </p>
      </div>

      <div className="space-y-8">
        <Section num="1" title="Acceptance of Terms">
          <p>
            These Terms of Use (&ldquo;Terms&rdquo;) constitute a legally binding agreement between
            you (&ldquo;User&rdquo;) and Medialane DAO (&ldquo;Medialane,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) governing
            your access to and use of the Medialane website, platform, and services
            (collectively, the &ldquo;Service&rdquo;).
          </p>
          <p>
            By accessing or using the Service, you confirm that you are at least 18 years
            of age, have read and understood these Terms, and agree to be bound by them.
            If you do not agree to these Terms, do not use the Service.
          </p>
        </Section>

        <Section num="2" title="Description of Service">
          <p>
            Medialane is a blockchain-based platform for minting, licensing, and trading
            intellectual property as non-fungible tokens (NFTs) on the Starknet network.
            The Service includes:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>NFT minting and collection deployment tools</li>
            <li>A peer-to-peer marketplace for listing, buying, and selling NFTs</li>
            <li>On-chain licensing metadata and royalty enforcement</li>
            <li>Wallet management via ChipiPay session keys</li>
            <li>An API and SDK for third-party integrations</li>
          </ul>
        </Section>

        <Section num="3" title="User Accounts">
          <p>
            To use certain features of the Service, you must create an account via our
            authentication provider (Clerk). You are responsible for maintaining the
            confidentiality of your account credentials and for all activity that occurs
            under your account.
          </p>
          <p>
            You agree to provide accurate, current, and complete information during
            registration and to keep your information updated. Medialane reserves the
            right to suspend or terminate accounts that violate these Terms.
          </p>
        </Section>

        <Section num="4" title="Intellectual Property and Content">
          <p>
            By minting content on Medialane, you represent and warrant that: (a) you are
            the original creator of the content or hold all necessary rights and licenses
            to mint it as an NFT; (b) the content does not infringe any third-party
            intellectual property rights; and (c) you have the right to grant any licenses
            attached to the NFT.
          </p>
          <p>
            Medialane does not claim ownership of content you mint. You retain all
            intellectual property rights in your original works, subject to the license
            terms you define at mint time.
          </p>
        </Section>

        <Section num="5" title="Prohibited Uses">
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Mint or trade content that infringes third-party intellectual property rights</li>
            <li>Engage in market manipulation, wash trading, or fraudulent activity</li>
            <li>Violate any applicable law or regulation</li>
            <li>Upload malicious code or attempt to compromise platform security</li>
            <li>Harass, threaten, or harm other users</li>
            <li>Circumvent any access controls or usage restrictions</li>
          </ul>
        </Section>

        <Section num="6" title="Blockchain Transactions">
          <p>
            All NFT transactions on Medialane are executed on the Starknet blockchain.
            Blockchain transactions are irreversible once confirmed. Medialane does not
            have the ability to reverse or modify confirmed transactions.
          </p>
          <p>
            You are solely responsible for ensuring you have sufficient funds and
            understanding of the transaction before signing. Transaction fees (gas)
            may apply depending on your account configuration.
          </p>
        </Section>

        <Section num="7" title="Fees and Payments">
          <p>
            Medialane charges a platform fee on each marketplace transaction. The current
            fee schedule is displayed on the platform at the time of transaction. Fees
            are deducted automatically by the marketplace smart contract at settlement.
          </p>
          <p>
            Creators receive royalties as configured at mint time. Royalty distribution
            is handled by the smart contract and requires no manual action.
          </p>
        </Section>

        <Section num="8" title="Disclaimers">
          <p>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY
            KIND, EXPRESS OR IMPLIED. MEDIALANE DOES NOT WARRANT THAT THE SERVICE WILL
            BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
          </p>
          <p>
            NFTs are volatile digital assets. Medialane makes no representations or
            warranties regarding the value, liquidity, or future performance of any NFT.
            Past performance is not indicative of future results.
          </p>
        </Section>

        <Section num="9" title="Limitation of Liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, MEDIALANE SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
            DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF
            MEDIALANE HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
        </Section>

        <Section num="10" title="Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with applicable
            law. Any disputes arising under these Terms shall be subject to the exclusive
            jurisdiction of the competent courts.
          </p>
        </Section>

        <Section num="11" title="Changes to Terms">
          <p>
            Medialane reserves the right to modify these Terms at any time. We will
            notify users of material changes by posting the updated Terms on the platform.
            Continued use of the Service after changes constitute acceptance of the
            updated Terms.
          </p>
        </Section>

        <Section num="12" title="Contact">
          <p>
            If you have questions about these Terms, contact us at{" "}
            <a href="mailto:legal@medialane.io" className="text-primary hover:underline">
              legal@medialane.io
            </a>.
          </p>
        </Section>
      </div>
    </div>
  );
}
