export async function resolveEncryptKey(params: {
  authMethod: "pin" | "passkey";
  pin: string;
  passkeySupported: boolean;
  cachedEncryptKey: string | null | undefined;
  authenticate: () => Promise<string | null | undefined>;
}): Promise<string> {
  const { authMethod, pin, passkeySupported, cachedEncryptKey, authenticate } = params;
  if (authMethod === "pin") {
    if (!pin) throw new Error("Enter your PIN to transfer.");
    return pin;
  }
  if (!passkeySupported) {
    throw new Error("Passkey is not supported on this device.");
  }
  if (cachedEncryptKey) return cachedEncryptKey;
  const derived = await authenticate();
  if (!derived) throw new Error("Passkey authentication failed.");
  return derived;
}

