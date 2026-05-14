import { cn } from "@/lib/utils";
import { RuneStone } from "./RuneStone";

interface Props {
  glyph: string;
  flipped: boolean;
  delayMs?: number;
  size?: "sm" | "md" | "lg";
  highlight?: boolean;
}

// 3D flip card revealing rune face
export function FlippableRune({ glyph, flipped, delayMs = 0, size = "md", highlight }: Props) {
  return (
    <div
      className={cn("perspective", {
        "w-14 h-20": size === "sm",
        "w-20 h-28": size === "md",
        "w-28 h-40": size === "lg",
      })}
    >
      <div
        className="relative h-full w-full preserve-3d transition-transform duration-[1100ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transitionDelay: `${delayMs}ms`,
        }}
      >
        <div className="absolute inset-0 backface-hidden">
          <RuneStone faceDown size={size} className="h-full w-full" />
        </div>
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <RuneStone glyph={glyph} size={size} glowing={highlight} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
