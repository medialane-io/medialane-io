import type { Catalog } from "@medialane/ui/i18n";

export const LOADERS: Record<string, () => Promise<Catalog>> = {
  pt: async () => (await import("./catalog/pt")).default,
};
