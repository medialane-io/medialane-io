import { test, expect } from "bun:test";
import {
  buildSetFirstGuardianCall,
  buildTriggerEscapeOwnerCall,
  buildCompleteEscapeOwnerCall,
  buildCancelEscapeCall,
  decodeGuardiansInfo,
  decodeEscapeAndStatus,
} from "./guardian";
import { norm } from "./account-ops";

const PUBKEY = "0x61cc05c5da6e9b1403a27ffa564498cd2b8cda1428b053b08dbbd1cceb744c6";
const PUBKEY_DECIMAL = BigInt(PUBKEY).toString();

test("buildSetFirstGuardianCall: change_guardians([], [Signer::Starknet(pubkey)])", () => {
  const call = buildSetFirstGuardianCall("0xfeed", PUBKEY);
  expect(call.contractAddress).toBe(norm("0xfeed"));
  expect(call.entrypoint).toBe("change_guardians");
  expect((call.calldata as string[]).map((f) => BigInt(f).toString())).toEqual([
    "0", "1", "0", PUBKEY_DECIMAL,
  ]);
});

test("buildTriggerEscapeOwnerCall: trigger_escape_owner(Signer::Starknet(pubkey))", () => {
  const call = buildTriggerEscapeOwnerCall("0xdead", PUBKEY);
  expect(call.contractAddress).toBe(norm("0xdead"));
  expect(call.entrypoint).toBe("trigger_escape_owner");
});

test("buildCompleteEscapeOwnerCall: escape_owner(), no calldata", () => {
  const call = buildCompleteEscapeOwnerCall("0xbeef");
  expect(call.entrypoint).toBe("escape_owner");
  expect(call.calldata).toEqual([]);
});

test("buildCancelEscapeCall: cancel_escape(), no calldata", () => {
  const call = buildCancelEscapeCall("0xc0de");
  expect(call.entrypoint).toBe("cancel_escape");
  expect(call.calldata).toEqual([]);
});

test("decodeGuardiansInfo: empty set", () => {
  expect(decodeGuardiansInfo(["0x0"])).toEqual([]);
});

test("decodeGuardiansInfo: one Starknet-type guardian", () => {
  const guid = "0x123";
  expect(decodeGuardiansInfo(["0x1", "0x0", guid, PUBKEY])).toEqual([
    { type: "Starknet", guid, storedValue: PUBKEY },
  ]);
});

test("decodeEscapeAndStatus: no escape in progress", () => {
  expect(decodeEscapeAndStatus(["0x0", "0x0", "0x1", "0x0"])).toEqual({
    readyAt: 0, escapeType: "None", status: "None",
  });
});
