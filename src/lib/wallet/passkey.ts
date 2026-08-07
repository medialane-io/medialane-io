import { ec, num } from "starknet";
import { computeWalletAddress } from "./account";

const RP_NAME = "Medialane";

const enc = (s: string): Uint8Array<ArrayBuffer> => {
  const src = new TextEncoder().encode(s);
  const out = new Uint8Array(new ArrayBuffer(src.byteLength));
  out.set(src);
  return out;
};
const rand = (n: number): Uint8Array<ArrayBuffer> => {
  const out = new Uint8Array(new ArrayBuffer(n));
  crypto.getRandomValues(out);
  return out;
};
const unb64 = (s: string): Uint8Array<ArrayBuffer> => {
  const bin = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
const b64 = (buf: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)));

const PRF_SALT = enc("medialane://io/owner-key/v1");
const HKDF_INFO = enc("medialane-io-owner-key");

/** Thrown when the user dismisses/cancels the passkey prompt, or it times out. Not a bug — expected user action. */
export class PasskeyCancelledError extends Error {
  constructor() {
    super("Passkey confirmation was cancelled.");
    this.name = "PasskeyCancelledError";
  }
}

function isPasskeyCancellation(e: unknown): boolean {
  return e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "AbortError");
}

export interface SealedOwner {
  credentialId: string;
  ownerPubKey: string;
  address: string;
  iv: string;
  ciphertext: string;
}

function assertBrowser(): void {
  if (typeof window === "undefined" || !window.crypto?.subtle || !navigator.credentials) {
    throw new Error("Passkey signer requires a browser secure context (WebAuthn + WebCrypto).");
  }
}

interface Registration {
  credentialId: string;
  prfFirst: ArrayBuffer | null;
}

async function registerPasskey(): Promise<Registration> {
  let cred: PublicKeyCredential;
  try {
    cred = (await navigator.credentials.create({
      publicKey: {
        challenge: rand(32),
        rp: { name: RP_NAME, id: location.hostname },
        user: { id: rand(16), name: "creator@medialane", displayName: "Medialane Creator" },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "required",
          authenticatorAttachment: "platform",
        },
        extensions: { prf: { eval: { first: PRF_SALT } } } as AuthenticationExtensionsClientInputs,
      },
    })) as PublicKeyCredential;
  } catch (e) {
    if (isPasskeyCancellation(e)) throw new PasskeyCancelledError();
    throw e;
  }
  const prf = (cred.getClientExtensionResults() as {
    prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } };
  }).prf;
  return { credentialId: b64(cred.rawId), prfFirst: prf?.results?.first ?? null };
}

function prfUnsupportedMessage(): string {
  const isBrave = typeof navigator !== "undefined" && "brave" in navigator;
  const cause = isBrave
    ? "Brave doesn't currently support the WebAuthn PRF extension."
    : "This browser didn't return a passkey PRF secret.";
  return (
    `${cause} Medialane needs it to seal your key. Your device passkey (Touch ID) is fine, ` +
    "the limitation is the browser. Please open this in Safari or Chrome on an up-to-date OS."
  );
}

async function prfSecret(credentialId: string): Promise<Uint8Array<ArrayBuffer>> {
  let assertion: PublicKeyCredential;
  try {
    assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: rand(32),
        rpId: location.hostname,
        allowCredentials: [{ type: "public-key", id: unb64(credentialId) }],
        userVerification: "required",
        extensions: { prf: { eval: { first: PRF_SALT } } } as AuthenticationExtensionsClientInputs,
      },
    })) as PublicKeyCredential;
  } catch (e) {
    if (isPasskeyCancellation(e)) throw new PasskeyCancelledError();
    throw e;
  }
  const result = (assertion.getClientExtensionResults() as { prf?: { results?: { first?: ArrayBuffer } } })
    .prf?.results?.first;
  if (!result) throw new Error("Passkey PRF unavailable on this device/browser.");
  return new Uint8Array(result);
}

async function aesKeyFrom(secret: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const hkdf = await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(new ArrayBuffer(0)), info: HKDF_INFO },
    hkdf,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export interface CreatedOwner {
  sealed: SealedOwner;
  /**
   * Plaintext private key — in-memory only, never persisted anywhere.
   * The WebAuthn create() ceremony that just ran already produced the PRF
   * secret used to derive this key; returning it lets the very first
   * sign-in (moments later, same page load) skip a second, redundant
   * WebAuthn ceremony to re-derive the same secret. Any later sign-in
   * (a resumed SealedOwner loaded from storage) still goes through
   * unlockOwnerKey/signWith as normal — the plaintext key was never saved.
   */
  privateKeyHex: string;
}

export async function createOwnerKey(): Promise<CreatedOwner> {
  assertBrowser();
  const reg = await registerPasskey();

  let secret: Uint8Array<ArrayBuffer>;
  if (reg.prfFirst) {
    secret = new Uint8Array(reg.prfFirst);
  } else {
    try {
      secret = await prfSecret(reg.credentialId);
    } catch {
      throw new Error(prfUnsupportedMessage());
    }
  }

  const credentialId = reg.credentialId;
  const priv =
    "0x" +
    Array.from(ec.starkCurve.utils.randomPrivateKey())
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const ownerPubKey = ec.starkCurve.getStarkKey(priv);
  const aes = await aesKeyFrom(secret);
  const iv = rand(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aes,
    enc(priv),
  );
  return {
    sealed: {
      credentialId,
      ownerPubKey,
      address: computeWalletAddress(ownerPubKey, 0),
      iv: b64(iv),
      ciphertext: b64(ciphertext),
    },
    privateKeyHex: priv,
  };
}

export async function unlockOwnerKey(sealed: SealedOwner): Promise<string> {
  assertBrowser();
  const secret = await prfSecret(sealed.credentialId);
  const aes = await aesKeyFrom(secret);
  const privBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(sealed.iv) },
    aes,
    unb64(sealed.ciphertext),
  );
  return new TextDecoder().decode(privBuf);
}

export async function signWith(sealed: SealedOwner, msgHash: string): Promise<[string, string]> {
  const priv = await unlockOwnerKey(sealed);
  return signWithPrivateKey(priv, msgHash);
}

/** Signs directly with an already-known plaintext private key — no WebAuthn
 *  ceremony. Used for the first sign-in right after createOwnerKey(), whose
 *  plaintext key is already in memory (see CreatedOwner). */
export function signWithPrivateKey(privateKeyHex: string, msgHash: string): [string, string] {
  const sig = ec.starkCurve.sign(msgHash, privateKeyHex);
  return [num.toHex(sig.r), num.toHex(sig.s)];
}

export async function passkeySupported(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}
