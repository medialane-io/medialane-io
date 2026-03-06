import {
  type AccountInterface,
  type Abi,
  Contract,
  RpcProvider,
  cairo,
  byteArray,
  num,
  shortString,
  constants,
  type TypedData,
} from "starknet";
import { IPMarketplaceABI } from "../abis";
import type { ResolvedConfig } from "../config";
import { SUPPORTED_TOKENS, DEFAULT_CURRENCY } from "../constants";
import type {
  CreateListingParams,
  MakeOfferParams,
  FulfillOrderParams,
  CancelOrderParams,
  CartItem,
  MintParams,
  CreateCollectionParams,
  TxResult,
} from "../types/marketplace";
import { stringifyBigInts } from "../utils/bigint";
import { parseAmount } from "../utils/token";
import {
  buildOrderTypedData,
  buildFulfillmentTypedData,
  buildCancellationTypedData,
} from "./signing";

export class MedialaneError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "MedialaneError";
  }
}

function toSignatureArray(sig: unknown): string[] {
  if (Array.isArray(sig)) return sig as string[];
  const s = sig as { r: bigint | string; s: bigint | string };
  return [s.r.toString(), s.s.toString()];
}

function getChainId(config: ResolvedConfig): constants.StarknetChainId {
  return config.network === "mainnet"
    ? constants.StarknetChainId.SN_MAIN
    : constants.StarknetChainId.SN_SEPOLIA;
}

const _contractCache = new WeakMap<ResolvedConfig, { contract: Contract; provider: RpcProvider }>();
const _providerCache = new WeakMap<ResolvedConfig, RpcProvider>();

function getProvider(config: ResolvedConfig): RpcProvider {
  let provider = _providerCache.get(config);
  if (!provider) {
    provider = new RpcProvider({ nodeUrl: config.rpcUrl });
    _providerCache.set(config, provider);
  }
  return provider;
}

function makeContract(config: ResolvedConfig): { contract: Contract; provider: RpcProvider } {
  const cached = _contractCache.get(config);
  if (cached) return cached;

  const provider = getProvider(config);
  const contract = new Contract(
    IPMarketplaceABI as unknown as Abi,
    config.marketplaceContract,
    provider
  );
  const result = { contract, provider };
  _contractCache.set(config, result);
  return result;
}

function resolveToken(currency: string) {
  const token = SUPPORTED_TOKENS.find(
    (t) => t.symbol === currency.toUpperCase() || t.address.toLowerCase() === currency.toLowerCase()
  );
  if (!token) throw new MedialaneError(`Unsupported currency: ${currency}`);
  return token;
}


/**
 * Create a listing — offerer offers ERC721, asks for ERC20.
 */
export async function createListing(
  account: AccountInterface,
  params: CreateListingParams,
  config: ResolvedConfig
): Promise<TxResult> {
  const { nftContract, tokenId, price, currency = DEFAULT_CURRENCY, durationSeconds } = params;
  const { contract, provider } = makeContract(config);

  const token = resolveToken(currency);
  const priceWei = parseAmount(price, token.decimals);

  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 300;
  const endTime = now + durationSeconds;
  const saltBytes = new Uint8Array(4);
  crypto.getRandomValues(saltBytes);
  const salt = new DataView(saltBytes.buffer).getUint32(0).toString();

  const currentNonce = await contract.nonces(account.address);

  const orderParams = {
    offerer: account.address,
    offer: {
      item_type: "ERC721",
      token: nftContract,
      identifier_or_criteria: tokenId,
      start_amount: "1",
      end_amount: "1",
    },
    consideration: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      start_amount: priceWei,
      end_amount: priceWei,
      recipient: account.address,
    },
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    salt,
    nonce: currentNonce.toString(),
  };

  const chainId = getChainId(config);
  const typedData = stringifyBigInts(buildOrderTypedData(orderParams, chainId)) as TypedData;

  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);

  const registerPayload = stringifyBigInts({
    parameters: {
      ...orderParams,
      offer: {
        ...orderParams.offer,
        item_type: shortString.encodeShortString(orderParams.offer.item_type),
      },
      consideration: {
        ...orderParams.consideration,
        item_type: shortString.encodeShortString(orderParams.consideration.item_type),
      },
    },
    signature: signatureArray,
  }) as Record<string, unknown>;

  const tokenIdUint256 = cairo.uint256(tokenId);

  // Check approval status before adding approve call
  let isAlreadyApproved = false;
  try {
    const result = await provider.callContract({
      contractAddress: nftContract,
      entrypoint: "get_approved",
      calldata: [tokenIdUint256.low.toString(), tokenIdUint256.high.toString()],
    });
    isAlreadyApproved =
      BigInt(result[0]).toString() === BigInt(config.marketplaceContract).toString();
  } catch {
    // Cannot check — include approve to be safe
  }

  const registerCall = contract.populate("register_order", [registerPayload]);
  const calls = isAlreadyApproved
    ? [registerCall]
    : [
        {
          contractAddress: nftContract,
          entrypoint: "approve",
          calldata: [
            config.marketplaceContract,
            tokenIdUint256.low.toString(),
            tokenIdUint256.high.toString(),
          ],
        },
        registerCall,
      ];

  try {
    const tx = await account.execute(calls);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to create listing", err);
  }
}

