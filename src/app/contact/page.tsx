"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Mail, Send, Twitter, Loader2, CheckCircle } from "lucide-react";
import { sendContact } from "@/actions/send-contact";

type Step = "form" | "submitting" | "success";

export default function ContactPage() {
  const [step, setStep] = useState<Step>("form");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      subject: fd.get("subject") as string,
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      message: fd.get("message") as string,
    };

    setStep("submitting");
    const result = await sendContact(data);

    if (result.success) {
      setStep("success");
    } else {
      setStep("form");
      toast.error(result.error || "Failed to send message. Please try again.");
    }
  }

  return (
    <div className="container mx-auto px-4 pt-12 pb-16 max-w-4xl space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Reach Us</h1>
        <p className="text-muted-foreground leading-relaxed max-w-xl">
          Have a question, support request, partnership inquiry, or feedback? Fill out the form or mail us at{" "}
          <a href="mailto:dao@medialane.org" className="text-primary hover:underline">dao@medialane.org</a>{" "}
          and we&apos;ll get back to you as soon as possible.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Form */}
        <div>
          {step === "success" ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h2 className="text-lg font-semibold">Message sent!</h2>
              <p className="text-sm text-muted-foreground">
                Thank you for reaching out. We&apos;ll get back to you as soon as possible.
              </p>
              <Button variant="outline" onClick={() => setStep("form")}>Send another message</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <input
                  id="name"
                  name="name"
                  required
                  placeholder="Your name"
                  disabled={step === "submitting"}
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
                  disabled={step === "submitting"}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                <select
                  id="subject"
                  name="subject"
                  required
                  disabled={step === "submitting"}
                  defaultValue=""
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
                  disabled={step === "submitting"}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              <Button type="submit" className="w-full" disabled={step === "submitting"}>
                {step === "submitting" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                ) : (
                  "Send message"
                )}
              </Button>
            </form>
          )}
        </div>

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
                  <a href="mailto:dao@medialane.org" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    dao@medialane.org
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
                  <Send className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Telegram</p>
                  <a href="https://t.me/integrityweb" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    @IntegrityWeb
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bento-cell p-5 space-y-2">
            <p className="text-sm font-medium">Our contacts</p>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <p><a href="mailto:dao@medialane.org" className="text-primary hover:underline">dao@medialane.org</a></p>
              <p><a href="mailto:medialaneio@gmail.com" className="text-primary hover:underline">medialaneio@gmail.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
