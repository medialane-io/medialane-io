"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

export const SPRING = { type: "spring", stiffness: 400, damping: 28 } as const;
export const EASE_OUT = [0.25, 0.46, 0.45, 0.94] as const;

// ─── Press-able card wrapper ──────────────────────────────────────────────────
// Replaces hover effects with a native-feeling press scale (good for mobile)

interface MotionCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function MotionCard({ children, className, ...props }: MotionCardProps) {
  return (
    <motion.div
      className={className}
      whileTap={{ scale: 0.96 }}
      transition={SPRING}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Scroll-triggered fade-in ─────────────────────────────────────────────────

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export function FadeIn({ children, className, delay = 0, y = 20 }: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger container ────────────────────────────────────────────────────────

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function Stagger({ children, className, staggerDelay = 0.07 }: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Kinetic headline words ───────────────────────────────────────────────────

export function KineticWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <motion.span
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          variants={{
            hidden: { opacity: 0, y: 24, rotateX: -20 },
            show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.5, ease: EASE_OUT } },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}
