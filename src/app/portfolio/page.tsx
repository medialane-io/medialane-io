"use client";

import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AssetsGrid } from "@/components/portfolio/assets-grid";
import { ListingsTable } from "@/components/portfolio/listings-table";
import { OffersTable } from "@/components/portfolio/offers-table";
import { ReceivedOffersTable } from "@/components/portfolio/received-offers-table";
import { PortfolioActivity } from "@/components/portfolio/portfolio-activity";
import { AddressDisplay } from "@/components/shared/address-display";
import { Briefcase } from "lucide-react";
import { useUserOrders } from "@/hooks/use-orders";
import { markOffersAsSeen } from "@/hooks/use-unread-offers";

export default function PortfolioPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const address = user?.publicMetadata?.publicKey as string | undefined;
  const { orders } = useUserOrders(address ?? null);

  const receivedCount = orders.filter(
    (o) =>
      o.status === "ACTIVE" &&
      o.offer.itemType === "ERC20" &&
      o.offerer.toLowerCase() !== (address ?? "").toLowerCase()
  ).length;

  // All hooks must be called before any early returns
  useEffect(() => {
    const receivedOffers = orders.filter(
      (o) => o.status === "ACTIVE" && o.offer.itemType === "ERC20"
    );
    if (receivedOffers.length > 0) {
      markOffersAsSeen(receivedOffers.map((o) => o.orderHash));
    }
  }, [orders]);

  useEffect(() => {
    if (isLoaded && isSignedIn && !address) {
      router.replace("/onboarding?redirect_url=/portfolio");
    }
  }, [isLoaded, isSignedIn, address, router]);

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

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-muted-foreground text-sm">Your Starknet wallet:</p>
          <AddressDisplay address={address} chars={6} className="text-sm" />
        </div>
      </div>

      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="offers">Offers sent</TabsTrigger>
          <TabsTrigger value="received" className="gap-1.5">
            Offers received
            {receivedCount > 0 && (
              <span className="h-4 min-w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center px-1">
                {receivedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
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

        <TabsContent value="received" className="mt-6">
          <ReceivedOffersTable address={address} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <PortfolioActivity address={address} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
