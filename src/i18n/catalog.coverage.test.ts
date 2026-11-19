import { expect, test } from "bun:test";
import { join } from "node:path";
import { LOCALES, type Catalog } from "@medialane/ui/i18n";
import { readSources, scanSentences } from "@medialane/ui/i18n-tools";
import { LOADERS } from "./catalogs";
import { loadMessages } from "./messages";

const SRC = join(import.meta.dir, "..");
const { sentences, plurals } = scanSentences(readSources(SRC));
const used = new Set([...sentences, ...plurals]);
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
const values = (entry: Catalog[string]) => (typeof entry === "string" ? [entry] : Object.values(entry).filter((v): v is string => !!v));
const others = LOCALES.filter((locale) => locale.code !== "en");

test("every offered language has an io catalog", () => {
  for (const { code } of others) expect(Object.keys(LOADERS), code).toContain(code);
});

test("no io catalog value is empty", async () => {
  for (const { code } of others) {
    const catalog = await LOADERS[code]!();
    for (const [sentence, entry] of Object.entries(catalog)) {
      expect(values(entry).every((value) => value.trim() !== ""), `${code}: ${sentence}`).toBe(true);
    }
  }
});

test("every io translation key is a sentence io's code still uses", async () => {
  for (const { code } of others) {
    const obsolete = Object.keys(await LOADERS[code]!()).filter((sentence) => !used.has(sentence));
    expect(obsolete, code).toEqual([]);
  }
});

test("every placeholder in a sentence appears in its translation and no other does", async () => {
  for (const { code } of others) {
    for (const [sentence, entry] of Object.entries(await LOADERS[code]!())) {
      for (const value of values(entry)) expect(placeholders(value), `${code}: ${sentence}`).toEqual(placeholders(sentence));
    }
  }
});

test("every sentence io shows has a translation, from io or from the shared interface", async () => {
  for (const { code } of others) {
    const messages = await loadMessages(code);
    expect([...used].filter((sentence) => !(sentence in messages)).sort(), code).toEqual([]);
  }
});
