import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remix & Derivatives | Learn | Medialane",
  description: "Learn how to create derivative works on Medialane — remix graphs, license compliance, attribution, and AI agent remixing.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bento-cell p-4 text-xs font-mono overflow-x-auto text-foreground/80 leading-relaxed">
      {children}
    </pre>
  );
}

export default function LearnRemixPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Remix & Derivative Works</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Creativity is iterative. Medialane natively supports derivative works — letting
          creators build on existing IP while automatically respecting the original
          license terms. Every remix creates a transparent, immutable provenance chain
          on Starknet.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="What is a Remix?">
          <p>
            A remix is a new IP asset that is derived from, samples, or builds upon an
            existing asset. On Medialane, remixes are first-class onchain objects — the
            relationship between the original work and the derivative is recorded
            permanently on Starknet, not just in the metadata description.
          </p>
          <p>
            This creates a <strong className="text-foreground">Remix Graph</strong>: a
            transparent, public genealogy of creative influence that can be traced back
            through any number of generations to the original source work.
          </p>
          <Code>{`Asset A (Root)
  └─ Asset B (Remix of A)
       └─ Asset C (Remix of B)
            └─ Asset D (Remix of C)`}</Code>
        </Section>

        <Section title="How License Terms Flow Through Remixes">
          <p>
            The Mediolano protocol — the IP licensing layer Medialane is built upon —
            enforces license compatibility automatically before a remix can be minted.
            Key rules:
          </p>
          <div className="space-y-2">
            {[
              {
                rule: "Viral (ShareAlike) licenses",
                desc: 'If the parent asset uses a ShareAlike license (e.g. CC BY-SA), any remix MUST also carry a ShareAlike license. You cannot relicense a viral work under more permissive terms.',
              },
              {
                rule: "Attribution",
                desc: "If the parent requires attribution (CC BY), the remix metadata must include a pointer to the original creator. This is enforced automatically — the original creator's address and asset ID are embedded in the child asset's metadata.",
              },
              {
                rule: "Commercial rights",
                desc: "If the parent forbids commercial use (CC BY-NC), the remix cannot grant commercial rights. The most restrictive commercial terms of any ancestor in the chain apply.",
              },
              {
                rule: "No-derivatives",
                desc: "If the parent carries a no-derivatives (ND) flag, remixing is not permitted. The protocol will reject mint attempts that reference ND-licensed parents.",
              },
            ].map(({ rule, desc }) => (
              <div key={rule} className="bento-cell px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-foreground">{rule}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Creating a Remix">
          <p>
            To remix an asset on Medialane, navigate to the asset page and click{" "}
            <strong className="text-foreground">Remix</strong>. You will be prompted to:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm">
            <li>Review the parent asset's license terms to confirm you are eligible to remix.</li>
            <li>Upload your derivative work (image, audio, video, or other supported format).</li>
            <li>Set metadata for the new asset — name, description, IP type.</li>
            <li>Choose a license for your remix (constrained to what the parent's license permits).</li>
            <li>Sign and mint — the parent asset's ID is embedded in your new asset's metadata.</li>
          </ol>
          <p>
            Gas fees for minting a remix are sponsored by Medialane, just like any
            other IP asset mint. There is no additional fee for creating a derivative.
          </p>
        </Section>

        <Section title="Royalties in the Remix Graph">
          <p>
            When a remix is sold on the Medialane marketplace, royalties flow to the
            remix creator at the percentage they set. Optionally, the original creator
            may also be entitled to a share — depending on the license terms configured
            at mint time.
          </p>
          <p>
            This creates a fair economic model: as derivative works appreciate in value
            and trade hands, the original creative contributions that made them possible
            continue to be recognized and compensated — automatically, on every sale,
            enforced by the marketplace smart contract.
          </p>
        </Section>

        <Section title="AI Agents & Automated Remixing">
          <p>
            The Remix Graph is particularly powerful for AI-generated content. An
            autonomous agent can:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm">
            <li>Query the Medialane API for assets that permit remixing (<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">derivatives: allowed</code>).</li>
            <li>Generate a new derivative work using the source asset as input.</li>
            <li>Mint the new asset with the source material automatically linked in metadata.</li>
            <li>Propagate royalties to the original human creator if the remix is later sold.</li>
          </ol>
          <p>
            This structure makes the Mediolano protocol and Medialane platform natively
            AI-agent-ready — autonomous intelligences can participate in the IP economy
            with the same transparency and accountability as human creators.
          </p>
        </Section>

        <Section title="Viewing Remix History">
          <p>
            Every asset page on Medialane shows its lineage — you can see whether an
            asset is an original work or a remix, and trace the full provenance chain
            back to the root. This history is publicly verifiable on Starknet and cannot
            be altered or deleted by anyone.
          </p>
        </Section>
      </div>
    </div>
  );
}
