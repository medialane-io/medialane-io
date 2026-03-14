import type { ElementType } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const LEARN_LINKS = [
  { label: "NFT Fundamentals", href: "/learn/nft" },
  { label: "Creator Launchpad", href: "/learn/creator-launchpad" },
  { label: "Programmable Licensing", href: "/learn/programmable-licensing" },
];

const DOCS_LINKS = [
  { label: "API Reference", href: "/docs/api" },
  { label: "Protocol & Contracts", href: "/docs/protocol" },
  { label: "Developer Guide", href: "/docs/developers" },
];

function CtaCard({
  icon: Icon,
  title,
  description,
  links,
  href,
  gradient,
}: {
  icon: ElementType;
  title: string;
  description: string;
  links: { label: string; href: string }[];
  href: string;
  gradient: string;
}) {
  return (
    <div className="bento-cell p-6 sm:p-8 flex flex-col gap-5 relative overflow-hidden">
      {/* Subtle gradient tint */}
      <div className={`absolute inset-0 opacity-5 ${gradient} pointer-events-none`} />

      <div className="relative z-10 space-y-2">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      <ul className="relative z-10 space-y-1.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="relative z-10 mt-auto">
        <Button variant="outline" size="sm" asChild>
          <Link href={href}>
            Explore {title} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function LearnDocsCta() {
  return (
    <section className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">Learn &amp; Build</h2>
        <p className="text-sm text-muted-foreground">
          Everything you need to create, collect, and build on Medialane.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CtaCard
          icon={BookOpen}
          title="Learn"
          description="Understand NFTs, programmable IP licensing, blockchain basics, and how to grow as a creator on Medialane."
          links={LEARN_LINKS}
          href="/learn"
          gradient="bg-gradient-to-br from-brand-purple to-brand-blue"
        />
        <CtaCard
          icon={FileCode2}
          title="Docs"
          description="Integrate with the Medialane API, deploy smart contracts, and build applications on top of our protocol."
          links={DOCS_LINKS}
          href="/docs"
          gradient="bg-gradient-to-br from-brand-blue to-brand-navy"
        />
      </div>
    </section>
  );
}
