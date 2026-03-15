import { AlertTriangle } from "lucide-react";

export function HiddenContentBanner() {
  return (
    <div className="w-full bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 flex items-start gap-3 mb-6">
      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
      <p className="text-sm text-destructive leading-relaxed">
        This content has been hidden from Medialane by the DAO following a
        community report. If you believe this is an error, you can{" "}
        <a
          href="mailto:dao@medialane.xyz"
          className="underline font-medium hover:no-underline"
        >
          contact the DAO
        </a>
        .
      </p>
    </div>
  );
}
