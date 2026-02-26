"use client";

import { ChipiProvider } from "@chipi-stack/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <ChipiProvider apiPublicKey={process.env.NEXT_PUBLIC_CHIPI_API_KEY!}>
        {children}
        <Toaster richColors position="bottom-right" />
      </ChipiProvider>
    </ThemeProvider>
  );
}
