"use client";

import { useState } from "react";
import type { RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import Image from "next/image";
import { ChevronDown, ImagePlus, Layers, Loader2, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { FadeIn } from "@/components/ui/motion-primitives";
import { IPTypeFields, type MetadataField } from "@/components/create/ip-type-fields";
import { uploadDocumentToIpfs } from "@/lib/upload-document";
import { cn } from "@/lib/utils";
import {
  AI_POLICIES,
  DERIVATIVES_OPTIONS,
  GEOGRAPHIC_SCOPES,
  IP_TYPES,
  LICENSE_TYPES,
  type IPType,
} from "@/types/ip";
import type { NftEditionsMintFormValues } from "./nfteditions-mint-schema";

interface NftEditionsMintFormProps {
  form: UseFormReturn<NftEditionsMintFormValues>;
  imagePreview: string | null;
  imageUri: string | null;
  imageUploading: boolean;
  mintDisabled: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImageSelect: (file: File) => void;
  onClearImage: () => void;
  metadataResetKey: number;
  onMetadataFieldsChange: (fields: MetadataField[]) => void;
}

function ToggleGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      {options.map((option, index) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "flex-1 px-3 py-2 text-sm transition-colors",
            index > 0 && "border-l border-border",
            value === option
              ? "bg-primary text-primary-foreground font-medium"
              : "bg-background hover:bg-muted text-muted-foreground"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function NftEditionsMintForm({
  form,
  imagePreview,
  imageUri,
  imageUploading,
  mintDisabled,
  fileInputRef,
  onImageSelect,
  onClearImage,
  metadataResetKey,
  onMetadataFieldsChange,
}: NftEditionsMintFormProps) {
  const [licensingOpen, setLicensingOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [ipTypeOpen, setIpTypeOpen] = useState(false);

  const handleLicenseChange = (value: string) => {
    form.setValue("licenseType", value);
    const preset = LICENSE_TYPES.find((license) => license.value === value);
    if (preset) {
      form.setValue("commercialUse", preset.commercialUse);
      form.setValue("derivatives", preset.derivatives);
      form.setValue("attribution", preset.attribution);
    }
  };

  return (
    <div className="space-y-5">
      <FadeIn delay={0.06}>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Asset image <span className="text-destructive">*</span>
          </p>
          <div className="flex items-center gap-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => !imageUploading && fileInputRef.current?.click()}
              onKeyDown={(event) => { if (event.key === "Enter") fileInputRef.current?.click(); }}
              className="relative h-20 w-20 rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-violet-500/50 transition-colors"
            >
              {imagePreview ? (
                <Image src={imagePreview} alt="Token" fill className="object-cover" />
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={imageUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {imageUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  imagePreview ? "Change" : "Upload image"
                )}
              </Button>
              {imagePreview ? (
                <button
                  type="button"
                  onClick={onClearImage}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" /> Remove
                </button>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {imageUri ? (
                  <span className="text-violet-500">✓ Uploaded to IPFS</span>
                ) : (
                  "JPG, PNG, SVG or WebP · max 10 MB"
                )}
              </p>
              <p className="text-xs text-muted-foreground">This media and metadata are pinned before the first mint is submitted.</p>
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Token name *</FormLabel>
            <FormControl><Input placeholder="Genesis Track #1" {...field} /></FormControl>
            <FormDescription>The title collectors will see for this token edition. Stored in metadata on IPFS.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      </FadeIn>

      <FadeIn delay={0.1}>
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
            <FormControl>
              <Textarea placeholder="Describe this digital asset…" rows={3} {...field} />
            </FormControl>
            <FormDescription>Add context, utility, or creative notes for this token edition.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      </FadeIn>

      <FadeIn delay={0.12}>
        <FormField control={form.control} name="external_url" render={({ field }) => (
          <FormItem>
            <FormLabel>External link <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
            <FormControl><Input placeholder="https://yourwebsite.com" {...field} /></FormControl>
            <FormDescription>Canonical link for this edition. Stored in token metadata on IPFS.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      </FadeIn>

      <FadeIn delay={0.14}>
        <FormField control={form.control} name="value" render={({ field }) => (
          <FormItem>
            <FormLabel>Quantity *</FormLabel>
            <FormControl>
              <Input type="number" min={1} placeholder="1" className="max-w-[180px]" {...field} />
            </FormControl>
            <FormDescription>Number of copies to mint for this token ID.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      </FadeIn>

      <FadeIn delay={0.16}>
        <FormField control={form.control} name="recipient" render={({ field }) => (
          <FormItem>
            <FormLabel>Recipient *</FormLabel>
            <FormControl>
              <Input placeholder="0x…" {...field} />
            </FormControl>
            <FormDescription>Wallet that receives the minted tokens. Defaults to your wallet.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      </FadeIn>

      <FadeIn delay={0.18}>
        <Collapsible open={licensingOpen} onOpenChange={setLicensingOpen}>
          <div className="rounded-xl border border-border overflow-hidden">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Licensing Terms</span>
                  <span className="text-xs text-muted-foreground font-normal">Optional · Berne Convention</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", licensingOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-5 pb-5 space-y-4 border-t border-border/60 pt-4">
                <p className="text-xs text-muted-foreground">
                  Set programmable licensing terms for this ERC-1155 edition. These are embedded as immutable IPFS metadata.
                </p>

                <FormField control={form.control} name="licenseType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>License</FormLabel>
                    <Select value={field.value} onValueChange={handleLicenseChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LICENSE_TYPES.map((license) => (
                          <SelectItem key={license.value} value={license.value}>{license.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(() => {
                      const preset = LICENSE_TYPES.find((license) => license.value === field.value);
                      return preset ? <p className="text-xs text-muted-foreground mt-1">{preset.description}</p> : null;
                    })()}
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="commercialUse" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commercial Use</FormLabel>
                    <ToggleGroup value={field.value} options={["Yes", "No"]} onChange={field.onChange} />
                  </FormItem>
                )} />

                <FormField control={form.control} name="derivatives" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Derivatives</FormLabel>
                    <ToggleGroup value={field.value} options={DERIVATIVES_OPTIONS} onChange={field.onChange} />
                  </FormItem>
                )} />

                <FormField control={form.control} name="attribution" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attribution</FormLabel>
                    <ToggleGroup value={field.value} options={["Required", "Not Required"]} onChange={field.onChange} />
                  </FormItem>
                )} />

                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", advancedOpen && "rotate-180")} />
                      Advanced options
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-3">
                    <FormField control={form.control} name="geographicScope" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Territory</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GEOGRAPHIC_SCOPES.map((scope) => (
                              <SelectItem key={scope} value={scope}>{scope}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="aiPolicy" render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI &amp; Data Mining</FormLabel>
                        <ToggleGroup value={field.value} options={AI_POLICIES} onChange={field.onChange} />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="royalty" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Royalty % (0-50)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={50}
                            step={0.5}
                            placeholder="0"
                            {...field}
                            onChange={(event) => field.onChange(parseFloat(event.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Collapsible open={ipTypeOpen} onOpenChange={setIpTypeOpen}>
          <div className="rounded-xl border border-border overflow-hidden">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">IP Type &amp; Metadata</span>
                  <span className="text-xs text-muted-foreground font-normal">Optional</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", ipTypeOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-5 pb-5 space-y-4 border-t border-border/60 pt-4">
                <p className="text-xs text-muted-foreground">
                  Choose a content type, fill suggested metadata, or add your own trait pairs.
                </p>

                <FormField control={form.control} name="ipType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {IP_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <IPTypeFields
                  key={metadataResetKey}
                  ipType={form.watch("ipType") as IPType}
                  onChange={onMetadataFieldsChange}
                  uploadDocument={uploadDocumentToIpfs}
                />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </FadeIn>

      <FadeIn delay={0.22}>
        <div className="btn-border-animated p-[1px] rounded-xl mt-2">
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl bg-background text-foreground hover:bg-muted/60"
            disabled={mintDisabled}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Mint Token
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Gas is free. Your PIN signs the transaction and mints the edition directly to the chosen wallet.
        </p>
      </FadeIn>
    </div>
  );
}
