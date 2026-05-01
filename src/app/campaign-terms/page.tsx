import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Campaign Terms | Medialane",
  description: "Medialane Creator Fund campaign participation terms and disclaimer.",
};

export default function CampaignTermsPage() {
  return (
    <div className="container mx-auto px-5 py-12 max-w-2xl space-y-10">

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Medialane</span>
        </div>
        <h1 className="text-2xl font-bold">Creator Fund — Campaign Terms</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Applies to all Medialane launch campaigns, including the Brazil campaign at{" "}
          <Link href="/br/mint" className="underline underline-offset-2 hover:text-foreground transition-colors">medialane.io/br/mint</Link>{" "}
          and the global campaign at{" "}
          <Link href="/mint" className="underline underline-offset-2 hover:text-foreground transition-colors">medialane.io/mint</Link>.
        </p>
        <p className="text-xs text-muted-foreground">Last updated: May 2026</p>
      </div>

      <div className="space-y-7 text-sm">

        <section className="space-y-2">
          <h2 className="font-semibold text-base">Participation</h2>
          <p className="text-muted-foreground leading-relaxed">
            Participation in the Medialane Creator Fund campaign is completely free. No purchase,
            payment, or financial commitment is required at any stage. Registration requires a valid
            email address and takes less than one minute.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base">Creator Fund</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Medialane Creator Fund is a community-governed initiative that distributes resources
            to platform participants based on their activity and creative contributions. The fund is
            managed by Medialane DAO and all distributions are subject to community governance
            votes via{" "}
            <a
              href="https://snapshot.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Snapshot
            </a>.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Phase 1 distributions are triggered when the platform reaches 5,000 verified participants.
            Phase 2 distributions are triggered at 10,000 verified participants. These milestones are
            targets, not guarantees — distribution timing depends on platform growth and community
            governance decisions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base">Eligibility &amp; Scoring</h2>
          <p className="text-muted-foreground leading-relaxed">
            Participants qualify by registering an account and securing it with a PIN or passkey.
            Those who also publish original content, engage with other creators, or complete
            platform activities receive a higher contribution score — which determines their
            proportional share of fund distributions.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Medialane reserves the right to disqualify accounts found to be using automated tools,
            duplicate registrations, or other means to artificially inflate participation scores.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base">Participation Certificate</h2>
          <p className="text-muted-foreground leading-relaxed">
            Upon completing registration, participants may claim a digital participation certificate —
            a permanent record of their early membership in the Medialane community. This certificate
            is issued on a public decentralized network and may be viewed by anyone. It has no
            inherent monetary value and is not a financial instrument.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base">Not a Financial Product</h2>
          <p className="text-muted-foreground leading-relaxed">
            Medialane is a content publishing and creator rewards platform. This campaign is not
            a financial product, investment scheme, lottery, or gambling service. Participation
            does not guarantee any financial return. Fund distributions, if any, are made at the
            sole discretion of Medialane DAO governance and may take the form of platform credits,
            digital assets, or other community resources as determined by governance vote.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base">Changes to These Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            These terms may be updated as the campaign evolves. The current version is always
            available at this page. Continued participation after an update constitutes acceptance
            of the revised terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base">Questions</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about this campaign, visit{" "}
            <Link href="/support" className="underline underline-offset-2 hover:text-foreground transition-colors">
              our support page
            </Link>{" "}
            or read the full{" "}
            <a
              href="https://docs.medialane.io/dao/airdrop"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Creator Fund documentation
            </a>.
          </p>
        </section>

      </div>

      {/* Portuguese summary */}
      <div className="border-t border-border/50 pt-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resumo em Português</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A participação na campanha Medialane é gratuita, sem necessidade de compra ou pagamento.
          O Fundo de Criadores é gerido pela comunidade Medialane DAO e as distribuições dependem
          de votos de governança. Esta campanha não é um produto financeiro, investimento, loteria
          ou serviço de apostas. O certificado de participação é um registro digital permanente
          de filiação à comunidade, sem valor monetário intrínseco.
        </p>
      </div>

    </div>
  );
}
