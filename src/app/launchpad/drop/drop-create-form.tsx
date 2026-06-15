"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import Image from "next/image";
import { ChevronDown, Coins, ImagePlus, Loader2, Package, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FadeIn } from "@/components/ui/motion-primitives";
import { cn } from "@/lib/utils";
import { IP_TYPES, LICENSE_TYPES, type IPType } from "@/types/ip";
import { IPTypeFields, type MetadataField } from "@/components/create/ip-type-fields";
import { uploadDocumentToIpfs } from "@/lib/upload-document";
import { DropItemList, type DraftItem } from "./drop-item-list";
import type { DropCreateFormValues } from "./drop-create-schema";

export interface PaymentTokenOption {
  symbol: string;
  address: string;
}

interface DropCreateFormProps {
  form: UseFormReturn<DropCreateFormValues>;
  imagePreview: string | null;
  imageUri: string | null;
  imageUploading: boolean;
  isSubmitting: boolean;
  priceFree: boolean;
  isPublic: boolean;
  paymentTokens: PaymentTokenOption[];
  selectedToken: PaymentTokenOption;
  tokenDropdownOpen: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  items: DraftItem[];
  ipTypeOpen: boolean;
  onImageSelect: (file: File) => void;
  onClearImage: () => void;
  onSetPriceFree: (value: boolean) => void;
  onSetTokenDropdownOpen: (open: boolean) => void;
  onSelectToken: (token: PaymentTokenOption) => void;
  onSetPublic: (value: boolean) => void;
  onAddItemFiles: (files: File[]) => void;
  onRemoveItem: (id: string) => void;
  onEditItem: (id: string, patch: Partial<Pick<DraftItem, "name" | "description">>) => void;
  onMetadataFieldsChange: (fields: MetadataField[]) => void;
  onSetIpTypeOpen: (open: boolean) => void;
}

