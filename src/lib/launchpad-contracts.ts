/**
 * Launchpad contract addresses and minimal ABIs.
 * Once @medialane/sdk exports these, import from there instead.
 */

export const DROP_FACTORY_CONTRACT =
  (process.env.NEXT_PUBLIC_DROP_FACTORY_CONTRACT as `0x${string}`) ||
  ("0x03587f42e29daee1b193f6cf83bf8627908ed6632d0d83fcb26225c50547d800" as `0x${string}`);

export const POP_FACTORY_CONTRACT =
  (process.env.NEXT_PUBLIC_POP_FACTORY_CONTRACT as `0x${string}`) ||
  ("0x00b32c34b427d8f346b5843ada6a37bd3368d879fc752cd52b68a87287f60111" as `0x${string}`);

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
