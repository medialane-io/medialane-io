"use client";

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeForInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function roundUpToQuarterHour(date: Date): Date {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const minutes = rounded.getMinutes();
  const delta = (15 - (minutes % 15)) % 15 || 15;
  rounded.setMinutes(minutes + delta);
  return rounded;
}

export function getDefaultDropSchedule(now = new Date()) {
  const start = roundUpToQuarterHour(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 0, 0);

  return {
    startDate: formatDateForInput(start),
    startTime: formatTimeForInput(start),
    endDate: formatDateForInput(end),
    endTime: formatTimeForInput(end),
  };
}

export function getDefaultClaimWindow(daysFromNow = 30, now = new Date()) {
  const end = new Date(now);
  end.setDate(end.getDate() + daysFromNow);
  end.setHours(23, 59, 0, 0);

  return {
    claimEndDate: formatDateForInput(end),
    claimEndTime: formatTimeForInput(end),
  };
}

export function suggestLaunchpadSymbol(name: string, maxLength = 10): string {
  const cleaned = name.toUpperCase().replace(/[^A-Z0-9 ]+/g, " ").trim();
  if (!cleaned) return "";

  const words = cleaned.split(/\s+/).filter(Boolean);
  const initials = words
    .filter((word) => /[A-Z0-9]/.test(word))
    .map((word) => word[0])
    .join("");
  const digits = words.join("").replace(/[^0-9]/g, "");

  let candidate = `${initials}${digits}`.slice(0, maxLength);
  if (candidate.length < 3) {
    candidate = words.join("").replace(/\s+/g, "").slice(0, maxLength);
  }

  return candidate.slice(0, maxLength);
}
