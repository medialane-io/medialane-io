"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { getMedialaneClient } from "@/lib/medialane-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Step = "input" | "verifying" | "success" | "manual" | "pending";

function StepIndicator({ step }: { step: Step }) {
  const atStep2 = step === "manual" || step === "pending";
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
          !atStep2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>1</div>
        <span className={cn("text-sm", !atStep2 ? "text-foreground font-medium" : "text-muted-foreground")}>
          Verify ownership
        </span>
      </div>
      <div className="w-8 h-px bg-border shrink-0" />
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
          atStep2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>2</div>
        <span className={cn("text-sm", atStep2 ? "text-foreground font-medium" : "text-muted-foreground")}>
          Confirm claim
        </span>
      </div>
    </div>
  );
}

export default function ClaimCollectionPage() {
  const { getToken } = useAuth();
  const { walletAddress } = useSessionKey();
  const [contractAddress, setContractAddress] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [verifyError, setVerifyError] = useState("");
  const [claimedCollection, setClaimedCollection] = useState<{ contractAddress: string; name?: string | null } | null>(null);

  async function handleAutoClaim() {
    if (!contractAddress.trim() || !walletAddress) {
      toast.error("Connect your wallet first");
      return;
    }
    setStep("verifying");
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const result = await getMedialaneClient().api.claimCollection(contractAddress.trim(), walletAddress, token);
      if (result.verified) {
        setClaimedCollection(result.collection ?? { contractAddress: contractAddress.trim() });
        setStep("success");
      } else {
        setVerifyError(result.reason ?? "Could not verify onchain ownership");
        setStep("manual");
      }
    } catch {
      setVerifyError("Verification failed");
      setStep("manual");
    }
  }

  async function handleManualRequest() {
    if (!email.trim()) { toast.error("Email is required"); return; }
    try {
      await getMedialaneClient().api.requestCollectionClaim({
        contractAddress: contractAddress.trim(),
        walletAddress: walletAddress ?? undefined,
        email: email.trim(),
        notes: notes.trim() || undefined,
      });
      setStep("pending");
    } catch {
      toast.error("Failed to submit request");
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold">Claim a Collection</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import an existing Starknet ERC-721 collection into your Medialane profile.
        </p>
      </div>

      <StepIndicator step={step} />

      {/* Success state */}
      {step === "success" && (
        <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-5 space-y-4">
          <div>
            <p className="font-semibold text-foreground">Collection claimed successfully</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your collection is verified and added to your portfolio.
            </p>
          </div>
          {claimedCollection && (
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-sm font-medium">{claimedCollection.name ?? "Collection"}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                {claimedCollection.contractAddress}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button asChild size="sm">
              <Link href="/portfolio/collections">View in Portfolio</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setContractAddress(""); setClaimedCollection(null); setStep("input"); }}
            >
              Claim Another
            </Button>
          </div>
        </div>
      )}

      {/* Pending state */}
      {step === "pending" && (
        <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-2">
          <p className="font-semibold text-foreground">Claim under review</p>
          <p className="text-sm text-muted-foreground">
            Our team will verify ownership within 24–48 hours. You&apos;ll be notified at {email} once processed.
          </p>
        </div>
      )}

      {/* Step 1: Input + verifying */}
      {(step === "input" || step === "verifying") && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contract">Contract address</Label>
            <Input
              id="contract"
              placeholder="0x…"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              disabled={step === "verifying"}
            />
            <p className="text-xs text-muted-foreground">
              Paste the Starknet ERC-721 contract address you own.
            </p>
          </div>
          <Button
            onClick={handleAutoClaim}
            disabled={step === "verifying" || !contractAddress.trim()}
            className="w-full"
          >
            {step === "verifying"
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying…</>
              : "Verify & Claim"
            }
          </Button>
        </div>
      )}

      {/* Step 2: Manual review */}
      {step === "manual" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1">
            <p className="text-sm font-medium text-foreground">Manual verification required</p>
            <p className="text-xs text-muted-foreground">
              {verifyError}. Submit a request for our team to review.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Your email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Tell us about your connection to this collection</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. I deployed this contract on Starknet mainnet…"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleManualRequest} className="flex-1">Submit Request</Button>
              <Button variant="outline" onClick={() => setStep("input")}>Back</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
