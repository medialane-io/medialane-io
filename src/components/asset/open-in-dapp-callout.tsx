import { Wallet, ArrowUpRight } from "lucide-react";

/** Title-case a chain slug/enum for display ("STARKNET" → "Starknet"). */
function chainLabel(chain: string): string {
  return chain.charAt(0).toUpperCase() + chain.slice(1).toLowerCase();
}

interface OpenInDappCalloutProps {
  /** Asset chain (e.g. "STARKNET") — picks the per-chain dapp subdomain. */
  chain: string;
  contract: string;
  tokenId: string;
}

/**
 * Bridge from the chain-agnostic consumer app (medialane.io) to the
 * chain-native dapp for web3 users. medialane.io trades with a managed,
 * frictionless wallet; the dapp lets users connect their own wallet and
 * trade non-custodially on the asset's native chain.
 *
 * The dapp lives at `<chain>.medialane.io` (today: starknet.medialane.io;
 * planned: ethereum/solana/base/bitcoin), mirroring the asset at the same
 * id — so this stays correct as more chains come online.
 */
export function OpenInDappCallout({ chain, contract, tokenId }: OpenInDappCalloutProps) {
  const label = chainLabel(chain);
  const url = `https://${chain.toLowerCase()}.medialane.io/asset/${contract}/${tokenId}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl border border-border bg-card/40 p-4 transition-colors hover:border-foreground/20"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue/15 to-brand-purple/15 text-brand-purple">
          <Wallet className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug">Use your own wallet</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Trade this asset non-custodially on the {label} app with a wallet you control.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold gradient-text">
            Open on {label}
            <ArrowUpRight className="h-3.5 w-3.5 text-brand-purple transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </a>
  );
}
