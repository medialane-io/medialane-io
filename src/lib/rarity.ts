/**
 * Compute rarity scores from a set of token attributes.
 * Score = sum of (totalTokens / traitValueCount) for each trait the token has.
 * Higher score = rarer. Returns a map of tokenId → { score, rank, tier }.
 */
export type RarityTier = "legendary" | "epic" | "rare" | "uncommon" | "common";

export interface RarityResult {
  score: number;
  rank: number;
  tier: RarityTier;
}

function toTier(rank: number, total: number): RarityTier {
  const pct = rank / total;
  if (pct <= 0.01) return "legendary";
  if (pct <= 0.05) return "epic";
  if (pct <= 0.15) return "rare";
  if (pct <= 0.35) return "uncommon";
  return "common";
}

type Attribute = { trait_type?: string; value?: unknown };

export function computeRarity(
  tokens: { tokenId: string; metadata?: { attributes?: unknown } | null }[]
): Map<string, RarityResult> {
  if (tokens.length < 20) return new Map();

  const total = tokens.length;

  // Count occurrences of each trait_type+value pair
  const counts = new Map<string, number>();
  for (const token of tokens) {
    const attrs = Array.isArray(token.metadata?.attributes)
      ? (token.metadata!.attributes as Attribute[])
      : [];
    for (const attr of attrs) {
      if (!attr.trait_type || attr.value == null) continue;
      const key = `${attr.trait_type}::${String(attr.value)}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  // Score each token
  const scores: { tokenId: string; score: number }[] = tokens.map((token) => {
    const attrs = Array.isArray(token.metadata?.attributes)
      ? (token.metadata!.attributes as Attribute[])
      : [];
    let score = 0;
    for (const attr of attrs) {
      if (!attr.trait_type || attr.value == null) continue;
      const key = `${attr.trait_type}::${String(attr.value)}`;
      const count = counts.get(key) ?? 1;
      score += total / count;
    }
    return { tokenId: token.tokenId, score };
  });

  // Rank by score descending (higher score = rarer = lower rank number)
  scores.sort((a, b) => b.score - a.score);

  const result = new Map<string, RarityResult>();
  scores.forEach(({ tokenId, score }, i) => {
    const rank = i + 1;
    result.set(tokenId, { score, rank, tier: toTier(rank, total) });
  });

  return result;
}
