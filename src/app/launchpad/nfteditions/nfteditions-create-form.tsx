"use client";

import type { RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import Image from "next/image";
import { ImagePlus, Layers, Loader2, X } from "lucide-react";
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
import type { NftEditionsCreateFormValues } from "./nfteditions-create-schema";

interface NftEditionsCreateFormProps {
  form: UseFormReturn<NftEditionsCreateFormValues>;
  imageFile: File | null;
  imagePreview: string | null;
  imageUri: string | null;
  imageUploading: boolean;
  deployDisabled: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImageSelect: (file: File) => void;
  onClearImage: () => void;
}

export function NftEditionsCreateForm({
  form,
  imageFile,
  imagePreview,
  imageUri,
  imageUploading,
  deployDisabled,
  fileInputRef,
  onImageSelect,
  onClearImage,
}: NftEditionsCreateFormProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium">Collection image</p>
        <div className="flex items-start gap-4">
          <div
            className="relative h-28 w-28 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-primary/50 transition-colors"
            role="button"
            tabIndex={0}
            aria-label="Upload collection image"
            onClick={() => !imageUploading && fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (!imageUploading) fileInputRef.current?.click();
              }
            }}
          >
            {imagePreview ? (
              <Image src={imagePreview} alt="Collection image" fill className="object-cover" />
            ) : (
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
            )}
            {imageUploading ? (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : null}
          </div>

          <div className="space-y-2 flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
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
                imageFile ? "Change image" : "Upload image"
              )}
            </Button>
            {imageFile ? (
              <button
                type="button"
                onClick={onClearImage}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            ) : null}
            <p className="text-xs text-muted-foreground">
              JPG, PNG, GIF, SVG or WebP · max 10 MB
              {imageUri ? <span className="ml-2 text-emerald-500 font-medium">✓ Uploaded to IPFS</span> : null}
            </p>
            <p className="text-xs text-muted-foreground">This becomes the visual identity for the collection metadata.</p>
          </div>
        </div>
      </div>

      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Collection name *</FormLabel>
          <FormControl><Input placeholder="My Creative Works" {...field} /></FormControl>
          <FormDescription>The main title collectors see across the collection page, wallets, and future listings.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="symbol" render={({ field }) => (
        <FormItem>
          <FormLabel>Symbol *</FormLabel>
          <FormControl>
            <Input
              placeholder="MCW"
              {...field}
              onChange={(event) => field.onChange(event.target.value.toUpperCase())}
            />
          </FormControl>
          <FormDescription>Short ticker (2–10 uppercase letters). We suggest one from the collection name.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="description" render={({ field }) => (
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Textarea placeholder="Describe your collection and what kind of work it contains…" rows={3} {...field} />
          </FormControl>
          <FormDescription>Use this to explain the creative direction, media type, or audience for the collection.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="external_link" render={({ field }) => (
        <FormItem>
          <FormLabel>External link <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
          <FormControl><Input placeholder="https://yourwebsite.com" {...field} /></FormControl>
          <FormDescription>Your website, portfolio, or social profile. Stored in collection metadata on IPFS.</FormDescription>
          <FormMessage />
        </FormItem>
      )} />

      <div className={`btn-border-animated p-[1px] rounded-xl ${deployDisabled ? "opacity-40 pointer-events-none" : ""}`}>
        <button
          type="submit"
          disabled={deployDisabled}
          className="w-full h-12 text-base font-semibold text-white rounded-[11px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] bg-violet-600"
        >
          <Layers className="h-4 w-4" />
          Deploy Collection
        </button>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        Gas is free. Your PIN signs the transaction and deploys the collection contract onchain.
      </p>
    </div>
  );
}
