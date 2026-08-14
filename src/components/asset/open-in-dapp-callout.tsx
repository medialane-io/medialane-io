import { Wallet } from "lucide-react";

function chainLabel(chain: string): string {
  return chain.charAt(0).toUpperCase() + chain.slice(1).toLowerCase();
}

interface OpenInDappCalloutProps {

  chain: string;
  contract: string;
  tokenId: string;
}

export function OpenInDappCallout({ chain, contract, tokenId }: OpenInDappCalloutProps) {
  const label = chainLabel(chain);
  const url = `https://${chain.toLowerCase()}.medialane.io/asset/${contract}/${tokenId}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full items-start gap-3 rounded-2xl border border-transparent bg-gradient-to-br from-brand-rose/15 via-brand-orange/10 to-transparent p-4 transition-colors hover:border-brand-orange/30"
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-rose to-brand-orange text-white">
        <Wallet className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-snug">Trade with your {label} wallet</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Interact with this asset on the {label} dapp.
        </p>
      </div>
    </a>
  );
}
