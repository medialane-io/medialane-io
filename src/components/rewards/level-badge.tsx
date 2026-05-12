import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  name: string;
  badgeColor: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LevelBadge({ level, name, badgeColor, size = "md", className }: LevelBadgeProps) {
  const sizeClasses = {
    sm: "h-5 px-1.5 gap-1 text-[10px]",
    md: "h-6 px-2 gap-1.5 text-xs",
    lg: "h-8 px-3 gap-2 text-sm",
  };

  const dotSizes = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold tracking-tight whitespace-nowrap",
        sizeClasses[size],
        className
      )}
      style={{ borderColor: `${badgeColor}60`, backgroundColor: `${badgeColor}18`, color: badgeColor }}
    >
      <span className={cn("rounded-full shrink-0", dotSizes[size])} style={{ backgroundColor: badgeColor }} />
      Lv.{level} {name}
    </span>
  );
}
