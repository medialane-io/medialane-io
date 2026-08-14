

type Attribute = { trait_type?: string; value?: string };

export function getDerivativesTerm(
  attributes: Attribute[] | null | undefined,
): "Allowed" | "Not Allowed" | null {
  const v = (Array.isArray(attributes) ? attributes : []).find(
    (a) => a.trait_type === "Derivatives",
  )?.value;
  return v === "Allowed" || v === "Not Allowed" ? v : null;
}

export interface RemixPolicyInput {

  parentNoDerivatives: boolean;

  viewerIsParentOwner: boolean;

  dealAvailable: boolean;
}

export interface RemixPolicy extends RemixPolicyInput {

  canRemixDirect: boolean;

  showDealOption: boolean;
}

export function resolveRemixPolicy(input: RemixPolicyInput): RemixPolicy {
  const canRemixDirect = input.viewerIsParentOwner || !input.parentNoDerivatives;
  const showDealOption = input.dealAvailable && !input.viewerIsParentOwner;
  return { ...input, canRemixDirect, showDealOption };
}
