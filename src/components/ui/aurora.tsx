"use client";

// Ambient aurora background — place in layout, renders behind all content
export function Aurora({ intensity = "normal" }: { intensity?: "subtle" | "normal" | "vivid" }) {
  const scale = intensity === "subtle" ? 0.6 : intensity === "vivid" ? 1.4 : 1;

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Purple — top-left quadrant */}
      <div
        className="aurora-purple animate-blob"
        style={{
          width: `${60 * scale}vw`,
          height: `${50 * scale}vw`,
          top: "-15vw",
          left: "-10vw",
        }}
      />
      {/* Blue — top-right quadrant */}
      <div
        className="aurora-blue animate-blob-slow"
        style={{
          width: `${50 * scale}vw`,
          height: `${45 * scale}vw`,
          top: "-10vw",
          right: "-15vw",
        }}
      />
      {/* Rose — bottom-left */}
      <div
        className="aurora-rose animate-blob"
        style={{
          width: `${35 * scale}vw`,
          height: `${30 * scale}vw`,
          bottom: "10vw",
          left: "5vw",
          animationDelay: "3s",
        }}
      />
      {/* Orange — bottom-right */}
      <div
        className="aurora-orange animate-blob-slow"
        style={{
          width: `${30 * scale}vw`,
          height: `${28 * scale}vw`,
          bottom: "5vw",
          right: "0",
          animationDelay: "1.5s",
        }}
      />
    </div>
  );
}

