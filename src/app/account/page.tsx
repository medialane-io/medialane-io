"use client";

import { ChipiWalletPanel } from "@/components/wallet/chipi-wallet-panel";

export default function AccountPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground">
          Manage your Chipi wallet and account settings.
        </p>
      </header>

      <ChipiWalletPanel />
    </main>
  );
}

