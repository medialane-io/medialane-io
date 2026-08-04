// Re-export shim — canonical source lives in @medialane/sdk/starknet (bytearray.ts)
// and @medialane/sdk (bigint.ts).
export { encodeByteArray as serializeByteArray } from "@medialane/sdk/starknet";
export { encodeU256 } from "@medialane/sdk";
