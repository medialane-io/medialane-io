"use client";

import type { RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import Image from "next/image";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FadeIn } from "@/components/ui/motion-primitives";
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
}: NftEditionsMintFormProps) {
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
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Token name *</FormLabel>
            <FormControl><Input placeholder="Genesis Track #1" {...field} /></FormControl>
            <FormDescription>Stored in the metadata JSON on IPFS.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
      </FadeIn>

      <FadeIn delay={0.1}>
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
            <FormControl>
              <Textarea placeholder="Describe this IP asset…" rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FadeIn>

      <FadeIn delay={0.12}>
        <FormField control={form.control} name="tokenId" render={({ field }) => (
          <FormItem>
            <FormLabel>Token ID *</FormLabel>
            <FormControl>
              <Input type="number" min={0} placeholder="1" className="max-w-[180px]" {...field} />
            </FormControl>
            <FormDescription>
              Unique identifier for this token type within the collection. Immutable once minted.
            </FormDescription>
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

      <FadeIn delay={0.2}>
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
          Gas is free. Your PIN signs the transaction.
        </p>
      </FadeIn>
    </div>
  );
}
