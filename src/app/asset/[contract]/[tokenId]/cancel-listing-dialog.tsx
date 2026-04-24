"use client";

import { Loader2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CancelListingDialogProps {
  cancelStep: "idle" | "processing" | "success" | "error";
  cancelError: string | null;
  onReset: () => void;
}

export function CancelListingDialog({ cancelStep, cancelError, onReset }: CancelListingDialogProps) {
  return (
    <Dialog
      open={cancelStep !== "idle"}
      onOpenChange={(v) => { if (!v) onReset(); }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {cancelStep === "processing" && "Cancelling listing…"}
            {cancelStep === "success" && "Listing cancelled"}
            {cancelStep === "error" && "Cancellation failed"}
          </DialogTitle>
          {cancelStep === "processing" && (
            <DialogDescription>
              Submitting your cancellation to the network. Please wait.
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {cancelStep === "processing" && (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          )}
          {cancelStep === "success" && (
            <>
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-sm text-center text-muted-foreground">
                Your listing has been cancelled successfully.
              </p>
              <Button className="w-full" onClick={onReset}>Done</Button>
            </>
          )}
          {cancelStep === "error" && (
            <>
              <X className="h-10 w-10 text-destructive" />
              <p className="text-sm text-center text-muted-foreground">
                {cancelError ?? "Something went wrong. Please try again."}
              </p>
              <Button variant="outline" className="w-full" onClick={onReset}>Dismiss</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
