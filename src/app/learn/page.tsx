import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Image, Rocket, Store, Globe, Shield, FileText, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Learn | Medialane",
  description: "Learn about NFTs, IP protection, blockchain technology, and how the Medialane platform works.",
};

const TOPICS = [
  {
    href: "/learn/nft",
    icon: Image,
    title: "What is an NFT?",
    description: "Understand non-fungible tokens — what they are, how they work, and why they matter for creators and IP owners.",
  },
  {
    href: "/learn/creator-launchpad",
    icon: Rocket,
    title: "Creator Launchpad",
    description: "Learn how to deploy your own collection, mint IP assets, and launch your creative work on Medialane.",
  },
  {
    href: "/learn/marketplace",
    icon: Store,
    title: "Marketplace",
    description: "Discover how to list, buy, sell, and make offers on IP assets in the Medialane marketplace.",
  },
  {
    href: "/learn/web3",
    icon: Globe,
    title: "Web3 & Starknet",
    description: "A beginner-friendly introduction to blockchain technology, Starknet, and zero-knowledge proofs.",
  },
  {
    href: "/learn/protect-your-ip",
    icon: Shield,
    title: "Protect Your IP",
    description: "Understand the Berne Convention, copyright principles, and how Medialane helps creators protect their intellectual property.",
  },
  {
    href: "/learn/programmable-licensing",
    icon: FileText,
    title: "Programmable Licensing",
    description: "Explore Medialane's onchain licensing system — Creative Commons variants, AI policy, royalties, and derivative rules.",
  },
];

export default function LearnPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">Knowledge Base</span>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Whether you&apos;re a creator exploring blockchain for the first time or a developer
          building on top of the Medialane protocol, this section covers everything you need
          to get started and go deeper.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOPICS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group bento-cell p-5 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{title}</p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
