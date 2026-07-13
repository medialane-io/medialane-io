"use client";

import { Award, ExternalLink } from "lucide-react";
import Link from "next/link";
import { EXPLORER_URL } from "@/lib/constants";
import { normalizeAddress } from "@medialane/sdk";

interface CreationRecordProps {
  originalCreator: string;
  registeredAt: number; // unix seconds
}

/**
 * Berne Convention authorship record surfaced from IPNft.get_full_token_data.
 * Both fields are immutable on-chain — original_creator is set at mint time
 * and never changes regardless of subsequent ownership transfers.
 */
export function CreationRecord({ originalCreator, registeredAt }: CreationRecordProps) {
  const creator = originalCreator ? normalizeAddress("STARKNET", originalCreator) : "";
  const date = new Date(registeredAt * 1000);
  const formatted = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-4 w-4 text-amber-500" />
        <p className="text-sm font-semibold text-amber-500">Creation Record</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Immutable on-chain authorship record set at mint and stored permanently
        for legal evidence of creation (Berne Convention).
      </p>
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Original creator</dt>
          <dd className="tabular-nums">
            <Link href={`/creator/${creator}`} className="hover:underline">
              {creator.slice(0, 6)}…{creator.slice(-4)}
            </Link>
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Registered at</dt>
          <dd>
            <a
              href={`${EXPLORER_URL}/contract/${creator}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              {formatted}
              <ExternalLink className="h-3 w-3" />
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}
