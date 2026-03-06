import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlus, Layers } from "lucide-react";

export const metadata: Metadata = {
  title: "Create",
  description: "Mint IP assets and deploy collections on Medialane.",
};

export default function CreatePage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create</h1>
        <p className="text-muted-foreground mt-1">
          Choose what you&apos;d like to create on Medialane.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/create/asset" className="group">
          <Card className="h-full hover:border-primary/40 transition-colors cursor-pointer">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                <ImagePlus className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>IP Asset</CardTitle>
              <CardDescription>
                Mint a single creative work — art, music, document, or any intellectual property.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/create/collection" className="group">
          <Card className="h-full hover:border-primary/40 transition-colors cursor-pointer">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2 group-hover:bg-purple-500/20 transition-colors">
                <Layers className="h-5 w-5 text-purple-500" />
              </div>
              <CardTitle>Collection</CardTitle>
              <CardDescription>
                Deploy a new named NFT collection and mint assets into it.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
