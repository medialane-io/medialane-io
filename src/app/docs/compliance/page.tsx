import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compliance | Docs | Medialane",
  description: "Medialane's approach to regulatory compliance — KYC/AML, IP law, sanctions, data protection, and DAO liability.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function DocsCompliancePage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Compliance Guidelines</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Medialane operates at the intersection of blockchain technology, intellectual
          property law, and global financial regulations. These guidelines outline our
          approach to compliance and what it means for users of the platform.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="Overview">
          <p>
            Medialane is built on the{" "}
            <strong className="text-foreground">Mediolano protocol</strong> — a
            permissionless, open-source IP protection and licensing infrastructure.
            The decentralized architecture of the protocol is designed to comply with
            applicable laws while preserving user privacy and sovereignty. We actively
            monitor global regulatory developments to ensure ongoing adherence.
          </p>
        </Section>

        <Section title="KYC / AML Policy">
          <p>
            As a non-custodial platform:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm">
            <li>Medialane <strong className="text-foreground">does not hold user funds</strong> — assets remain in user-controlled wallets at all times.</li>
            <li>We do not perform Know Your Customer (KYC) checks on general users.</li>
            <li>We implement wallet screening to block addresses associated with known illicit activities.</li>
          </ul>
          <p>
            This non-custodial model means Medialane is not a money services business (MSB)
            under most jurisdictions. Users are responsible for their own compliance with
            local financial regulations.
          </p>
        </Section>

        <Section title="Securities Regulations">
          <p>
            IP tokens generated on Medialane and the Mediolano protocol are{" "}
            <strong className="text-foreground">utility tokens</strong> representing
            ownership or licensing rights over a specific creative work. They are not
            designed or marketed as investment contracts or financial instruments.
          </p>
          <p>
            Users who wish to fractionalize IP tokens or sell them in ways that could
            constitute a securities offering should consult qualified legal counsel to
            ensure compliance with applicable securities laws in their jurisdiction.
          </p>
        </Section>

        <Section title="Intellectual Property Law">
          <p>
            Medialane upholds international IP standards. The Mediolano protocol is
            specifically designed to align with:
          </p>
          <div className="space-y-2">
            {[
              {
                title: "Berne Convention (1886)",
                desc: "Administered by WIPO. Ensures automatic copyright protection across 181 signatory countries from the moment a work is fixed — no registration required.",
              },
              {
                title: "WIPO Copyright Treaty",
                desc: "Extends Berne Convention protections to the digital environment, covering digital works and online distribution rights.",
              },
              {
                title: "DMCA (Digital Millennium Copyright Act)",
                desc: "Medialane implements DMCA takedown procedures for its platform interface. Report infringing content to dmca@medialane.io.",
              },
            ].map(({ title, desc }) => (
              <div key={title} className="bento-cell px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Taxation">
          <p>
            Users are responsible for determining and paying any applicable taxes on
            earnings derived from IP licensing, sales, royalties, or other platform
            activity. Medialane does not withhold taxes and does not provide tax advice.
          </p>
          <p>
            Tax treatment of NFT sales and crypto-based royalties varies significantly
            by jurisdiction. Consult a qualified tax professional in your country before
            engaging in significant trading or licensing activity.
          </p>
        </Section>

        <Section title="Sanctions Compliance">
          <p>
            Medialane complies with OFAC (Office of Foreign Assets Control) sanctions
            lists and equivalent international restrictions. Access to the platform by
            individuals or entities in sanctioned jurisdictions, or by sanctioned
            individuals, is prohibited.
          </p>
        </Section>

        <Section title="Data Protection">
          <p>
            Medialane is committed to GDPR and CCPA compliance for user data processed
            through the platform. On-chain data — transactions, wallet addresses, token
            metadata — is inherently public and permanent on Starknet. Off-platform user
            data (email, authentication) is handled by Clerk in accordance with their
            privacy policies.
          </p>
          <p>
            See our{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>{" "}
            for full details.
          </p>
        </Section>

        <Section title="DAO Liability">
          <p>
            Medialane DAO LLC is being incorporated in Utah, USA, as the organizational
            entity overseeing long-term platform governance. The DAO structure is designed
            so that contributors and voters are not personally liable for the actions of
            the protocol, to the extent permitted by applicable law.
          </p>
          <p>
            As the governance structure matures, decisions affecting the protocol and
            platform will transition to community governance through transparent on-chain
            voting and proposal mechanisms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For compliance-related inquiries:{" "}
            <a href="mailto:dao@medialane.org" className="text-primary hover:underline">dao@medialane.org</a>
            <br />
            For DMCA / copyright notices:{" "}
            <a href="mailto:dmca@medialane.io" className="text-primary hover:underline">dmca@medialane.io</a>
          </p>
        </Section>
      </div>
    </div>
  );
}