/**
 * Make an offer — offerer offers ERC20, asks for ERC721.
 */
export async function makeOffer(
  account: AccountInterface,
  params: MakeOfferParams,
  config: ResolvedConfig
): Promise<TxResult> {
  const { nftContract, tokenId, price, currency = DEFAULT_CURRENCY, durationSeconds } = params;
  const { contract, provider } = makeContract(config);

  const token = resolveToken(currency);
  const priceWei = parseAmount(price, token.decimals);

  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 300;
  const endTime = now + durationSeconds;
  const saltBytes = new Uint8Array(4);
  crypto.getRandomValues(saltBytes);
  const salt = new DataView(saltBytes.buffer).getUint32(0).toString();

  const currentNonce = await contract.nonces(account.address);

  const orderParams = {
    offerer: account.address,
    offer: {
      item_type: "ERC20",
      token: token.address,
      identifier_or_criteria: "0",
      start_amount: priceWei,
      end_amount: priceWei,
    },
    consideration: {
      item_type: "ERC721",
      token: nftContract,
      identifier_or_criteria: tokenId,
      start_amount: "1",
      end_amount: "1",
      recipient: account.address,
    },
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    salt,
    nonce: currentNonce.toString(),
  };

  const chainId = getChainId(config);
  const typedData = stringifyBigInts(buildOrderTypedData(orderParams, chainId)) as TypedData;

  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);

  const registerPayload = stringifyBigInts({
    parameters: {
      ...orderParams,
      offer: {
        ...orderParams.offer,
        item_type: shortString.encodeShortString(orderParams.offer.item_type),
      },
      consideration: {
        ...orderParams.consideration,
        item_type: shortString.encodeShortString(orderParams.consideration.item_type),
      },
    },
    signature: signatureArray,
  }) as Record<string, unknown>;

  const amountUint256 = cairo.uint256(priceWei);
  const approveCall = {
    contractAddress: token.address,
    entrypoint: "approve",
    calldata: [
      config.marketplaceContract,
      amountUint256.low.toString(),
      amountUint256.high.toString(),
    ],
  };

  const registerCall = contract.populate("register_order", [registerPayload]);

  try {
    const tx = await account.execute([approveCall, registerCall]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to make offer", err);
  }
}

/**
 * Fulfill (buy) a single order.
 */
export async function fulfillOrder(
  account: AccountInterface,
  params: FulfillOrderParams,
  config: ResolvedConfig
): Promise<TxResult> {
  const { orderHash } = params;
  const { contract, provider } = makeContract(config);

  const currentNonce = await contract.nonces(account.address);
  const chainId = getChainId(config);

  const fulfillmentParams = {
    order_hash: orderHash,
    fulfiller: account.address,
    nonce: currentNonce.toString(),
  };

  const typedData = stringifyBigInts(
    buildFulfillmentTypedData(fulfillmentParams, chainId)
  ) as TypedData;

  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);

  const fulfillPayload = stringifyBigInts({
    fulfillment: fulfillmentParams,
    signature: signatureArray,
  }) as Record<string, unknown>;

  const call = contract.populate("fulfill_order", [fulfillPayload]);

  try {
    const tx = await account.execute(call);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to fulfill order", err);
  }
}

/**
 * Cancel an order.
 */
export async function cancelOrder(
  account: AccountInterface,
  params: CancelOrderParams,
  config: ResolvedConfig
): Promise<TxResult> {
  const { orderHash } = params;
  const { contract, provider } = makeContract(config);

  const currentNonce = await contract.nonces(account.address);
  const chainId = getChainId(config);

  const cancelParams = {
    order_hash: orderHash,
    offerer: account.address,
    nonce: currentNonce.toString(),
  };

  const typedData = stringifyBigInts(
    buildCancellationTypedData(cancelParams, chainId)
  ) as TypedData;

  const signature = await account.signMessage(typedData);
  const signatureArray = toSignatureArray(signature);

  const cancelRequest = stringifyBigInts({
    cancelation: cancelParams,
    signature: signatureArray,
  }) as Record<string, unknown>;

  const call = contract.populate("cancel_order", [cancelRequest]);

  try {
    const tx = await account.execute(call);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to cancel order", err);
  }
}

