"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlus, Layers } from "lucide-react";

export default function CreatePage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create</h1>
        <p className="text-muted-foreground mt-1">Choose what you&apos;d like to create on Medialane.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:border-primary/30 transition-colors cursor-pointer group">
          <Link href="/create/asset">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                <ImagePlus className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>IP Asset</CardTitle>
              <CardDescription>
                Mint a single creative work — art, music, document, or any intellectual property.
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:border-primary/30 transition-colors cursor-pointer group opacity-60">
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-2">
              <Layers className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle>Collection</CardTitle>
            <CardDescription>
              Deploy a new NFT collection contract. Coming soon.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
