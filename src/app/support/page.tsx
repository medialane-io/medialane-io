"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, LifeBuoy } from "lucide-react";
import Link from "next/link";

const FAQS = [
  {
    q: "How do I create a wallet on Medialane?",
    a: "Sign in with your email or social account. Medialane automatically creates a Starknet wallet for you via ChipiPay — no browser extension or seed phrase required. You'll be prompted to set a PIN during onboarding.",
  },
  {
    q: "I forgot my PIN. What do I do?",
    a: "Your PIN is used to encrypt your session key. If you forget it, you can generate a new session key from the onboarding flow. Your wallet and assets are never lost — they are tied to your authentication identity, not your PIN. If your device supports biometrics, you can also set up Passkey authentication to sign transactions without a PIN.",
  },
  {
    q: "Can I use passkeys instead of a PIN?",
    a: "Yes. If your device supports WebAuthn (Face ID, Touch ID, Windows Hello, or a hardware security key), you can authenticate transactions with a passkey instead of entering your PIN each time. Set it up from Portfolio → Settings or during the session setup flow.",
  },
  {
    q: "My NFT minted but doesn't appear in my Portfolio.",
    a: "The Medialane indexer processes new blocks every ~6 seconds. If your asset doesn't appear within 1–2 minutes, try refreshing the page. If the issue persists after 5 minutes, contact support with your transaction hash.",
  },
  {
    q: "I listed an asset but the listing isn't showing in the Marketplace.",
    a: "Listings appear once the indexer processes the block containing your transaction. This typically takes under 30 seconds. If not visible after 2 minutes, check your Portfolio → Listings to confirm the listing was recorded.",
  },
  {
    q: "Can I cancel a listing or offer?",
    a: "Yes. Go to Portfolio → Listings (for your listings) or Portfolio → Offers sent (for your offers). Click Cancel on any active order. Cancellation is an onchain transaction and may require a small gas fee.",
  },
  {
    q: "My session expired. Do I lose my assets?",
    a: "No. Session keys expire for security (typically after 6 hours) but have no effect on your assets or wallet. Simply re-enter your PIN to start a new session and continue trading.",
  },
  {
    q: "What currencies does Medialane support?",
    a: "Medialane supports STRK, ETH, USDC, USDT, and WBTC on Starknet mainnet for marketplace listings and offers. You can filter the marketplace by token and set prices in any supported currency.",
  },
  {
    q: "How do royalties work?",
    a: "Royalties are configured by the creator at mint time and enforced by the marketplace smart contract on every sale. They are distributed automatically to the creator's wallet at settlement — no manual claim required.",
  },
  {
    q: "I think someone copied my work. How do I report it?",
    a: "Send a DMCA notice to dmca@medialane.io with links to the infringing content, your original work, and a statement of ownership. We aim to respond within 3 business days.",
  },
  {
    q: "What is the POP Protocol and how do I claim a credential?",
    a: "The POP Protocol issues soulbound (non-transferable) NFTs as proof-of-participation for events, communities, and milestones. To claim one, go to Launchpad → POP Protocol, find an active event you participated in, and click Claim. It's free — gas is sponsored. Claimed credentials appear in your Portfolio.",
  },
  {
    q: "How do I participate in a Collection Drop?",
    a: "Go to Launchpad → Collection Drop to see active and upcoming drops. Click Mint on a drop you're eligible for, confirm with your PIN, and the NFT is sent to your wallet. Drop eligibility is enforced onchain — if your wallet is on the allowlist, you'll see the option automatically.",
  },
  {
    q: "Is Medialane available worldwide?",
    a: "Medialane is a decentralised platform accessible globally. However, some features may be restricted based on local regulations. Users are responsible for compliance with the laws of their jurisdiction.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bento-cell overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span>{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Support ticket submitted! We'll be in touch shortly.");
      (e.target as HTMLFormElement).reset();
    }, 800);
  }

  return (
    <div className="container mx-auto px-4 pt-12 pb-16 max-w-5xl space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Support</h1>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Check the FAQ below for quick answers. If you can&apos;t find what you&apos;re looking for,
          submit a support ticket and we&apos;ll get back to you.
        </p>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQS.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>

      {/* Ticket form */}
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Still need help?</h2>
          <p className="text-sm text-muted-foreground">
            Submit a support ticket and a team member will respond within 1–2 business days.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="support-name" className="text-sm font-medium">Name</label>
              <input
                id="support-name"
                name="name"
                required
                placeholder="Your name"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="support-email" className="text-sm font-medium">Email</label>
              <input
                id="support-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="support-category" className="text-sm font-medium">Category</label>
            <select
              id="support-category"
              name="category"
              required
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="" disabled>Select a category</option>
              <option value="account">Account / login</option>
              <option value="wallet">Wallet / PIN</option>
              <option value="minting">Minting issue</option>
              <option value="marketplace">Marketplace / trading</option>
              <option value="missing">Missing asset or listing</option>
              <option value="pop">POP Protocol / credentials</option>
              <option value="drop">Collection Drop</option>
              <option value="technical">Technical / API</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="support-message" className="text-sm font-medium">
              Describe your issue
            </label>
            <textarea
              id="support-message"
              name="message"
              required
              rows={5}
              placeholder="Please include any relevant transaction hashes, wallet addresses, or screenshots..."
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit ticket"}
          </Button>
        </form>
      </div>

      <p className="text-xs text-muted-foreground">
        For copyright / DMCA notices email{" "}
        <a href="mailto:dmca@medialane.io" className="text-primary hover:underline">dmca@medialane.io</a>.
        For general contact see the{" "}
        <Link href="/contact" className="text-primary hover:underline">Contact page</Link>.
      </p>
    </div>
  );
}