/** Serialize a string as Cairo ByteArray calldata felts. */
function encodeByteArray(str: string): string[] {
  const ba = byteArray.byteArrayFromString(str);
  return [
    ba.data.length.toString(),
    ...ba.data.map((d) => num.toHex(d)),
    num.toHex(ba.pending_word),
    ba.pending_word_len.toString(),
  ];
}

/**
 * Mint an NFT into a Medialane collection.
 * Calls `mint(collection_id, recipient, token_uri)` — no SNIP-12 signing required.
 */
export async function mint(
  account: AccountInterface,
  params: MintParams,
  config: ResolvedConfig
): Promise<TxResult> {
  const { collectionId, recipient, tokenUri, collectionContract } = params;
  const provider = getProvider(config);
  const contractAddress = collectionContract ?? config.collectionContract;

  const id = cairo.uint256(collectionId);
  const calldata = [id.low.toString(), id.high.toString(), recipient, ...encodeByteArray(tokenUri)];

  try {
    const tx = await account.execute([{ contractAddress, entrypoint: "mint", calldata }]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to mint NFT", err);
  }
}

/**
 * Create a new collection on the Medialane collection registry.
 * Calls `create_collection(name, symbol, base_uri)` — no SNIP-12 signing required.
 * Returns the transaction hash; listen for the CollectionCreated event to get the collection_id.
 */
export async function createCollection(
  account: AccountInterface,
  params: CreateCollectionParams,
  config: ResolvedConfig
): Promise<TxResult> {
  const { name, symbol, baseUri, collectionContract } = params;
  const provider = getProvider(config);
  const contractAddress = collectionContract ?? config.collectionContract;

  const calldata = [
    ...encodeByteArray(name),
    ...encodeByteArray(symbol),
    ...encodeByteArray(baseUri),
  ];

  try {
    const tx = await account.execute([{ contractAddress, entrypoint: "create_collection", calldata }]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Failed to create collection", err);
  }
}

/**
 * Checkout a cart of multiple orders in a single atomic multicall.
 * Prompts wallet signatures sequentially (one per item), then executes
 * all approve + fulfill calls atomically.
 */
export async function checkoutCart(
  account: AccountInterface,
  items: CartItem[],
  config: ResolvedConfig
): Promise<TxResult> {
  if (items.length === 0) throw new MedialaneError("Cart is empty");

  const { contract, provider } = makeContract(config);

  // Group total ERC20 approval amounts by token
  const tokenTotals = new Map<string, bigint>();
  for (const item of items) {
    const prev = tokenTotals.get(item.considerationToken) ?? 0n;
    tokenTotals.set(item.considerationToken, prev + BigInt(item.considerationAmount));
  }

  const approveCalls = Array.from(tokenTotals.entries()).map(([tokenAddr, totalWei]) => {
    const amount = cairo.uint256(totalWei.toString());
    return {
      contractAddress: tokenAddr,
      entrypoint: "approve",
      calldata: [
        config.marketplaceContract,
        amount.low.toString(),
        amount.high.toString(),
      ],
    };
  });

  const currentNonce = await contract.nonces(account.address);
  const baseNonce = BigInt(currentNonce.toString());
  const chainId = getChainId(config);

  const fulfillCalls = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const nonce = (baseNonce + BigInt(i)).toString();

    const fulfillmentParams = {
      order_hash: item.orderHash,
      fulfiller: account.address,
      nonce,
    };

    const typedData = stringifyBigInts(
      buildFulfillmentTypedData(fulfillmentParams, chainId)
    ) as TypedData;

    const signature = await account.signMessage(typedData);
    const signatureArray = toSignatureArray(signature);

    const fulfillPayload = stringifyBigInts({
      fulfillment: fulfillmentParams,
      signature: signatureArray,
    }) as Record<string, unknown>;

    fulfillCalls.push(contract.populate("fulfill_order", [fulfillPayload]));
  }

  try {
    const tx = await account.execute([...approveCalls, ...fulfillCalls]);
    await provider.waitForTransaction(tx.transaction_hash);
    return { txHash: tx.transaction_hash };
  } catch (err) {
    throw new MedialaneError("Cart checkout failed", err);
  }
}
