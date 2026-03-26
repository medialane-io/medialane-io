import CryptoES from "crypto-es";
import type { WalletData } from "@chipi-stack/types";

export async function migratePinWalletToPasskey(params: {
  wallet: WalletData;
  userId: string;
  oldEncryptKey: string;
  getBearerToken: () => Promise<string | null>;
  setupPasskey: (userName: string, userId: string) => Promise<{ encryptKey: string }>;
  updateWalletEncryptionAsync: (args: {
    externalUserId: string;
    publicKey: string;
    newEncryptedPrivateKey: string;
    bearerToken: string;
  }) => Promise<unknown>;
}) {
  const {
    wallet,
    userId,
    oldEncryptKey,
    getBearerToken,
    setupPasskey,
    updateWalletEncryptionAsync,
  } = params;

  const bearerToken = await getBearerToken();
  if (!bearerToken) throw new Error("Not authenticated. Please sign in again.");

  const decryptedPkBytes = CryptoES.AES.decrypt(wallet.encryptedPrivateKey, oldEncryptKey);
  const decryptedPrivateKey = decryptedPkBytes.toString(CryptoES.enc.Utf8);
  if (!decryptedPrivateKey) {
    throw new Error("Incorrect PIN. Please try again.");
  }

  const passkeyData = await setupPasskey(userId, userId);
  const newEncryptedPrivateKey = CryptoES.AES.encrypt(
    decryptedPrivateKey,
    passkeyData.encryptKey
  ).toString();

  await updateWalletEncryptionAsync({
    externalUserId: userId,
    publicKey: wallet.publicKey,
    newEncryptedPrivateKey,
    bearerToken,
  });
}

