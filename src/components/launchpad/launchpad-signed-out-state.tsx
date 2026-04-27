"use client";

import type { ElementType } from "react";

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
  return (
    <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-4">
      <Icon className={`h-10 w-10 mx-auto ${iconClassName}`} />
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
