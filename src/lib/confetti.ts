import confetti from "canvas-confetti";

export function fireConfetti() {
  const defaults = { zIndex: 9999, colors: ["#a855f7", "#6366f1", "#10b981", "#f59e0b", "#ec4899"] };

  // Initial burst from centre
  confetti({ ...defaults, particleCount: 80, spread: 70, origin: { y: 0.6 } });

  // Delayed cannons from each side
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.65 } });
    confetti({ ...defaults, particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 } });
  }, 150);

  setTimeout(() => {
    confetti({ ...defaults, particleCount: 40, spread: 100, decay: 0.91, scalar: 0.8, origin: { y: 0.55 } });
  }, 350);
}
