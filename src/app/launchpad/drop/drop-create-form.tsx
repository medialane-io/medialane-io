"use client";

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
import { FadeIn } from "@/components/ui/motion-primitives";
import { cn } from "@/lib/utils";
import type { DropCreateFormValues } from "./drop-create-schema";

export interface PaymentTokenOption {
  symbol: string;
  address: string;
}

interface SupplyPreset {
  label: string;
  value: number;
}

interface DropCreateFormProps {
  form: UseFormReturn<DropCreateFormValues>;
  imagePreview: string | null;
  imageUri: string | null;
  imageUploading: boolean;
  isSubmitting: boolean;
  priceFree: boolean;
  isPublic: boolean;
  supplyPreset: number | "custom";
  supplyPresets: SupplyPreset[];
  paymentTokens: PaymentTokenOption[];
  selectedToken: PaymentTokenOption;
  tokenDropdownOpen: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImageSelect: (file: File) => void;
  onClearImage: () => void;
  onSetPriceFree: (value: boolean) => void;
  onSetSupplyPreset: (value: number | "custom") => void;
  onSetTokenDropdownOpen: (open: boolean) => void;
  onSelectToken: (token: PaymentTokenOption) => void;
  onSetPublic: (value: boolean) => void;
}

export function DropCreateForm({
  form,
  imagePreview,
  imageUri,
  imageUploading,
  isSubmitting,
  priceFree,
  isPublic,
  supplyPreset,
  supplyPresets,
  paymentTokens,
  selectedToken,
  tokenDropdownOpen,
  fileInputRef,
  onImageSelect,
  onClearImage,
  onSetPriceFree,
  onSetSupplyPreset,
  onSetTokenDropdownOpen,
  onSelectToken,
  onSetPublic,
}: DropCreateFormProps) {
  return (
    <div className="space-y-5">
      <FadeIn delay={0.06}>
        <div className="space-y-3">
          <p className="text-sm font-medium">Supply cap</p>
          <div className="grid grid-cols-4 gap-2">
            {supplyPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => onSetSupplyPreset(preset.value)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-semibold transition-all",
                  supplyPreset === preset.value
                    ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    : "border-border bg-muted/30 hover:border-orange-500/40 hover:bg-orange-500/5"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
            <button
              type="button"
              onClick={() => onSetSupplyPreset("custom")}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm font-semibold transition-all h-10",
                supplyPreset === "custom"
                  ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : "border-border bg-muted/30 hover:border-orange-500/40 hover:bg-orange-500/5"
              )}
            >
              Custom
            </button>
            {supplyPreset === "custom" ? (
              <FormField control={form.control} name="supplyCustom" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="number" min={1} placeholder="Enter supply cap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">How many tokens can ever be minted.</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="space-y-3">
          <p className="text-sm font-medium">Mint price</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSetPriceFree(true)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all",
                priceFree
                  ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : "border-border bg-muted/30 hover:border-orange-500/40 hover:bg-orange-500/5 text-muted-foreground"
              )}
            >
              <Zap className={cn("h-5 w-5", priceFree && "text-orange-500")} />
              <span className="text-[11px] font-semibold leading-tight">Free</span>
            </button>
            <button
              type="button"
              onClick={() => onSetPriceFree(false)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all",
                !priceFree
                  ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : "border-border bg-muted/30 hover:border-orange-500/40 hover:bg-orange-500/5 text-muted-foreground"
              )}
            >
              <Coins className={cn("h-5 w-5", !priceFree && "text-orange-500")} />
              <span className="text-[11px] font-semibold leading-tight">Paid</span>
            </button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.12}>
        <div className="space-y-2">
          <p className="text-sm font-medium">Cover image <span className="text-muted-foreground font-normal">(optional)</span></p>
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
                  imagePreview ? "Change" : "Upload cover"
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
                {imageUri ? <span className="text-orange-500">✓ Uploaded to IPFS</span> : "JPG, PNG, SVG or WebP · max 10 MB"}
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.14}>
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Collection name *</FormLabel>
            <FormControl><Input placeholder="Genesis Series" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FadeIn>

      <FadeIn delay={0.16}>
        <FormField control={form.control} name="symbol" render={({ field }) => (
          <FormItem>
            <FormLabel>Symbol *</FormLabel>
            <FormControl>
              <Input
                placeholder="GEN"
                {...field}
                onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                className="max-w-[160px]"
              />
            </FormControl>
            <FormDescription>Short ticker shown in wallets.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      </FadeIn>

      {!priceFree ? (
        <FadeIn delay={0.17}>
          <div className="space-y-3">
            <div className="flex gap-2 items-start">
              <FormField control={form.control} name="priceAmount" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Price per token</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.01" step="any" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="relative mt-[22px]">
                <button
                  type="button"
                  onClick={() => onSetTokenDropdownOpen(!tokenDropdownOpen)}
                  className="flex items-center gap-1.5 h-10 px-3 rounded-md border border-border bg-muted/30 text-sm font-semibold hover:border-orange-500/50 transition-colors"
                >
                  {selectedToken.symbol}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {tokenDropdownOpen ? (
                  <div className="absolute top-11 right-0 z-50 w-28 rounded-lg border border-border bg-background shadow-lg py-1">
                    {paymentTokens.map((token) => (
                      <button
                        key={token.address}
                        type="button"
                        onClick={() => onSelectToken(token)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors",
                          selectedToken.address === token.address && "text-orange-500 font-semibold"
                        )}
                      >
                        {token.symbol}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </FadeIn>
      ) : null}

      <FadeIn delay={0.18}>
        <FormField control={form.control} name="maxPerWallet" render={({ field }) => (
          <FormItem>
            <FormLabel>Max per wallet</FormLabel>
            <FormControl>
              <Input type="number" min={1} max={10000} className="max-w-[120px]" {...field} />
            </FormControl>
            <FormDescription>Maximum tokens one wallet can mint.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Mint window *</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Opens</p>
              <div className="flex gap-2">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem className="w-28">
                    <FormControl><Input type="time" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Closes</p>
              <div className="flex gap-2">
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem className="w-28">
                    <FormControl><Input type="time" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Collectors can only mint during this window.</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.22}>
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Drop visibility</p>
            <p className="text-xs text-muted-foreground">
              {isPublic ? "Listed publicly on the Drop launchpad" : "Only accessible via direct link"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            onClick={() => onSetPublic(!isPublic)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isPublic ? "bg-orange-500" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                isPublic ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </FadeIn>

      <FadeIn delay={0.24}>
        <div className="btn-border-animated p-[1px] rounded-xl mt-2">
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl bg-background text-foreground hover:bg-muted/60"
            disabled={isSubmitting || imageUploading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Launching…
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Launch Drop
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">Gas is free. Your PIN signs the transaction.</p>
      </FadeIn>
    </div>
  );
}
