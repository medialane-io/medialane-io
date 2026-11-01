import { test, expect } from "bun:test";
import { readGenesisHolding } from "./genesis-holding";

type Call = { contractAddress: string; entrypoint: string; calldata: string[] };

const providerWith = (answers: Record<string, string[] | Error>) => {
  const calls: Call[] = [];
  return {
    calls,
    provider: {
      callContract: async (call: Call) => {
        calls.push(call);
        const answer = answers[call.entrypoint];
        if (answer instanceof Error) throw answer;
        if (!answer) throw new Error(`no answer for ${call.entrypoint}`);
        return answer;
      },
    },
  };
};

test("a wallet with no token is not a holder", async () => {
  const { provider } = providerWith({ balanceOf: ["0x0", "0x0"] });
  expect(await readGenesisHolding(provider as never, "0xc", "0xme")).toEqual({ owned: false, tokenId: null });
});

test("a holder gets the id of their first token", async () => {
  const { provider, calls } = providerWith({
    balanceOf: ["0x2", "0x0"],
    token_of_owner_by_index: ["0x2a", "0x0"],
  });
  expect(await readGenesisHolding(provider as never, "0xc", "0xme")).toEqual({ owned: true, tokenId: "42" });
  expect(calls.find((c) => c.entrypoint === "token_of_owner_by_index")).toEqual({
    contractAddress: "0xc",
    entrypoint: "token_of_owner_by_index",
    calldata: ["0xme", "0x0", "0x0"],
  });
});

test("a holder is still a holder when the token id cannot be read", async () => {
  const { provider } = providerWith({
    balanceOf: ["0x1", "0x0"],
    token_of_owner_by_index: new Error("unsupported"),
  });
  expect(await readGenesisHolding(provider as never, "0xc", "0xme")).toEqual({ owned: true, tokenId: null });
});

test("the snake case balance entrypoint is used when balanceOf is missing", async () => {
  const { provider } = providerWith({
    balanceOf: new Error("missing"),
    balance_of: ["0x1", "0x0"],
    token_of_owner_by_index: ["0x7", "0x0"],
  });
  expect(await readGenesisHolding(provider as never, "0xc", "0xme")).toEqual({ owned: true, tokenId: "7" });
});

test("a failed balance read is an error, not a non-holder", async () => {
  const { provider } = providerWith({ balanceOf: new Error("rpc down"), balance_of: new Error("rpc down") });
  await expect(readGenesisHolding(provider as never, "0xc", "0xme")).rejects.toThrow("rpc down");
});
