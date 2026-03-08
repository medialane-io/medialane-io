import confetti from "canvas-confetti";

export function fireConfetti() {
  const count = 220;
  const defaults = { origin: { y: 0.6 }, zIndex: 9999 };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors: ["#a855f7", "#6366f1"] });
  fire(0.2,  { spread: 60,  colors: ["#10b981", "#34d399"] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#f59e0b", "#fbbf24"] });
  fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ["#ec4899"] });
  fire(0.1,  { spread: 120, startVelocity: 45, colors: ["#a855f7", "#6366f1"] });
}
