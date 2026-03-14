import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Community Guidelines | Docs | Medialane",
  description: "Rules for community participation, moderation standards, and how violations are handled on Medialane.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function DocsCommunityGuidelinesPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Community Guidelines</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Medialane is a creative community. These guidelines exist to keep it respectful,
          fair, and valuable for every creator, collector, and developer who participates.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="Our Values">
          <p>
            We believe in creator sovereignty, transparent markets, and open technology.
            We want Medialane to be a place where original work is celebrated, ownership
            is verifiable, and transactions are honest. These values shape every rule below.
          </p>
        </Section>

        <Section title="Respectful Participation">
          <p>Treat every member of the community with respect. The following are not tolerated:</p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Harassment, bullying, or targeted abuse of any platform member</li>
            <li>Hate speech based on race, ethnicity, gender, sexuality, religion, or disability</li>
            <li>Sharing private information about others without consent (doxxing)</li>
            <li>Impersonating other creators, collectors, or Medialane staff</li>
            <li>Coordinated harassment campaigns against individuals or groups</li>
          </ul>
        </Section>

        <Section title="Authentic Content">
          <p>
            The integrity of the Medialane marketplace depends on authentic content and
            honest provenance. Do not:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Mint content you did not create or do not have rights to</li>
            <li>Misrepresent the origin, edition size, or rights attached to an asset</li>
            <li>Copy another creator&apos;s collection name, artwork, or brand identity to deceive buyers</li>
            <li>Use misleading descriptions or metadata to manipulate purchase decisions</li>
          </ul>
        </Section>

        <Section title="Fair Markets">
          <p>
            We are committed to fair and transparent markets. Prohibited market activities include:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Wash trading — transacting with yourself to inflate volume or price history</li>
            <li>Coordinated price manipulation</li>
            <li>Shill bidding — placing offers you never intend to honour</li>
            <li>Artificially inflating floor prices through collusion</li>
          </ul>
        </Section>

        <Section title="Spam and Automation">
          <p>
            Do not use automated tools to spam listings, offers, or API endpoints. Do not
            mass-mint low-effort content to game discovery or search rankings. Accounts
            found engaging in spam behaviour will be rate-limited or suspended.
          </p>
        </Section>

        <Section title="Reporting Violations">
          <p>
            If you encounter content or behaviour that violates these guidelines, please
            report it to{" "}
            <a href="mailto:trust@medialane.io" className="text-primary hover:underline">
              trust@medialane.io
            </a>{" "}
            with as much detail as possible — including asset links, transaction hashes,
            or screenshots where relevant.
          </p>
          <p>
            For copyright infringement specifically, use{" "}
            <a href="mailto:dmca@medialane.io" className="text-primary hover:underline">
              dmca@medialane.io
            </a>.
          </p>
        </Section>

        <Section title="Enforcement">
          <p>
            Violations are handled on a case-by-case basis. Actions may include content
            removal, temporary suspension, or permanent ban. Severity, intent, and prior
            history are all considered. We do not remove content based solely on
            subjective taste — only clear violations of these guidelines.
          </p>
          <p>
            Appeals can be submitted to{" "}
            <a href="mailto:support@medialane.io" className="text-primary hover:underline">
              support@medialane.io
            </a>.
            We aim to respond to all appeals within 5 business days.
          </p>
        </Section>

        <Section title="Updates to These Guidelines">
          <p>
            These guidelines may be updated as the platform evolves. Significant changes
            will be announced via our official channels. Continued use of the platform
            after changes constitutes acceptance of the updated guidelines.
          </p>
          <p>
            See also our{" "}
            <Link href="/docs/user-guidelines" className="text-primary hover:underline">User Guidelines</Link>
            {" "}and{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms of Use</Link>.
          </p>
        </Section>
      </div>
    </div>
  );
}
