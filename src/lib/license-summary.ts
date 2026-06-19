type Attr = { trait_type?: string; value?: string };

const get = (a: Attr[], key: string): string | undefined =>
  a.find((x) => x.trait_type?.toLowerCase() === key)?.value;

/**
 * One plain-language sentence summarizing the license, derived from the license
 * traits. Deliberately omits attribution/credit wording (not the place for it).
 * Returns null when there's no license data to summarize.
 *
 * Trait keys match the asset metadata: "Commercial Use", "Derivatives",
 * "AI Policy", "Territory".
 */
export function licenseSummary(attributes: Attr[]): string | null {
  const commercialRaw = get(attributes, "commercial use");
  const derivatives = (get(attributes, "derivatives") ?? "").toLowerCase();
  const ai = (get(attributes, "ai policy") ?? get(attributes, "ai & data mining") ?? "").toLowerCase();
  const territory = get(attributes, "territory") ?? "";

  if (!commercialRaw && !derivatives && !ai) return null;

  const commercial = (commercialRaw ?? "").toLowerCase() === "yes";
  const remix =
    derivatives === "not allowed"
      ? "No remixing"
      : commercial
        ? "Open to remix and commercial use"
        : "Open to remix";
  const where = territory ? `, ${territory.toLowerCase()}` : "";
  const aiClause = ai.includes("not") ? " — no AI training" : "";
  return `${remix}${where}${aiClause}.`;
}