export function DropCreateForm({
  form,
  imagePreview,
  imageUri,
  imageUploading,
  isSubmitting,
  priceFree,
  isPublic,
  paymentTokens,
  selectedToken,
  tokenDropdownOpen,
  fileInputRef,
  items,
  ipTypeOpen,
  onImageSelect,
  onClearImage,
  onSetPriceFree,
  onSetTokenDropdownOpen,
  onSelectToken,
  onSetPublic,
  onAddItemFiles,
  onRemoveItem,
  onEditItem,
  onMetadataFieldsChange,
  onSetIpTypeOpen,
}: DropCreateFormProps) {
  const tokenDropdownRef = useRef<HTMLDivElement | null>(null);
  const collectionName = form.watch("name");

  useEffect(() => {
    if (!tokenDropdownOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!tokenDropdownRef.current?.contains(event.target as Node)) onSetTokenDropdownOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onSetTokenDropdownOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onSetTokenDropdownOpen, tokenDropdownOpen]);

  // Selecting a license preset fills the derived commercial/derivatives/attribution fields,
  // exactly like the /create asset flow — so every drop item carries the full license.
  const handleLicenseChange = (value: string) => {
    form.setValue("licenseType", value);
    const def = LICENSE_TYPES.find((l) => l.value === value);
    if (def) {
      form.setValue("commercialUse", def.commercialUse);
      form.setValue("derivatives", def.derivatives);
      form.setValue("attribution", def.attribution);
    }
  };

  return (
    <div className="space-y-5">
      {/* Cover image */}
      <FadeIn delay={0.06}>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Cover image <span className="text-muted-foreground font-normal">(optional)</span>
          </p>
          <div className="flex items-center gap-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => !imageUploading && fileInputRef.current?.click()}
              onKeyDown={(event) => { if (event.key === "Enter") fileInputRef.current?.click(); }}
              className="relative h-20 w-20 rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-orange-500/50 transition-colors"
            >
              {imagePreview ? (
                <Image src={imagePreview} alt="Cover" fill className="object-cover" />
              ) : (
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              )}
              {imageUploading ? (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onImageSelect(file);
                }}
              />
              <Button type="button" variant="outline" size="sm" disabled={imageUploading} onClick={() => fileInputRef.current?.click()}>
                {imageUploading ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</>
                ) : (
                  imagePreview ? "Change" : "Upload cover"
                )}
              </Button>
              {imagePreview ? (
                <button type="button" onClick={onClearImage} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-3 w-3" /> Remove
                </button>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {imageUri ? <span className="text-orange-500">✓ Uploaded to IPFS</span> : "Shown on the drop card. Item art is added below."}
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Name + symbol */}
      <FadeIn delay={0.1}>
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Collection name *</FormLabel>
            <FormControl><Input placeholder="Genesis Series" {...field} /></FormControl>
            <FormDescription>Shown across the drop page, wallet, and marketplace.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      </FadeIn>

      <FadeIn delay={0.12}>
        <FormField control={form.control} name="symbol" render={({ field }) => (
          <FormItem>
            <FormLabel>Symbol *</FormLabel>
            <FormControl>
              <Input placeholder="GEN" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} className="max-w-[160px]" />
            </FormControl>
            <FormDescription>Short ticker shown in wallets and explorers.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      </FadeIn>

      {/* Items — each becomes a unique, licensed token */}
      <FadeIn delay={0.14}>
        <DropItemList
          items={items}
          collectionName={collectionName}
          onAddFiles={onAddItemFiles}
          onRemove={onRemoveItem}
          onEdit={onEditItem}
        />
      </FadeIn>

      {/* Licensing & IP — shared defaults applied to every item */}
      <FadeIn delay={0.16}>
        <div className="space-y-3">
          <p className="text-sm font-medium">Licensing &amp; IP</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField control={form.control} name="ipType" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">IP type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {IP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="licenseType" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">License</FormLabel>
                <Select value={field.value} onValueChange={handleLicenseChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select license" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {LICENSE_TYPES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label ?? l.value}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="royalty" render={({ field }) => (
            <FormItem className="max-w-[160px]">
              <FormLabel className="text-xs">Royalty %</FormLabel>
              <FormControl><Input type="number" min={0} max={50} step="any" {...field} /></FormControl>
              <FormDescription className="text-xs">Resale royalty, 0–50%.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />

          <Collapsible open={ipTypeOpen} onOpenChange={onSetIpTypeOpen}>
            <CollapsibleTrigger asChild>
              <button type="button" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={cn("h-4 w-4 transition-transform", ipTypeOpen && "rotate-180")} />
                Type-specific details (optional)
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <IPTypeFields
                ipType={form.watch("ipType") as IPType}
                onChange={onMetadataFieldsChange}
                uploadDocument={uploadDocumentToIpfs}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </FadeIn>

      {/* Mint price */}
      <FadeIn delay={0.18}>
        <div className="space-y-3">
          <p className="text-sm font-medium">Mint price</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onSetPriceFree(true)} className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all", priceFree ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400" : "border-border bg-muted/30 hover:border-orange-500/40 hover:bg-orange-500/5 text-muted-foreground")}>
              <Zap className={cn("h-5 w-5", priceFree && "text-orange-500")} />
              <span className="text-[11px] font-semibold leading-tight">Free</span>
            </button>
            <button type="button" onClick={() => onSetPriceFree(false)} className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all", !priceFree ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400" : "border-border bg-muted/30 hover:border-orange-500/40 hover:bg-orange-500/5 text-muted-foreground")}>
              <Coins className={cn("h-5 w-5", !priceFree && "text-orange-500")} />
              <span className="text-[11px] font-semibold leading-tight">Paid</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Choose a free claim or a fixed mint price for every token in this drop.</p>
        </div>
      </FadeIn>

      {!priceFree ? (
        <FadeIn delay={0.19}>
          <div className="flex gap-2 items-start">
            <FormField control={form.control} name="priceAmount" render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Price per token</FormLabel>
                <FormControl><Input type="number" placeholder="0.01" step="any" min={0} {...field} /></FormControl>
                <FormDescription>Amount each collector pays per token before fees.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <div ref={tokenDropdownRef} className="relative mt-[22px]">
              <button type="button" onClick={() => onSetTokenDropdownOpen(!tokenDropdownOpen)} aria-expanded={tokenDropdownOpen} aria-haspopup="listbox" className="flex items-center gap-1.5 h-10 px-3 rounded-md border border-border bg-muted/30 text-sm font-semibold hover:border-orange-500/50 transition-colors">
                {selectedToken.symbol}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {tokenDropdownOpen ? (
                <div role="listbox" className="absolute top-11 right-0 z-50 w-28 rounded-lg border border-border bg-background shadow-lg py-1">
                  {paymentTokens.map((token) => (
                    <button key={token.address} type="button" role="option" aria-selected={selectedToken.address === token.address} onClick={() => onSelectToken(token)} className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors", selectedToken.address === token.address && "text-orange-500 font-semibold")}>
                      {token.symbol}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </FadeIn>
      ) : null}

      {/* Max per wallet */}
      <FadeIn delay={0.2}>
        <FormField control={form.control} name="maxPerWallet" render={({ field }) => (
          <FormItem>
            <FormLabel>Max per wallet</FormLabel>
            <FormControl><Input type="number" min={1} max={10000} className="max-w-[120px]" {...field} /></FormControl>
            <FormDescription>Maximum tokens one wallet can mint.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      </FadeIn>

      {/* Mint window */}
      <FadeIn delay={0.22}>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Mint window *</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Opens</p>
              <div className="flex gap-2">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem className="flex-1"><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem className="w-28"><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                )} />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Closes</p>
              <div className="flex gap-2">
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem className="flex-1"><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem className="w-28"><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                )} />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Collectors can only mint during this window.</p>
        </div>
      </FadeIn>

      {/* Visibility */}
      <FadeIn delay={0.24}>
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Drop visibility</p>
            <p className="text-xs text-muted-foreground">
              {isPublic ? "Listed publicly on the Drop launchpad" : "Only accessible via direct link"}
            </p>
          </div>
          <button type="button" role="switch" aria-checked={isPublic} onClick={() => onSetPublic(!isPublic)} className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isPublic ? "bg-orange-500" : "bg-muted-foreground/30")}>
            <span className={cn("pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform", isPublic ? "translate-x-5" : "translate-x-0")} />
          </button>
        </div>
      </FadeIn>

      {/* Submit */}
      <FadeIn delay={0.26}>
        <div className="btn-border-animated p-[1px] rounded-xl mt-2">
          <Button type="submit" size="lg" className="w-full rounded-xl bg-background text-foreground hover:bg-muted/60" disabled={isSubmitting || imageUploading}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Launching…</>
            ) : (
              <><Package className="h-4 w-4 mr-2" />Launch Drop</>
            )}
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Supply equals the number of items. Gas is free — your PIN signs the launch.
        </p>
      </FadeIn>
    </div>
  );
}
