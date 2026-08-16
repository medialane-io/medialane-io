"use client";

import { useEffect } from "react";

export default function BrLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = "pt-BR";
    return () => {
      document.documentElement.lang = "en";
    };
  }, []);

  return children;
}
