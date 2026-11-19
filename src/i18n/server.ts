import { makeT } from "@medialane/ui/i18n";
import { loadMessages } from "./messages";

export async function getT(locale: string) {
  return makeT(locale, await loadMessages(locale));
}
