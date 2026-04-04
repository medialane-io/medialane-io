import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Medialane team — support, partnerships, and press inquiries.",
  openGraph: {
    title: "Contact Medialane",
    description: "Get in touch with the Medialane team — support, partnerships, and press inquiries.",
  },
  twitter: {
    card: "summary",
    title: "Contact Medialane",
    description: "Get in touch with the Medialane team.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
