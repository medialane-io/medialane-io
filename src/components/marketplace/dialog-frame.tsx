"use client";

import { usePathname } from "next/navigation";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@medialane/ui/dialog";
import { Alert, AlertDescription } from "@medialane/ui/alert";
import { MarketplaceSignInGate } from "@medialane/ui";
import { connectHref } from "@/lib/connect-href";

interface MarketplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function MarketplaceDialog({ open, onOpenChange, title, description, children }: MarketplaceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl flex flex-col">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function DialogErrorAlert({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

export function DialogNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-center gap-1.5">
      <ShieldCheck className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-2xs text-center text-muted-foreground">{children}</p>
    </div>
  );
}

export function DialogSignInGate({ title, description }: { title: string; description: string }) {
  const pathname = usePathname();
  return <MarketplaceSignInGate title={title} description={description} href={connectHref(pathname)} />;
}
