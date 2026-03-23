"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth, useClerk } from "@clerk/nextjs";

export type ReportTarget =
  | { type: "TOKEN"; contract: string; tokenId: string; name?: string }
  | { type: "COLLECTION"; contract: string; name?: string }
  | { type: "CREATOR"; address: string; name?: string }
  | { type: "COMMENT"; commentId: string };

const CATEGORIES = [
  { value: "COPYRIGHT_PIRACY", label: "Copyright / Piracy" },
  { value: "VIOLENCE_GRAPHIC", label: "Violence / Graphic content" },
  { value: "HATE_SPEECH", label: "Hate speech" },
  { value: "SCAM_FRAUD", label: "Scam / Fraud" },
  { value: "SPAM", label: "Spam" },
  { value: "NSFW", label: "NSFW / Adult content" },
  { value: "OTHER", label: "Other" },
] as const;

interface ReportDialogProps {
  target: ReportTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDialog({ target, open, onOpenChange }: ReportDialogProps) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleCategory = (value: string) => {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const handleOpenChange = (next: boolean) => {
    if (next && !isSignedIn) {
      openSignIn();
      return;
    }
    if (!next) {
      setCategories([]);
      setDescription("");
      setSubmitted(false);
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (categories.length === 0 || loading || submitted) return;
    setLoading(true);

    const payload: Record<string, unknown> = {
      targetType: target.type,
      categories,
      description: description.trim() || undefined,
    };

    if (target.type === "TOKEN") {
      payload.targetContract = target.contract;
      payload.targetTokenId = target.tokenId;
    } else if (target.type === "COLLECTION") {
      payload.targetContract = target.contract;
    } else if (target.type === "CREATOR") {
      payload.targetAddress = target.address;
    } else if (target.type === "COMMENT") {
      payload.targetId = target.commentId;
    }

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        toast.error("You've already reported this content");
        onOpenChange(false);
        return;
      }
      if (res.status === 429) {
        toast.error("You're submitting too many reports. Please wait before trying again.");
        onOpenChange(false);
        return;
      }
      if (!res.ok) throw new Error("Unexpected error");

      setSubmitted(true);
      toast.success("Report submitted — our DAO team will review it");
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const targetLabel =
    target.type !== "COMMENT" && target.name
      ? `"${target.name}"`
      : target.type.charAt(0) + target.type.slice(1).toLowerCase();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Report {targetLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              What&apos;s wrong with this content?{" "}
              <span className="text-muted-foreground font-normal">
                (select all that apply)
              </span>
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {CATEGORIES.map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={value}
                    checked={categories.includes(value)}
                    onCheckedChange={() => toggleCategory(value)}
                    disabled={submitted}
                  />
                  <label
                    htmlFor={value}
                    className="text-sm cursor-pointer leading-none"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-description" className="text-sm font-medium">
              Additional details{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="report-description"
              placeholder="Describe the issue in more detail (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="resize-none h-24"
              disabled={submitted}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Reports are reviewed by the Medialane DAO team. Content remains
            accessible onchain and via the permissionless dapp.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={categories.length === 0 || loading || submitted}
          >
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
