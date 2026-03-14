"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Twitter } from "lucide-react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // TODO: wire up form submission
    setTimeout(() => {
      setLoading(false);
      toast.success("Message received! We'll get back to you soon.");
      (e.target as HTMLFormElement).reset();
    }, 800);
  }

  return (
    <div className="container mx-auto px-4 pt-12 pb-16 max-w-4xl space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="text-muted-foreground leading-relaxed max-w-xl">
          Have a question, partnership inquiry, or feedback? Fill out the form and we&apos;ll
          get back to you as soon as possible.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <input
              id="name"
              name="name"
              required
              placeholder="Your name"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="subject" className="text-sm font-medium">Subject</label>
            <select
              id="subject"
              name="subject"
              required
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Select a subject</option>
              <option value="general">General enquiry</option>
              <option value="partnership">Partnership / collaboration</option>
              <option value="press">Press / media</option>
              <option value="legal">Legal / DMCA</option>
              <option value="developer">Developer integration</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="message" className="text-sm font-medium">Message</label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder="Tell us how we can help..."
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send message"}
          </Button>
        </form>

        {/* Contact info */}
        <div className="space-y-6 pt-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Get in touch</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a href="mailto:hello@medialane.io" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    hello@medialane.io
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Twitter className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">X (Twitter)</p>
                  <a href="https://x.com/medialane_io" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    @medialane_io
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Based on Starknet</p>
                  <p className="text-sm text-muted-foreground">Decentralised globally</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bento-cell p-5 space-y-2">
            <p className="text-sm font-medium">Specific enquiries</p>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <p><a href="mailto:legal@medialane.io" className="text-primary hover:underline">legal@medialane.io</a> — Terms, legal matters</p>
              <p><a href="mailto:dmca@medialane.io" className="text-primary hover:underline">dmca@medialane.io</a> — Copyright / DMCA</p>
              <p><a href="mailto:privacy@medialane.io" className="text-primary hover:underline">privacy@medialane.io</a> — Privacy requests</p>
              <p><a href="mailto:dev@medialane.io" className="text-primary hover:underline">dev@medialane.io</a> — Developer / API access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
