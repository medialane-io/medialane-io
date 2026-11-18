"use client";

import Link from "@medialane/ui/link";
import { MedialaneLogoFull as MedialaneLogo } from "@medialane/ui/brand-logo";
import { msg, useT } from "@medialane/ui/i18n";

const LINKS = [
  { label: msg("Trade"), href: "/marketplace" },
  { label: msg("Launch"), href: "/launchpad" },
  { label: msg("Docs"), href: "https://docs.medialane.io" },
  { label: msg("Terms"), href: "https://docs.medialane.io/guidelines/terms" },
  { label: msg("Privacy"), href: "https://docs.medialane.io/guidelines/privacy" },
  { label: "X", href: "https://x.com/medialane_io" },
];

const LINK_CLASS = "hover:text-foreground transition-colors";

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="px-4 sm:px-6 lg:px-8 py-8 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p className="text-xs">© {new Date().getFullYear()} Medialane DAO</p>
        <nav className="flex items-center gap-4 flex-wrap justify-center">
          {LINKS.map(({ label, href }) =>
            href.startsWith("/") ? (
              <Link key={href} href={href} className={LINK_CLASS}>
                {t(label)}
              </Link>
            ) : (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                {t(label)}
              </a>
            ),
          )}
        </nav>
        <div className="flex items-center gap-2">
          <MedialaneLogo />
        </div>
      </div>
    </footer>
  );
}
