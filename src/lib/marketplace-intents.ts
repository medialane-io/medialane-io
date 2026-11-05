import { UserFacingError, type FastMintSigner } from "@medialane/ui";
import { populateSignedCalls, type CreatedIntent, type MedialaneClient } from "@medialane/sdk/starknet";
import type { Call, TypedData } from "starknet";
import { SUPPORTED_TOKENS } from "@/lib/constants";
import { isErc1155Standard } from "@/lib/protocol/token-standard";

type MarketplaceSigner = FastMintSigner;

export interface MarketplaceContext {
  client: MedialaneClient;
  signer: MarketplaceSigner;
}

export interface MarketplaceResult {
  txHash: string;
  /** The order the intent created, as recorded by the backend once it confirmed the transaction. */
  orderHash: string | null;
}

export interface CreateListingInput {
  assetContract: string;
  tokenId: string;
  price: string;
  currencySymbol: string;
  durationSeconds: number;
  amount?: string;
  tokenStandard?: "ERC721" | "ERC1155" | "UNKNOWN";
}

export interface MakeOfferInput {
  assetContract: string;
  tokenId: string;
  price: string;
  currencySymbol: string;
  durationSeconds: number;
  tokenStandard?: "ERC721" | "ERC1155" | "UNKNOWN";
  quantity?: string;
}

export interface FulfillOrderInput {
  orderHash: string;
  tokenStandard?: string;
  quantity?: string;
  swap?: { id: string; calls: Call[] };
}

export interface CancelOrderInput {
  orderHash: string;
  tokenStandard?: string;
}

export interface TransferInput {
  contractAddress: string;
  tokenId: string;
  toAddress: string;
  tokenStandard?: "ERC721" | "ERC1155" | "UNKNOWN";
}

export interface MakeCounterOfferInput {
  originalOrderHash: string;
  counterPriceRaw: string;
  durationSeconds: number;
  message?: string;
}

interface RunOptions {
  before?: { id: string; calls: Call[] };
  pollIntervalMs?: number;
}

type ActionOptions = Pick<RunOptions, "pollIntervalMs">;

const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 3000;

const SYMBOL_TO_ADDRESS: Record<string, string> = Object.fromEntries(
  SUPPORTED_TOKENS.map((t) => [t.symbol, t.address])
);

function resolveCurrencyAddress(symbolOrAddress: string): string {
  if (symbolOrAddress.startsWith("0x")) return symbolOrAddress;
  const address = SYMBOL_TO_ADDRESS[symbolOrAddress.toUpperCase()];
  if (!address) throw new Error(`Unsupported currency: ${symbolOrAddress}`);
  return address;
}

function toApiStandard(standard?: string): "ERC721" | "ERC1155" | undefined {
  return standard === "ERC1155" || standard === "ERC721" ? standard : undefined;
}

function sanitizeTypedData(value: unknown): unknown {
  if (typeof value === "string") return SYMBOL_TO_ADDRESS[value.toUpperCase()] ?? value;
  if (Array.isArray(value)) return value.map(sanitizeTypedData);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitizeTypedData(v)])
    );
  }
  return value;
}

interface SettledIntent {
  status: "CONFIRMED" | "FAILED";
  orderHash?: string | null;
}

async function pollUntilTerminal(client: MedialaneClient, id: string, intervalMs: number): Promise<SettledIntent> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    if (i > 0) await new Promise<void>((r) => setTimeout(r, intervalMs));
    const intent = (await client.api.intents.get(id)) as unknown as { status?: unknown; orderHash?: string | null };
    if (intent.status === "CONFIRMED" || intent.status === "FAILED") return intent as SettledIntent;
  }
  throw new Error("Verification timed out. Check your account for the transaction status.");
}

/** Creates an intent, signs it if needed, executes it, confirms it and waits until the backend settles it. */
export async function runMarketplaceIntent(
  { client, signer }: MarketplaceContext,
  create: () => Promise<CreatedIntent>,
  { before, pollIntervalMs = POLL_INTERVAL_MS }: RunOptions = {},
): Promise<MarketplaceResult> {
  const intent = await create();
  if (!intent?.id) throw new Error("Intent creation failed: no data returned");

  let calls: Call[];
  if (intent.requiresSignature) {
    const typedData = (intent.local ? intent.typedData : sanitizeTypedData(intent.typedData)) as TypedData;
    const sig = await signer.signTypedData(typedData);
    const signed = await client.api.intents.submitSignature(intent.id, sig);
    calls = intent.local ? populateSignedCalls(intent.local.kind, intent.local.built, sig) : (signed.calls as Call[]);
  } else {
    calls = intent.calls as Call[];
  }
  if (!calls?.length) throw new Error("No calls returned from intent");

  const intentIds = before ? [before.id, intent.id] : [intent.id];
  if (before) calls = [...before.calls, ...calls];

  const { txHash } = await signer.execute(calls, { intentIds });
  await client.api.intents.confirm(intent.id, "0x" + txHash.replace(/^0x/, "").padStart(64, "0"));

  const settled = await pollUntilTerminal(client, intent.id, pollIntervalMs);
  if (settled.status === "FAILED") {
    throw new UserFacingError(
      "Transaction was submitted but the marketplace order could not be confirmed onchain. " +
      "The order may have already been filled or expired — please refresh and try again."
    );
  }
  return { txHash, orderHash: settled.orderHash ?? null };
}

