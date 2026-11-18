"use client";

import Link from "next/link";
import { Button } from "@medialane/ui/button";
import { Search, Home, Store } from "lucide-react";
import { useT } from "@medialane/ui/i18n";

export default function NotFound() {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
      <div className="space-y-2">
        <p className="text-8xl font-black text-muted-foreground/20 select-none leading-none">404</p>
        <h1 className="text-2xl font-bold">{t("Page not found")}</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          {t("This page doesn't exist, or the asset may have been removed.")}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            {t("Start")}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/marketplace">
            <Store className="h-4 w-4 mr-2" />
            {t("Marketplace")}
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/search">
            <Search className="h-4 w-4 mr-2" />
            {t("Search")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
