import Link from "next/link";
import { cn } from "@/lib/utils";
import { IP_TYPE_CONFIG } from "@/lib/ip-type-config";

interface IpTypeBadgeProps {
  ipType: string;
  size?: "sm" | "md";
  className?: string;
}

const SIZE = {
  sm: { container: "h-6 w-6", icon: "h-3 w-3" },
  md: { container: "h-8 w-8", icon: "h-4 w-4" },
};

export function IpTypeBadge({ ipType, size = "sm", className }: IpTypeBadgeProps) {
  const config = IP_TYPE_CONFIG.find(
    (c) => c.label === ipType || c.apiValue === ipType
  );
  if (!config) return null;

  const { icon: Icon, colorClass, bgClass, slug, label } = config;
  const { container, icon } = SIZE[size];

  return (
    <Link
      href={`/${slug}`}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "transition-opacity hover:opacity-80",
        bgClass,
        container,
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <Icon className={cn(colorClass, icon)} />
    </Link>
  );
}
