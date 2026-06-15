/**
 * Launchpad contract addresses and minimal ABIs.
 * Once @medialane/sdk exports these, import from there instead.
 */

export { DROP_FACTORY_CONTRACT, POP_FACTORY_CONTRACT } from "./constants";

export type PopEventType =
  | "Conference"
  | "Bootcamp"
  | "Workshop"
  | "Hackathon"
  | "Meetup"
  | "Course"
  | "Other";

/** Minimal ABI for create_drop on the Drop Factory contract */
export const DropFactoryABI = [
  {
    type: "struct",
    name: "launchpad::types::ClaimConditions",
    members: [
      { name: "start_time", type: "core::integer::u64" },
      { name: "end_time", type: "core::integer::u64" },
      { name: "price", type: "core::integer::u256" },
      { name: "payment_token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "max_quantity_per_wallet", type: "core::integer::u256" },
    ],
  },
  {
    type: "function",
    name: "create_drop",
    inputs: [
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "symbol", type: "core::byte_array::ByteArray" },
      { name: "base_uri", type: "core::byte_array::ByteArray" },
      { name: "max_supply", type: "core::integer::u256" },
      { name: "claim_conditions", type: "launchpad::types::ClaimConditions" },
    ],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "external",
  },
] as const;

/** Minimal ABI for create_collection on the POP Factory contract */
export const POPFactoryABI = [
  {
    type: "enum",
    name: "launchpad::pop::EventType",
    variants: [
      { name: "Conference", type: "()" },
      { name: "Bootcamp", type: "()" },
      { name: "Workshop", type: "()" },
      { name: "Hackathon", type: "()" },
      { name: "Meetup", type: "()" },
      { name: "Course", type: "()" },
      { name: "Other", type: "()" },
    ],
  },
  {
    type: "function",
    name: "create_collection",
    inputs: [
      { name: "name", type: "core::byte_array::ByteArray" },
      { name: "symbol", type: "core::byte_array::ByteArray" },
      { name: "base_uri", type: "core::byte_array::ByteArray" },
      { name: "claim_end_time", type: "core::integer::u64" },
      { name: "event_type", type: "launchpad::pop::EventType" },
    ],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "external",
  },
] as const;

/**
 * Minimal read ABI for DropCollection view calls (verified against the deployed class
 * 0x00092e72… on 2026-06-15). Used by use-drops to read live state from chain instead of
 * the fragile backend conditions mirror. Includes the ClaimConditions struct so starknet.js
 * can decode get_claim_conditions().
 */
export const DropCollectionReadABI = [
  {
    type: "struct",
    name: "launchpad::types::ClaimConditions",
    members: [
      { name: "start_time", type: "core::integer::u64" },
      { name: "end_time", type: "core::integer::u64" },
      { name: "price", type: "core::integer::u256" },
      { name: "payment_token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "max_quantity_per_wallet", type: "core::integer::u256" },
    ],
  },
  {
    type: "function",
    name: "get_claim_conditions",
    inputs: [],
    outputs: [{ type: "launchpad::types::ClaimConditions" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "total_minted",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_max_supply",
    inputs: [],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "is_allowlist_enabled",
    inputs: [],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "is_paused",
    inputs: [],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "minted_by_wallet",
    inputs: [{ name: "wallet", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
] as const;
