"use client";

const COLORS = ["#6366f1", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

interface Piece {
  id: number;
  left: number;
  delay: number;
  color: string;
  duration: number;
  drift: number;
}

function makePieces(seed: number): Piece[] {
  return Array.from({ length: 48 }, (_, i) => ({
    id: seed * 1000 + i,
    left: (i * 37 + seed * 13) % 100,
    delay: (i % 8) * 0.06,
    color: COLORS[i % COLORS.length],
    duration: 1.2 + ((i * 7 + seed) % 10) * 0.12,
    drift: ((i % 5) - 2) * 60 + (seed % 3) * 20,
  }));
}

export function Confetti({ burst }: { burst: number }) {
  if (!burst) return null;
  const pieces = makePieces(burst);

  return (
    <div
      key={burst}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block h-3 w-2 rounded-sm"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
