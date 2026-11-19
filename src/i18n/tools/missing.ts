import { fileURLToPath } from "node:url";
import { readSources, scanSentences } from "@medialane/ui/i18n-tools";
import { loadMessages } from "../messages";

const code = process.argv[2];
if (!code) {
  console.error("usage: bun run i18n:missing <language code>");
  process.exit(1);
}

const { sentences, plurals } = scanSentences(readSources(fileURLToPath(new URL("../..", import.meta.url))));
const messages = await loadMessages(code);
const missing = [...sentences, ...plurals].filter((sentence) => !(sentence in messages)).sort();
for (const sentence of missing) console.log(sentence);
console.error(`${missing.length} sentences without a ${code} translation`);
