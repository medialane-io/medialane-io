"use client";

import { useEffect, useState } from "react";

const LAUNCH_DATE = new Date("2026-03-14T00:00:00Z");

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getTimeLeft() {
  const diff = LAUNCH_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, launched: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    launched: false,
  };
}

function DigitBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 min-w-[3rem] sm:min-w-[3.75rem] text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        <span
          key={value}
          className="relative font-mono text-2xl sm:text-3xl font-bold tabular-nums block animate-fade-up"
        >
          {value}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-medium">
        {label}
      </span>
    </div>
  );
}

export function LaunchCountdown() {
  // Start with null to avoid SSR/client mismatch
  const [time, setTime] = useState<ReturnType<typeof getTimeLeft> | null>(null);

  useEffect(() => {
    setTime(getTimeLeft());
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) {
    // Server / pre-hydration placeholder — same dimensions, no text
    return (
      <div className="flex items-end gap-2 sm:gap-3">
        {["Days", "Hours", "Mins", "Secs"].map((label, i) => (
          <div key={label} className="flex items-end gap-2 sm:gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 min-w-[3rem] sm:min-w-[3.75rem] h-[52px] sm:h-[60px] animate-pulse" />
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-medium">
                {label}
              </span>
            </div>
            {i < 3 && (
              <span className="font-mono text-xl sm:text-2xl font-bold text-muted-foreground/50 pb-5 select-none">
                :
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (time.launched) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">
          Live on Starknet
        </span>
      </div>
    );
  }

  const units = [
    { label: "Days", value: pad(time.days) },
    { label: "Hours", value: pad(time.hours) },
    { label: "Mins", value: pad(time.minutes) },
    { label: "Secs", value: pad(time.seconds) },
  ];

  return (
    <div className="flex items-end gap-2 sm:gap-3">
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-end gap-2 sm:gap-3">
          <DigitBlock value={value} label={label} />
          {i < 3 && (
            <span className="font-mono text-xl sm:text-2xl font-bold text-muted-foreground/50 pb-5 select-none">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
