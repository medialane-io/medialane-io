"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { assetHref } from "@/lib/routes";
import { useToken } from "@/hooks/use-tokens";
import { useCollection } from "@/hooks/use-collections";
import { useSessionKey } from "@/hooks/use-session-key";
import { submitRemixOffer } from "@/hooks/use-remix-offers";
import { getListableTokens, getTokenBySymbol, getService } from "@medialane/sdk";
import { LICENSE_TYPES } from "@/types/ip";
import { resolveRemixPolicy, getDerivativesTerm } from "@/lib/remix-policy";
import { ipfsToHttp, checkIsOwner } from "@/lib/utils";
import { ToggleGroup, Section } from "@/components/create/create-form-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronLeft, ChevronDown, Shield, DollarSign, Percent, HandCoins, Loader2, Check } from "lucide-react";

const TOKENS = getListableTokens();

export default function CreateLicensingPage() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { walletAddress } = useSessionKey();
  const { token, isLoading: tokenLoading } = useToken(contract, tokenId);
  const { collection: parentCollection } = useCollection(contract);

  const viewerIsOwner = checkIsOwner(token, walletAddress);
  const originalName = token?.metadata?.name ?? `Token #${tokenId}`;
  const originalImage = token?.metadata?.image ? ipfsToHttp(token.metadata.image) : null;
  const originalAttributes = Array.isArray(token?.metadata?.attributes)
    ? (token!.metadata!.attributes as { trait_type?: string; value?: string }[])
    : [];

  const policy = resolveRemixPolicy({
    parentNoDerivatives: getDerivativesTerm(originalAttributes) === "Not Allowed",
    viewerIsParentOwner: viewerIsOwner,
    dealAvailable: !!getService(parentCollection?.service),
  });

  const [licenseType, setLicenseType] = useState("CC BY");
  const [commercial, setCommercial] = useState(false);
  const [derivatives, setDerivatives] = useState(true);
  const [royalty, setRoyalty] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<string>(TOKENS[0]?.symbol ?? "STRK");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLicenseChange = (value: string) => {
    setLicenseType(value);
    const preset = LICENSE_TYPES.find((l) => l.value === value);
    if (preset) {
      setCommercial(preset.commercialUse === "Yes");
      setDerivatives(preset.derivatives !== "Not Allowed");
    }
  };

  const handleSubmit = async () => {
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setError("Enter a valid license fee");
      return;
    }
    const clerkToken = await getToken();
    if (!clerkToken) { setError("Sign in required"); return; }
    setLoading(true);
    setError(null);
    try {
      const tokenInfo = getTokenBySymbol(currency);
      const decimals = tokenInfo?.decimals ?? 18;
      const rawPrice = BigInt(Math.round(parseFloat(price) * 10 ** decimals)).toString();
      await submitRemixOffer(
        {
          originalContract: contract,
          originalTokenId: tokenId,
          proposedPrice: rawPrice,
          proposedCurrency: tokenInfo?.address ?? "",
          licenseType,
          commercial,
          derivatives,
          royaltyPct: royalty ? parseInt(royalty) : undefined,
          message: message.trim() || undefined,
        },
        clerkToken,
      );
      setStep("success");
    } catch (err: unknown) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Failed to send license request");
    } finally {
      setLoading(false);
    }
  };

  if (tokenLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 pt-14 pb-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }
  if (!token) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-2xl font-bold">Asset not found</p>
        <Button asChild variant="outline"><Link href="/">Start from the frontpage</Link></Button>
      </div>
    );
  }
  // You can't license your own work; licensing needs a reachable Medialane owner.
  if (viewerIsOwner || !policy.dealAvailable) {
    router.replace(assetHref("STARKNET", contract, tokenId));
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 pt-14 pb-12 space-y-6">
      <div className="space-y-3">
        <Link href={assetHref("STARKNET", contract, tokenId)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to asset
        </Link>
        <div className="flex items-center gap-2 text-primary">
          <HandCoins className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Request a license</span>
        </div>
        <h1 className="text-3xl font-bold">License this asset</h1>
        <p className="text-muted-foreground max-w-xl">
          Propose license terms and a fee to the creator. If they accept, the licensed derivative is minted and listed for you.
        </p>
      </div>

      {/* Parent asset */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        {originalImage && (
          <Image src={originalImage} alt={originalName} width={48} height={48} className="rounded-lg object-cover" unoptimized />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{originalName}</p>
          <p className="text-xs text-muted-foreground truncate">{parentCollection?.name ?? contract.slice(0, 10) + "…"}</p>
        </div>
      </div>

      {step === "success" ? (
        <div className="rounded-xl border border-border p-8 text-center space-y-4">
          <div className="h-14 w-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="h-7 w-7 text-primary" />
          </div>
          <p className="text-lg font-semibold">License request sent</p>
          <p className="text-sm text-muted-foreground">The creator will review it. Track it under Portfolio → Licensing.</p>
          <Button asChild variant="outline"><Link href="/portfolio/licensing">View my requests</Link></Button>
        </div>
      ) : (
        <>
          <Section title="License Terms" icon={<Shield className="h-4 w-4" />}>
            <div className="space-y-1.5">
              <Label>License Type</Label>
              <Select value={licenseType} onValueChange={handleLicenseChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map((l) => <SelectItem key={l.value} value={l.value}>{l.value}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Commercial Use</Label>
                <ToggleGroup value={commercial ? "Yes" : "No"} options={["Yes", "No"]} onChange={(v) => setCommercial(v === "Yes")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Derivatives</Label>
                <ToggleGroup value={derivatives ? "Allowed" : "Not Allowed"} options={["Allowed", "Not Allowed"]} onChange={(v) => setDerivatives(v === "Allowed")} />
              </div>
            </div>
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <button type="button" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`} /> Royalty &amp; advanced
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Percent className="h-3.5 w-3.5" /> Royalty %</Label>
                  <Input type="number" min="0" max="50" step="1" placeholder="0" value={royalty} onChange={(e) => setRoyalty(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Percentage of future sales sent back to the creator (0–50%)</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Section>

          <Section title="License fee" icon={<DollarSign className="h-4 w-4" />}>
            <p className="text-xs text-muted-foreground -mt-1">The amount you&apos;re offering to pay the creator for this license.</p>
            <div className="flex gap-2">
              <Input type="number" min="0" step="any" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} className="flex-1" />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TOKENS.map((t) => <SelectItem key={t.symbol} value={t.symbol}>{t.symbol}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Section>

          <Section title="Message (optional)" icon={<HandCoins className="h-4 w-4" />}>
            <Textarea placeholder="Add a note for the creator…" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
          </Section>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            className="w-full h-12 rounded-[11px] bg-brand-purple text-white text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <HandCoins className="h-5 w-5" />}
            Send license request
          </button>
        </>
      )}
    </div>
  );
}
