import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Home, Store } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
      <div className="space-y-2">
        <p className="text-8xl font-black text-muted-foreground/20 select-none leading-none">404</p>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          This page doesn&apos;t exist, or the asset may have been removed.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/marketplace">
            <Store className="h-4 w-4 mr-2" />
            Marketplace
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/search">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Link>
        </Button>
      </div>
    </div>
  );
}
