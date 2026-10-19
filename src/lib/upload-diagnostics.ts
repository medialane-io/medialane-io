"use client";

import type { UploadDiagnostics } from "@medialane/ui";

export function sendUploadDiagnostics(diagnostics: UploadDiagnostics): void {
  void fetch("/api/upload-diagnostics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(diagnostics),
    keepalive: true,
  }).catch(() => {});
}
