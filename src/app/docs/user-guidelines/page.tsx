import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Guidelines | Docs | Medialane",
  description: "How to use the Medialane platform responsibly — account rules, content standards, and best practices.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function DocsUserGuidelinesPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">User Guidelines</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Medialane is an open platform built on trust between creators, collectors, and
          the community. These guidelines help ensure the platform remains safe, fair,
          and valuable for everyone.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="Account Rules">
          <p>Each user may hold one Medialane account. Accounts are tied to your Clerk
          authentication identity. Sharing accounts or using automation to create multiple
          accounts is prohibited and may result in permanent suspension.</p>
          <p>You are responsible for all activity that occurs under your account. Keep your
          login credentials secure and do not share your session PIN with anyone.</p>
        </Section>

        <Section title="Content Standards">
          <p>All content minted on Medialane must comply with the following standards:</p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>You must own or have explicit rights to the content you mint</li>
            <li>Content must not infringe the copyright or trademark of any third party</li>
            <li>Content must not be illegal in your jurisdiction or the jurisdictions of our users</li>
            <li>No content depicting child sexual abuse material (CSAM) — zero tolerance, permanent ban</li>
            <li>No non-consensual intimate imagery (NCII)</li>
            <li>No content designed to harass, threaten, or dox specific individuals</li>
            <li>No content that promotes violence against specific groups or individuals</li>
          </ul>
        </Section>

        <Section title="Intellectual Property">
          <p>
            By minting content on Medialane you represent and warrant that you are the
            original creator of the work or hold a valid license to mint it as an NFT.
            Minting content you do not own — including screenshots of others&apos; work,
            AI-generated content from models trained on unlicensed data, or remixes
            without appropriate rights — is a violation of these guidelines and may
            expose you to legal liability.
          </p>
          <p>
            If you believe your intellectual property has been infringed by content on
            Medialane, please contact us at{" "}
            <a href="mailto:dmca@medialane.io" className="text-primary hover:underline">
              dmca@medialane.io
            </a>{" "}
            with details of the alleged infringement.
          </p>
        </Section>

        <Section title="Marketplace Conduct">
          <p>
            All marketplace transactions must be conducted in good faith. The following
            activities are prohibited:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Wash trading — buying and selling to yourself to inflate volume metrics</li>
            <li>Shill bidding — placing offers you do not intend to honour</li>
            <li>Misleading listings — misrepresenting the content, rights, or provenance of an asset</li>
            <li>Manipulation of floor prices through coordinated activity</li>
          </ul>
        </Section>

        <Section title="Wallet Security">
          <p>
            Your Medialane wallet is derived from your authentication session and secured
            by your PIN. Do not share your PIN with anyone — including Medialane support
            staff (we will never ask for it). If you believe your account has been
            compromised, sign out immediately and contact support.
          </p>
        </Section>

        <Section title="Enforcement">
          <p>
            Violations of these guidelines may result in content removal, temporary
            suspension, or permanent account termination depending on severity. We reserve
            the right to remove any content that violates these guidelines at our sole
            discretion, without prior notice.
          </p>
          <p>
            Appeals can be submitted to{" "}
            <a href="mailto:support@medialane.io" className="text-primary hover:underline">
              support@medialane.io
            </a>.
          </p>
        </Section>
      </div>
    </div>
  );
}
