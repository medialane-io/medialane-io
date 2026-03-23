"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { submitRemixOffer } from "@/hooks/use-remix-offers";
import { getListableTokens } from "@medialane/sdk";
import { GitBranch, Loader2 } from "lucide-react";

const LICENSE_TYPES = ["CC0", "CC BY", "CC BY-SA", "CC BY-NC", "CC BY-ND", "Custom"];
const TOKENS = getListableTokens();

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contractAddress: string;
  tokenId: string;
  tokenName?: string;
}

export function RemixOfferDialog({ open, onOpenChange, contractAddress, tokenId, tokenName }: Props) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState(TOKENS[0]?.symbol ?? "STRK");
  const [licenseType, setLicenseType] = useState("CC BY");
  const [commercial, setCommercial] = useState(false);
  const [derivatives, setDerivatives] = useState(true);
  const [royaltyPct, setRoyaltyPct] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!price || isNaN(parseFloat(price))) {
      toast.error("Enter a valid price");
      return;
    }
    const token = TOKENS.find((t) => t.symbol === currency);
    if (!token) return;

    const rawPrice = BigInt(Math.round(parseFloat(price) * 10 ** token.decimals)).toString();
    const royalty = royaltyPct ? parseInt(royaltyPct, 10) : undefined;

    setLoading(true);
    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error("Not authenticated");
      await submitRemixOffer(
        {
          originalContract: contractAddress,
          originalTokenId: tokenId,
          proposedPrice: rawPrice,
          proposedCurrency: token.address,
          licenseType,
          commercial,
          derivatives,
          royaltyPct: royalty !== undefined && !isNaN(royalty) ? royalty : undefined,
          message: message.trim() || undefined,
          expiresInDays: 7,
        },
        clerkToken
      );
      toast.success("Remix offer sent", { description: "The creator will be notified." });
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error("Failed to send offer", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            Request Remix License
          </DialogTitle>
          <DialogDescription>
            Propose terms to the creator of{" "}
            <span className="font-medium text-foreground">{tokenName ?? `Token #${tokenId}`}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Price */}
          <div className="space-y-1.5">
            <Label>License Fee</Label>
            <div className="flex gap-2">
              <Input
                placeholder="0.00"
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1"
              />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKENS.map((t) => (
                    <SelectItem key={t.symbol} value={t.symbol}>{t.symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* License Type */}
          <div className="space-y-1.5">
            <Label>License Type</Label>
            <Select value={licenseType} onValueChange={setLicenseType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LICENSE_TYPES.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch id="commercial" checked={commercial} onCheckedChange={setCommercial} />
              <Label htmlFor="commercial" className="text-sm cursor-pointer">Commercial use</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="derivatives" checked={derivatives} onCheckedChange={setDerivatives} />
              <Label htmlFor="derivatives" className="text-sm cursor-pointer">Allow derivatives</Label>
            </div>
          </div>

          {/* Royalty */}
          <div className="space-y-1.5">
            <Label>Royalty % <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              placeholder="e.g. 10"
              type="number"
              min="0"
              max="100"
              value={royaltyPct}
              onChange={(e) => setRoyaltyPct(e.target.value)}
              className="w-32"
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label>Message <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              placeholder="Tell the creator what you want to make…"
              rows={2}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <GitBranch className="h-4 w-4 mr-2" />}
            Send Offer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
