import { useMemo } from "react";
import { useT } from "@medialane/ui/i18n";
import { DURATION_OPTIONS } from "@/lib/constants";

export function useDurationOptions() {
  const t = useT();
  return useMemo(() => DURATION_OPTIONS.map((option) => ({ ...option, label: t(option.label) })), [t]);
}
