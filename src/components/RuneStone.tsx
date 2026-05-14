import { cn } from "@/lib/utils";

interface RuneStoneProps {
  glyph?: string;
  size?: "sm" | "md" | "lg";
  faceDown?: boolean;
  glowing?: boolean;
  className?: string;
}

const SIZES = {
  sm: "w-14 h-20 text-3xl",
  md: "w-20 h-28 text-5xl",
  lg: "w-28 h-40 text-7xl",
};

// A stylized rune stone — front shows glyph, back shows mystical sigil
export function RuneStone({
  glyph,
  size = "md",
  faceDown = false,
  glowing = false,
  className,
}: RuneStoneProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-gold/30 flex items-center justify-center select-none transition-all duration-500",
        SIZES[size],
        faceDown ? "bg-stone-back" : "bg-stone",
        glowing && "rune-glow-strong",
        !glowing && !faceDown && "rune-glow",
        className,
      )}
      style={{
        backgroundBlendMode: "overlay",
      }}
    >
      {faceDown ? (
        <BackSigil />
      ) : (
        <span
          className="font-display text-gold text-glow leading-none"
          style={{ filter: "drop-shadow(0 0 8px oklch(0.85 0.13 80 / 0.5))" }}
        >
          {glyph}
        </span>
      )}

      {/* Decorative corner notches */}
      <span className="absolute top-1 left-1 h-2 w-2 border-l border-t border-gold/40" />
      <span className="absolute top-1 right-1 h-2 w-2 border-r border-t border-gold/40" />
      <span className="absolute bottom-1 left-1 h-2 w-2 border-l border-b border-gold/40" />
      <span className="absolute bottom-1 right-1 h-2 w-2 border-r border-b border-gold/40" />
    </div>
  );
}

function BackSigil() {
  return (
    <svg viewBox="0 0 60 80" className="w-3/5 h-3/5 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ color: "oklch(0.79 0.10 78)" }}>
      <circle cx="30" cy="40" r="18" />
      <path d="M30 22 L30 58 M12 40 L48 40 M18 28 L42 52 M42 28 L18 52" />
      <circle cx="30" cy="40" r="3" fill="currentColor" />
    </svg>
  );
}
