"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ChevronDown, Layers, Loader2, Package, ShieldCheck, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { cn } from "@/lib/utils";
import {
  IP_TYPES, LICENSE_TYPES, AI_POLICIES, DERIVATIVES_OPTIONS, type IPType,
} from "@/types/ip";
import { IPTypeFields, type MetadataField } from "@/components/create/ip-type-fields";
import { ToggleGroup, Section } from "@/components/create/create-form-primitives";
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
  const whitelistEnabled = form.watch("whitelistEnabled");
  const [licensingOpen, setLicensingOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (!tokenDropdownOpen) return;
    const onPointer = (e: MouseEvent) => { if (!tokenDropdownRef.current?.contains(e.target as Node)) onSetTokenDropdownOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onSetTokenDropdownOpen(false); };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onPointer); document.removeEventListener("keydown", onEsc); };
  }, [onSetTokenDropdownOpen, tokenDropdownOpen]);

  // Selecting a license preset fills the derived commercial/derivatives/attribution fields.
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
      <div className="space-y-2">
        <label className="text-sm font-medium">Cover image <span className="text-muted-foreground font-normal">(optional)</span></label>
        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          role="button"
          tabIndex={0}
          aria-label="Upload cover image"
          onClick={() => !imageUploading && fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
        >
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Cover preview" className="mx-auto max-h-48 rounded-lg object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              {imageUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
              <p className="text-sm">{imageUploading ? "Uploading…" : "Click to upload (JPG, PNG, GIF, SVG, WebP · max 10 MB)"}</p>
              <p className="text-xs">Shown on the drop card · item art is added below</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) onImageSelect(file); }}
          />
        </div>
      </div>

      {/* Name */}
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Collection name *</FormLabel>
          <FormControl><Input placeholder="Genesis Series" {...field} /></FormControl>
          <FormDescription>Shown across the drop page, wallet, and marketplace.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      {/* Symbol */}
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

      {/* Items */}
      <Section title="Items" icon={<Layers className="h-4 w-4" />}>
        <p className="text-xs text-muted-foreground">
          Each image becomes a unique, individually-licensed token. Supply equals the number of items.
        </p>
        <DropItemList items={items} collectionName={collectionName} onAddFiles={onAddItemFiles} onRemove={onRemoveItem} onEdit={onEditItem} />
      </Section>

      {/* Licensing Terms — collapsible panel (matches /create/asset) */}
      <CollapsibleSection
        open={licensingOpen}
        onOpenChange={setLicensingOpen}
        icon={<ShieldCheck className="h-4 w-4 text-primary" />}
        label="Licensing Terms"
        hint="Applied to every item · Berne Convention"
      >
              <p className="text-xs text-muted-foreground">
                These license terms are saved permanently with every piece in the drop. CC BY-SA by default.
              </p>
              <FormField control={form.control} name="licenseType" render={({ field }) => (
                <FormItem>
                  <FormLabel>License</FormLabel>
                  <Select value={field.value} onValueChange={handleLicenseChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {LICENSE_TYPES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label ?? l.value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="commercialUse" render={({ field }) => (
                <FormItem><FormLabel>Commercial Use</FormLabel><ToggleGroup value={field.value} options={["Yes", "No"]} onChange={field.onChange} /></FormItem>
              )} />
              <FormField control={form.control} name="derivatives" render={({ field }) => (
                <FormItem><FormLabel>Derivatives</FormLabel><ToggleGroup value={field.value} options={DERIVATIVES_OPTIONS} onChange={field.onChange} /></FormItem>
              )} />
              <FormField control={form.control} name="attribution" render={({ field }) => (
                <FormItem><FormLabel>Attribution</FormLabel><ToggleGroup value={field.value} options={["Required", "Not Required"]} onChange={field.onChange} /></FormItem>
              )} />
              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <button type="button" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", advancedOpen && "rotate-180")} />
                    Advanced options
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-3">
                  <FormField control={form.control} name="geographicScope" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Territory</FormLabel>
                      <FormControl><Input placeholder="Worldwide" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="aiPolicy" render={({ field }) => (
                    <FormItem><FormLabel>AI &amp; Data Mining</FormLabel><ToggleGroup value={field.value} options={AI_POLICIES} onChange={field.onChange} /></FormItem>
                  )} />
                  <FormField control={form.control} name="royalty" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Royalty % (0–50)</FormLabel>
                      <FormControl><Input type="number" min={0} max={50} step={0.5} placeholder="0" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CollapsibleContent>
              </Collapsible>
      </CollapsibleSection>

      {/* IP Type & Metadata — collapsible panel (matches /create/asset) */}
      <CollapsibleSection
        open={ipTypeOpen}
        onOpenChange={onSetIpTypeOpen}
        icon={<Layers className="h-4 w-4 text-primary" />}
        label="IP Type &amp; Metadata"
        hint="Optional · applied to every item"
      >
              <FormField control={form.control} name="ipType" render={({ field }) => (
                <FormItem>
                  <FormLabel>IP Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{IP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              )} />
              <IPTypeFields ipType={form.watch("ipType") as IPType} onChange={onMetadataFieldsChange} uploadDocument={uploadDocumentToIpfs} />
      </CollapsibleSection>

      {/* Drop settings */}
      <Section title="Drop settings" icon={<Package className="h-4 w-4" />}>
        {/* Price */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Mint price</label>
          <ToggleGroup value={priceFree ? "Free" : "Paid"} options={["Free", "Paid"]} onChange={(v) => onSetPriceFree(v === "Free")} />
          {!priceFree && (
            <div className="flex gap-2 items-start pt-1">
              <FormField control={form.control} name="priceAmount" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl><Input type="number" placeholder="0.01" step="any" min={0} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div ref={tokenDropdownRef} className="relative">
                <button type="button" onClick={() => onSetTokenDropdownOpen(!tokenDropdownOpen)} aria-haspopup="listbox" aria-expanded={tokenDropdownOpen}
                  className="flex items-center gap-1.5 h-10 px-3 rounded-md border border-border bg-muted/30 text-sm font-semibold hover:border-primary/50 transition-colors">
                  {selectedToken.symbol}<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {tokenDropdownOpen && (
                  <div role="listbox" className="absolute top-11 right-0 z-50 w-28 rounded-lg border border-border bg-background shadow-lg py-1">
                    {paymentTokens.map((t) => (
                      <button key={t.address} type="button" role="option" aria-selected={selectedToken.address === t.address} onClick={() => onSelectToken(t)}
                        className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors", selectedToken.address === t.address && "text-primary font-semibold")}>
                        {t.symbol}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">A free claim, or a fixed price per token.</p>
        </div>

        {/* Max per wallet */}
        <FormField control={form.control} name="maxPerWallet" render={({ field }) => (
          <FormItem>
            <FormLabel>Max per wallet</FormLabel>
            <FormControl><Input type="number" min={1} max={10000} className="max-w-[120px]" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Mint window */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Mint window *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Opens</p>
              <div className="flex gap-2">
                <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="startTime" render={({ field }) => (<FormItem className="w-28"><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Closes</p>
              <div className="flex gap-2">
                <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem className="flex-1"><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="endTime" render={({ field }) => (<FormItem className="w-28"><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
              </div>
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Listing visibility</label>
          <ToggleGroup value={isPublic ? "Public" : "Hidden"} options={["Public", "Hidden"]} onChange={(v) => onSetPublic(v === "Public")} />
          <p className="text-xs text-muted-foreground">{isPublic ? "Listed on the Drop launchpad." : "Hidden — only reachable by direct link."}</p>
        </div>
      </Section>

      {/* Whitelist — collapsible panel; opening it enables the gate */}
      <CollapsibleSection
        open={whitelistEnabled}
        onOpenChange={(o) => form.setValue("whitelistEnabled", o)}
        icon={<Users className="h-4 w-4 text-primary" />}
        label="Whitelist"
        hint={whitelistEnabled ? "Only listed addresses can mint" : "Optional · restrict who can mint"}
        contentSpacing="space-y-3"
      >
              <FormField control={form.control} name="allowlistAddresses" render={({ field }) => (
                <FormItem>
                  <FormControl><Textarea placeholder={"Paste Starknet addresses, one per line:\n0x04a…\n0x06b…"} rows={5} {...field} className="font-mono text-xs resize-none" /></FormControl>
                  <FormDescription className="text-xs">Only these wallets can mint. You can open it to everyone later from Manage.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
      </CollapsibleSection>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || imageUploading}
        className={cn("w-full h-12 text-base font-semibold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] bg-brand-blue", (isSubmitting || imageUploading) && "opacity-40 pointer-events-none")}
      >
        {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" />Launching…</>) : (<><Package className="h-4 w-4" />Launch Drop</>)}
      </button>
      <p className="text-xs text-center text-muted-foreground">Supply equals the number of items you add. Free to launch — no gas fees.</p>
    </div>
  );
}