const endTimeAfter = (durationSeconds: number) => Math.floor(Date.now() / 1000) + durationSeconds;

export function createListing(ctx: MarketplaceContext, input: CreateListingInput, opts?: ActionOptions): Promise<MarketplaceResult> {
  return runMarketplaceIntent(ctx, () => ctx.client.createIntent("listing", {
    offerer: ctx.signer.address,
    nftContract: input.assetContract,
    tokenId: input.tokenId,
    currency: resolveCurrencyAddress(input.currencySymbol),
    price: input.price,
    endTime: endTimeAfter(input.durationSeconds),
    ...(isErc1155Standard(input.tokenStandard) ? { amount: input.amount || "1" } : {}),
  }), opts);
}

export function makeOffer(ctx: MarketplaceContext, input: MakeOfferInput, opts?: ActionOptions): Promise<MarketplaceResult> {
  return runMarketplaceIntent(ctx, () => ctx.client.createIntent("offer", {
    offerer: ctx.signer.address,
    nftContract: input.assetContract,
    tokenId: input.tokenId,
    currency: resolveCurrencyAddress(input.currencySymbol),
    price: input.price,
    endTime: endTimeAfter(input.durationSeconds),
    tokenStandard: toApiStandard(input.tokenStandard),
    quantity: isErc1155Standard(input.tokenStandard) ? (input.quantity || "1") : undefined,
  }), opts);
}

export function fulfillOrder(ctx: MarketplaceContext, input: FulfillOrderInput, opts?: ActionOptions): Promise<MarketplaceResult> {
  return runMarketplaceIntent(ctx, () => ctx.client.api.intents.create("fulfill", {
    fulfiller: ctx.signer.address,
    orderHash: input.orderHash,
    tokenStandard: toApiStandard(input.tokenStandard),
    quantity: input.quantity,
  }), { ...opts, before: input.swap });
}

export function cancelOrder(ctx: MarketplaceContext, input: CancelOrderInput, opts?: ActionOptions): Promise<MarketplaceResult> {
  return runMarketplaceIntent(ctx, () => ctx.client.createIntent("cancel", {
    offerer: ctx.signer.address,
    orderHash: input.orderHash,
    tokenStandard: toApiStandard(input.tokenStandard),
  }), opts);
}

export function makeCounterOffer(ctx: MarketplaceContext, input: MakeCounterOfferInput, opts?: ActionOptions): Promise<MarketplaceResult> {
  return runMarketplaceIntent(ctx, () => ctx.client.createIntent("counter-offer", {
    sellerAddress: ctx.signer.address,
    originalOrderHash: input.originalOrderHash,
    durationSeconds: input.durationSeconds,
    priceRaw: input.counterPriceRaw,
    message: input.message,
  }), opts);
}

function isStarknetAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{1,64}$/.test(value) && value.replace(/^0x0*/, "").length > 0;
}

/** Sends an NFT to another address. Transfers create no order, so there is nothing to confirm or poll. */
export async function transferNft({ client, signer }: MarketplaceContext, input: TransferInput): Promise<string> {
  if (!isStarknetAddress(input.toAddress)) throw new UserFacingError("Invalid recipient address.");
  if (!isStarknetAddress(input.contractAddress)) throw new UserFacingError("Invalid token contract address.");
  if (!input.tokenStandard) {
    throw new UserFacingError("Token standard could not be determined. Please try again or contact support.");
  }
  const intent = await client.api.intents.create("transfer-nft", {
    owner: signer.address,
    contractAddress: input.contractAddress,
    tokenId: input.tokenId,
    recipient: input.toAddress,
    tokenStandard: input.tokenStandard === "ERC1155" ? "ERC1155" : "ERC721",
  });
  const calls = (intent as { calls?: Call[] }).calls;
  if (!calls?.length) throw new Error("No calls returned from intent");
  const { txHash } = await signer.execute(calls, { intentIds: [intent.id] });
  return txHash;
}
