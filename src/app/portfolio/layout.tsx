import type { Metadata } from "next";
import { PortfolioShell } from "./portfolio-shell";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <PortfolioShell>{children}</PortfolioShell>;
}
