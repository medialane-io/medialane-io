"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LaunchpadSignedOutStateProps {
  icon: ElementType;
  iconClassName: string;
  title: string;
  description: string;
}

export function LaunchpadSignedOutState({
  icon: Icon,
  iconClassName,
  title,
  description,
}: LaunchpadSignedOutStateProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.size ? `${pathname}?${searchParams.toString()}` : pathname;

  return (
    <div className="max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-4">
      <Icon className={`h-10 w-10 mx-auto ${iconClassName}`} />
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      <div className="btn-border-animated inline-block p-[1px] rounded-lg">
        <Button
          asChild
          className="bg-transparent text-white rounded-[7px] hover:bg-transparent hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Link href={`/connect?redirect_url=${encodeURIComponent(redirectTo)}`}>
            <Wallet className="h-4 w-4 mr-1.5" />
            Set up account
          </Link>
        </Button>
      </div>
    </div>
  );
}
