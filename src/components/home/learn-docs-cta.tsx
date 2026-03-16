import type { ElementType } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  iconGradient,
}: {
  icon: ElementType;
  title: string;
  description: string;
  links: { label: string; href: string }[];
  href: string;
  gradient: string;
  iconGradient: string;
}) {
  return (
    <div className="bento-cell p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden group hover:border-border/80 transition-colors">
      <div className={`absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity ${gradient} pointer-events-none`} />

      <div className="relative z-10 space-y-3">
        <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg", iconGradient)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-black">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">{description}</p>
        </div>
      </div>

      <ul className="relative z-10 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group/link"
            >
              <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0 -ml-0.5" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="relative z-10 mt-auto">
        <Button variant="outline" size="sm" asChild className="group-hover:border-primary/40 transition-colors">
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
    <section className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CtaCard
          icon={BookOpen}
          title="Learn"
          description="Understand NFTs, programmable IP licensing, and how to grow as a creator on Medialane."
          links={LEARN_LINKS}
          href="/learn"
          gradient="bg-gradient-to-br from-brand-purple to-brand-blue"
          iconGradient="bg-gradient-to-br from-violet-500 to-indigo-600 shadow-violet-500/20"
        />
        <CtaCard
          icon={FileCode2}
          title="Docs"
          description="Integrate with the Medialane API, deploy smart contracts, and build on our protocol."
          links={DOCS_LINKS}
          href="/docs"
          gradient="bg-gradient-to-br from-brand-blue to-brand-navy"
          iconGradient="bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/20"
        />
      </div>
    </section>
  );
}
