"use client";

export const dynamic = "force-dynamic";

import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AssetsGrid } from "@/components/portfolio/assets-grid";
import { ListingsTable } from "@/components/portfolio/listings-table";
import { OffersTable } from "@/components/portfolio/offers-table";
import { Briefcase } from "lucide-react";

export default function PortfolioPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const address = user?.publicMetadata?.publicKey as string | undefined;

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-4">
        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Your Portfolio</h1>
        <p className="text-muted-foreground">Sign in to view your assets, listings, and offers.</p>
        <SignInButton mode="modal">
          <Button>Sign in</Button>
        </SignInButton>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-muted-foreground">
          Your wallet hasn&apos;t been set up yet. Complete wallet setup to see your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your on-chain IP assets, listings, and offers.
        </p>
      </div>

      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-6">
          <AssetsGrid address={address} />
        </TabsContent>

        <TabsContent value="listings" className="mt-6">
          <ListingsTable address={address} />
        </TabsContent>

        <TabsContent value="offers" className="mt-6">
          <OffersTable address={address} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
