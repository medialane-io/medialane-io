type Attr = { trait_type?: string; value?: string };

const get = (a: Attr[], key: string): string | undefined => {

  const v = a.find((x) => x.trait_type?.toLowerCase() === key)?.value;
  return v == null ? undefined : String(v);
};

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
