"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { getMedialaneClient } from "@/lib/medialane-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

type Step = "input" | "verifying" | "success" | "manual" | "pending";

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
        setVerifyError(result.reason ?? "Could not verify on-chain ownership");
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

  if (step === "success") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500 h-6 w-6" />
              <CardTitle>Collection Claimed</CardTitle>
            </div>
            <CardDescription>Your collection is verified and added to your portfolio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {claimedCollection && (
              <div className="glass rounded-lg p-4">
                <p className="font-semibold">{claimedCollection.name ?? "Collection"}</p>
                <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{claimedCollection.contractAddress}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button asChild><Link href="/portfolio/collections">View in Portfolio</Link></Button>
              <Button variant="outline" onClick={() => { setContractAddress(""); setClaimedCollection(null); setStep("input"); }}>Claim Another</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "pending") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Request Submitted</CardTitle>
            <CardDescription>Your claim is under review. We&apos;ll reach out to {email} once processed.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Claim a Collection</h1>
        <p className="text-muted-foreground mt-1">Import an existing Starknet ERC-721 collection into your Medialane profile.</p>
      </div>

      {(step === "input" || step === "verifying") && (
        <Card>
          <CardHeader>
            <CardTitle>Contract Address</CardTitle>
            <CardDescription>The Starknet ERC-721 contract address you own.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contract">Contract Address</Label>
              <Input id="contract" placeholder="0x..." value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} disabled={step === "verifying"} />
            </div>
            <Button onClick={handleAutoClaim} disabled={step === "verifying" || !contractAddress.trim()} className="w-full">
              {step === "verifying" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying&hellip;</> : "Verify & Claim"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "manual" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="text-yellow-500 h-5 w-5" />
              <CardTitle>Manual Review Required</CardTitle>
            </div>
            <CardDescription>{verifyError}. Submit a request for our team to review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Your Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Tell us about your connection to this collection</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleManualRequest} className="flex-1">Submit Request</Button>
              <Button variant="outline" onClick={() => setStep("input")}>Back</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
