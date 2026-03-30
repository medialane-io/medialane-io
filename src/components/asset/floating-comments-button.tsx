"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { MessageCircle } from "lucide-react"

interface FloatingCommentsButtonProps {
  onClick: () => void
  commentTotal: number
}

export function FloatingCommentsButton({ onClick, commentTotal }: FloatingCommentsButtonProps) {
  const [expanded, setExpanded] = useState(true)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setExpanded(false)
      return
    }
    const timer = setTimeout(() => setExpanded(false), 2500)
    return () => clearTimeout(timer)
  }, [prefersReducedMotion])

  return (
    <div className="fixed bottom-6 right-6 z-40 relative">
      <motion.button
        onClick={onClick}
        aria-label="Open on-chain comments"
        animate={{ width: expanded ? 192 : 56 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex items-center justify-center gap-2 h-14 rounded-2xl border border-border bg-card/95 backdrop-blur-sm shadow-md hover:shadow-lg hover:bg-accent overflow-hidden active:scale-95"
      >
        <MessageCircle className="h-5 w-5 text-foreground flex-shrink-0" />
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="text-sm font-medium text-foreground whitespace-nowrap"
            >
              Onchain comments
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      {commentTotal > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white pointer-events-none"
          style={{ background: "hsl(var(--brand-blue))" }}
        >
          {commentTotal}
        </span>
      )}
    </div>
  )
}
