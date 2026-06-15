"use client";

import { useEffect, useState } from "react";

function parts(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: Math.floor(s % 60),
  };
}

// Counts down to a unix-seconds target (phase start when upcoming, phase end when live).
export function DropCountdown({ targetTs, label }: { targetTs: number; label: string }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const { d, h, m, s } = parts(targetTs - now);
  const cell = (value: number, unit: string) => (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-black tabular-nums leading-none">{String(value).padStart(2, "0")}</span>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{unit}</span>
    </div>
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">{label}</p>
      <div className="flex items-center gap-3">
        {d > 0 && (<>{cell(d, "days")}<span className="text-xl text-muted-foreground/40">:</span></>)}
        {cell(h, "hrs")}
        <span className="text-xl text-muted-foreground/40">:</span>
        {cell(m, "min")}
        <span className="text-xl text-muted-foreground/40">:</span>
        {cell(s, "sec")}
      </div>
    </div>
  );
}
