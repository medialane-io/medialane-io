import type { Metadata } from "next";
import { Shield, Eye, Lock, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Security | Docs | Medialane",
  description: "Security architecture, audit reports, risk disclosure, and monitoring for the Medialane protocol.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function DocsSecurityPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Security</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Security is foundational to the Integrity Web. Medialane and the underlying
          Mediolano protocol employ rigorous testing, formal verification, and continuous
          monitoring to safeguard user assets and IP records.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="Defense-in-Depth Strategy">
          <p>
            The Mediolano protocol — the IP protection and licensing layer that Medialane
            is built upon — adopts a layered security approach across every component:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: Shield,
                title: "Formal Verification",
                desc: "Core Cairo contracts are formally verified where applicable to prove correctness at the mathematical level.",
              },
              {
                icon: Eye,
                title: "Peer Review",
                desc: "Every code change to protocol contracts and the platform undergoes peer review before deployment.",
              },
              {
                icon: Lock,
                title: "Timelock Controllers",
                desc: "Governance actions that affect protocol parameters are subject to timelocked execution, giving the community time to respond.",
              },
              {
                icon: AlertTriangle,
                title: "Immutable Core Contracts",
                desc: "Core protocol contracts are immutable to prevent unauthorized upgrades — no single party can change the rules unilaterally.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bento-cell p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Audit Reports">
          <div className="space-y-2">
            <div className="bento-cell px-4 py-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Core Protocol Audit — Mediolano</p>
                <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Completed</span>
              </div>
              <p className="text-xs text-muted-foreground">Audited by the core development team · October 2025</p>
              <p className="text-xs text-muted-foreground">
                Covers the Marketplace contract, Collection Registry factory, IP NFT standard,
                SNIP-12 order signing, and royalty distribution logic.
              </p>
            </div>
            <div className="bento-cell px-4 py-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">POP Protocol & Collection Drop Audit</p>
                <span className="text-[10px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">In progress</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Third-party audit of the POP Protocol factory and Collection Drop contracts is scheduled as these contracts approach stable release.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Decentralized Storage">
          <p>
            All IP asset media and metadata are stored on{" "}
            <strong className="text-foreground">IPFS</strong> — a decentralized
            content-addressed storage network. A hash of every metadata JSON is committed
            to the Starknet blockchain inside the token URI, creating an immutable link
            between the on-chain record and the off-chain content.
          </p>
          <p>
            This means your IP proof is not dependent on Medialane's servers continuing to
            operate. The record exists on the Starknet blockchain and IPFS permanently,
            independent of the platform.
          </p>
        </Section>

        <Section title="Real-Time Monitoring">
          <p>
            The Medialane infrastructure uses real-time on-chain monitoring to detect
            anomalies and suspicious transaction patterns — including unusual order volumes,
            contract call anomalies, and potential flash-loan attack vectors. Alerts allow
            for rapid response to potential threats before they can escalate.
          </p>
        </Section>

        <Section title="Risk Disclosure">
          <div className="bento-cell p-4 border-amber-500/30 bg-amber-500/5 space-y-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Important Notice
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Smart contracts carry inherent risks. While the Mediolano protocol and
              Medialane platform take every precaution — including audits, formal
              verification, and continuous testing — user funds and IP assets could
              theoretically be at risk due to unforeseen bugs in the protocol or the
              underlying Starknet network. Use caution and only commit assets whose
              loss you could tolerate.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Medialane does not take custody of your assets. Your NFTs remain in
              your self-custodied wallet at all times. Marketplace orders are signed
              intents — your asset does not leave your wallet until a transaction is
              fully executed and settled on Starknet.
            </p>
          </div>
        </Section>

        <Section title="Responsible Disclosure">
          <p>
            If you discover a security vulnerability in the Medialane platform or the
            Mediolano protocol, please report it responsibly to{" "}
            <a href="mailto:security@medialane.io" className="text-primary hover:underline">
              security@medialane.io
            </a>
            . Do not disclose vulnerabilities publicly before giving the team a reasonable
            opportunity to investigate and remediate.
          </p>
        </Section>
      </div>
    </div>
  );
}
