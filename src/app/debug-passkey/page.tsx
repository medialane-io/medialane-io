"use client";

import { useState } from "react";
import { Button } from "@medialane/ui/button";
import { relyingPartyId } from "@/lib/wallet/client";

type Variant = "as the app does today" | "any passkey store";

const SALT = new TextEncoder().encode("medialane://io/owner-key/v1");

const rand = (n: number): Uint8Array<ArrayBuffer> => crypto.getRandomValues(new Uint8Array(n));

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

const uuid = (bytes: Uint8Array) => {
  const h = hex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const failure = (err: unknown) => ({
  name: err instanceof Error ? err.name : typeof err,
  message: err instanceof Error ? err.message : String(err),
});

const prfShape = (results: unknown) => {
  const prf = (results as { prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } } }).prf;
  if (!prf) return { present: false };
  return { present: true, enabled: prf.enabled ?? null, secretBytes: prf.results?.first?.byteLength ?? null };
};

async function probe(variant: Variant) {
  const rpId = relyingPartyId(location.hostname);
  const capabilities = PublicKeyCredential as unknown as {
    getClientCapabilities?: () => Promise<Record<string, boolean>>;
    signalUnknownCredential?: (options: { rpId: string; credentialId: string }) => Promise<void>;
  };
  const report: Record<string, unknown> = {
    variant,
    at: new Date().toISOString(),
    userAgent: navigator.userAgent,
    host: location.hostname,
    rpId,
    secureContext: window.isSecureContext,
    clientCapabilities: await (capabilities.getClientCapabilities?.() ?? Promise.resolve(null)).catch(failure),
    platformAuthenticatorAvailable: await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(failure),
  };

  let credentialId: Uint8Array<ArrayBuffer> | null = null;
  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: rand(32),
        rp: { name: "Medialane", id: rpId },
        user: { id: rand(16), name: "passkey-debug", displayName: "passkey-debug" },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "required",
          ...(variant === "as the app does today" ? { authenticatorAttachment: "platform" } : {}),
        },
        extensions: { prf: { eval: { first: SALT } } } as AuthenticationExtensionsClientInputs,
      },
    })) as PublicKeyCredential;
    const response = credential.response as AuthenticatorAttestationResponse;
    const authData = new Uint8Array(response.getAuthenticatorData());
    credentialId = new Uint8Array(credential.rawId);
    report.create = {
      authenticatorAttachment: credential.authenticatorAttachment,
      transports: response.getTransports?.() ?? null,
      aaguid: authData.length >= 53 ? uuid(authData.slice(37, 53)) : null,
      prf: prfShape(credential.getClientExtensionResults()),
    };
  } catch (err) {
    report.create = { failed: failure(err) };
  }

  if (credentialId) {
    try {
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: rand(32),
          rpId,
          allowCredentials: [{ type: "public-key", id: credentialId }],
          userVerification: "required",
          extensions: { prf: { eval: { first: SALT } } } as AuthenticationExtensionsClientInputs,
        },
      })) as PublicKeyCredential;
      report.get = { prf: prfShape(assertion.getClientExtensionResults()) };
    } catch (err) {
      report.get = { failed: failure(err) };
    }
    report.removed = await (capabilities.signalUnknownCredential?.({ rpId, credentialId: base64url(credentialId) }) ??
      Promise.reject(new Error("signalUnknownCredential is not available")))
      .then(() => true)
      .catch(() => false);
  }

  return report;
}

export default function DebugPasskeyPage() {
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = async (variant: Variant) => {
    setRunning(true);
    setCopied(false);
    const text = JSON.stringify(await probe(variant), null, 2);
    console.log("[passkey-debug]", text);
    setOutput(text);
    setRunning(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-10">
      <h1 className="text-xl font-semibold">Passkey check</h1>
      <p className="text-sm text-muted-foreground">
        Each button creates a test passkey, reads it back, and prints what the browser returned. Run both and send the
        output.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={running} onClick={() => run("as the app does today")}>
          Check as the app does today
        </Button>
        <Button disabled={running} variant="outline" onClick={() => run("any passkey store")}>
          Check with any passkey store
        </Button>
      </div>
      {output ? (
        <div className="space-y-2">
          <textarea readOnly value={output} className="h-96 w-full rounded-md border bg-background p-3 font-mono text-xs" />
          <Button variant="outline" onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
