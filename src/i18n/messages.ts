import { loadCatalog, type Catalog } from "@medialane/ui/i18n";
import { LOADERS } from "./catalogs";

export async function loadMessages(locale: string, loaders = LOADERS): Promise<Catalog> {
  const [shared, own] = await Promise.all([loadCatalog(locale), loadCatalog(locale, loaders)]);
  return { ...shared, ...own };
}
