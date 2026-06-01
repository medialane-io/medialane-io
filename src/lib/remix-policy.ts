// Single source for the remix/licensing rule. App-layer only — never enforced
// on-chain (the contracts stay permissionless; this only shapes the io frontend).
//
// Permissive by default: only an explicit `Derivatives: Not Allowed` declaration
// suppresses direct remix, and only for non-owners. The licensing deal flow is
// the consent override. See docs/specs/2026-06-01-remix-licensing-separation-design.md.

type Attribute = { trait_type?: string; value?: string };

/** The creator's self-declared derivatives term, or null if unset/absent. */
export function getDerivativesTerm(
  attributes: Attribute[] | null | undefined,
): "Allowed" | "Not Allowed" | null {
  const v = (Array.isArray(attributes) ? attributes : []).find(
    (a) => a.trait_type === "Derivatives",
  )?.value;
  return v === "Allowed" || v === "Not Allowed" ? v : null;
}

export interface RemixPolicyInput {
  /** parent asset declared `Derivatives: Not Allowed` */
  parentNoDerivatives: boolean;
  /** connected wallet owns the parent asset */
  viewerIsParentOwner: boolean;
  /**
   * parent has a reachable Medialane counterparty who could grant a license.
   * v1 approximation: the parent lives in a Medialane-managed (service-backed)
   * collection. A precise per-owner-account lookup is a future refinement.
   */
  dealAvailable: boolean;
}

export interface RemixPolicy extends RemixPolicyInput {
  /** show the direct, permissionless self-mint Remix action */
  canRemixDirect: boolean;
  /** show the optional "propose a license deal" action */
  showDealOption: boolean;
}

export function resolveRemixPolicy(input: RemixPolicyInput): RemixPolicy {
  const canRemixDirect = input.viewerIsParentOwner || !input.parentNoDerivatives;
  const showDealOption = input.dealAvailable && !input.viewerIsParentOwner;
  return { ...input, canRemixDirect, showDealOption };
}
