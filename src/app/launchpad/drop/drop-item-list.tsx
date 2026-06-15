"use client";

import Image from "next/image";
import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface DraftItem {
  id: string; // crypto.randomUUID()
  file: File;
  previewUrl: string; // URL.createObjectURL(file)
  name: string;
  description: string;
}

interface DropItemListProps {
  items: DraftItem[];
  collectionName: string;
  onAddFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string, patch: Partial<Pick<DraftItem, "name" | "description">>) => void;
}

export function DropItemList({ items, collectionName, onAddFiles, onRemove, onEdit }: DropItemListProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Items <span className="text-muted-foreground font-normal">({items.length})</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const f = Array.from(e.target.files ?? []);
            if (f.length) onAddFiles(f);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <ImagePlus className="h-3.5 w-3.5 mr-1.5" /> Add images
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="bento-cell border-dashed p-10 text-center text-sm text-muted-foreground">
          Drag in your artwork — each image becomes a unique, licensed token. Supply = number of items.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={it.id} className="flex gap-3 items-start bento-cell p-3">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                <Image src={it.previewUrl} alt={it.name || `Item ${i + 1}`} fill className="object-cover" unoptimized />
                <span className="absolute bottom-0 left-0 text-[9px] font-bold bg-black/60 text-white px-1">#{i + 1}</span>
              </div>
              <div className="flex-1 space-y-1.5">
                <Input
                  value={it.name}
                  onChange={(e) => onEdit(it.id, { name: e.target.value })}
                  placeholder={`${collectionName || "Item"} #${i + 1}`}
                  className="h-8 text-sm"
                />
                <Input
                  value={it.description}
                  onChange={(e) => onEdit(it.id, { description: e.target.value })}
                  placeholder="Description (optional)"
                  className="h-8 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(it.id)}
                className="text-muted-foreground hover:text-destructive p-1"
                aria-label="Remove item"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
