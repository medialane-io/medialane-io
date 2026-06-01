import { cn } from "@/lib/utils";

/** Segmented two/three-option toggle used across the create flows. */
export function ToggleGroup({
  value, options, onChange,
}: { value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden w-full">
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "flex-1 px-3 py-2 text-sm transition-colors",
            i > 0 && "border-l border-border",
            value === opt
              ? "bg-primary text-primary-foreground font-medium"
              : "bg-background hover:bg-muted text-muted-foreground",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/** Titled card section wrapper for the create forms. */
export function Section({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}
