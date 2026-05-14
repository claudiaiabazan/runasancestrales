// Mystical fog + golden particles overlay (purely decorative)
export function Atmosphere() {
  // Generate particles deterministically
  const particles = Array.from({ length: 22 }, (_, i) => {
    const left = (i * 37) % 100;
    const delay = (i * 1.7) % 18;
    const duration = 14 + ((i * 3) % 16);
    const size = 2 + (i % 4);
    return { left, delay, duration, size, key: i };
  });

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Fog layers */}
      <div
        className="absolute inset-x-0 bottom-0 h-[50vh] opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 30% 100%, oklch(0.32 0.02 155 / 0.45), transparent 60%), radial-gradient(ellipse at 70% 100%, oklch(0.30 0.025 70 / 0.35), transparent 60%)",
          animation: "fog-drift 22s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-[40vh] opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, oklch(0.26 0.03 260 / 0.5), transparent 70%)",
          animation: "fog-drift 28s ease-in-out infinite alternate-reverse",
        }}
      />

      {/* Golden particles */}
      {particles.map((p) => (
        <span
          key={p.key}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: `-20px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: "radial-gradient(circle, oklch(0.85 0.13 80 / 0.9), transparent 70%)",
            boxShadow: "0 0 8px oklch(0.85 0.13 80 / 0.6)",
            animation: `drift-up ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
