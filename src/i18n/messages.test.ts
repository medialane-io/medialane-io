import { describe, expect, test } from "bun:test";
import { translate } from "@medialane/ui/i18n";
import { loadMessages } from "./messages";

describe("loadMessages", () => {
  test("English loads no catalog", async () => {
    let loaded = 0;
    const messages = await loadMessages("en", { pt: async () => (loaded++, { Cancel: "Cancelar" }) });
    expect(messages).toEqual({});
    expect(loaded).toBe(0);
  });

  test("only the active language is loaded", async () => {
    const loaded: string[] = [];
    const loaders = {
      pt: async () => (loaded.push("pt"), { Cancel: "Cancelar" }),
      es: async () => (loaded.push("es"), { Cancel: "Cancelar" }),
    };
    const messages = await loadMessages("pt", loaders);
    expect(loaded).toEqual(["pt"]);
    expect(messages.Cancel).toBe("Cancelar");
  });

  test("a sentence missing in pt shows as written", async () => {
    const messages = await loadMessages("pt", { pt: async () => ({ Cancel: "Cancelar" }) });
    expect(translate({ messages, text: "Remove" })).toBe("Remove");
  });
});
