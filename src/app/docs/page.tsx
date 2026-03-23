import type { Metadata } from "next";
import Link from "next/link";
import { Code2, Users, Terminal, Network, MessageSquare, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Docs | Medialane",
  description: "Technical documentation, guidelines, and protocol specifications for Medialane.",
};

const SECTIONS = [
  {
    href: "/docs/developers",
    icon: Code2,
    title: "Developers",
    description: "API reference, SDK usage, authentication, and integration guides for building on top of Medialane.",
  },
  {
    href: "/docs/user-guidelines",
    icon: Users,
    title: "User Guidelines",
    description: "How to use the Medialane platform responsibly — account rules, content standards, and best practices.",
  },
  {
    href: "/docs/api",
    icon: Terminal,
    title: "API Docs",
    description: "Full REST API reference: endpoints, request shapes, authentication, rate limits, and response types.",
  },
  {
    href: "/docs/protocol",
    icon: Network,
    title: "Protocol",
    description: "Technical specification of the Medialane onchain protocol — contracts, events, data structures, and standards.",
  },
  {
    href: "/docs/community-guidelines",
    icon: MessageSquare,
    title: "Community Guidelines",
    description: "Rules for community participation, moderation standards, and how we handle violations.",
  },
];

export default function DocsPage() {
  return (
    <div className="space-y-10">
      <p className="text-muted-foreground leading-relaxed max-w-2xl">
        Everything you need to integrate with Medialane, understand the protocol, or
        participate in the community. Select a section to get started.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map(({ href, icon: Icon, title, description }) => (
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
