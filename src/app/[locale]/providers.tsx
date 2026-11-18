"use client";

import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip";
import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect } from "react";
import { SelfFundConsentDialog, setUploadDiagnosticsReporter, MedialaneAppProvider, IpfsGatewayFallback, PINATA_PUBLIC_GATEWAY } from "@medialane/ui";
import { OnboardingGate } from "@/components/wallet/onboarding-gate";
import { AppShell } from "@/components/app-shell";
import { IPFS_GATEWAY } from "@/lib/constants";
import { walletConsent } from "@/lib/wallet/client";
import { sendUploadDiagnostics } from "@/lib/upload-diagnostics";
import { useAppAdapter } from "@/lib/use-app-adapter";

const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

function AppAdapter({ children }: { children: React.ReactNode }) {
  return <MedialaneAppProvider value={useAppAdapter()}>{children}</MedialaneAppProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setUploadDiagnosticsReporter(sendUploadDiagnostics);
    return () => setUploadDiagnosticsReporter(null);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={300}>
        <SWRConfig
          value={{
            onError: (err: unknown) => {
              const status =
                err && typeof err === "object" && "status" in err && typeof (err as { status: unknown }).status === "number"
                  ? (err as { status: number }).status
                  : null;
              if (status === 404) return;

              console.error("request failed", err);
            },
          }}
        >
          {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
          <IpfsGatewayFallback primary={IPFS_GATEWAY} fallback={PINATA_PUBLIC_GATEWAY} />
          <OnboardingGate />
          <AppAdapter>
            <AppShell>{children}</AppShell>
          </AppAdapter>
          <SelfFundConsentDialog consent={walletConsent} />
        </SWRConfig>
      </TooltipProvider>
    </ThemeProvider>
  );
}
