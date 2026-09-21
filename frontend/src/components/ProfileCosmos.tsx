import { useMemo } from "react";

interface Props {
  level?: number;
  gravity?: number;
  className?: string;
}

export default function ProfileCosmos({ level = 1, gravity = 500, className = "" }: Props) {
  const stars = useMemo(() => {
    const count = 18 + (level || 1) * 8 + Math.min(20, Math.floor((gravity || 500) / 50));
    return Array.from({ length: count }).map((_, i) => {
      const delay = (i * 0.9) % 4;
      const duration = 2 + ((i * 13) % 5);
      const size = 1 + ((i * 7) % 3);
      const top = ((i * 37) % 100);
      const left = ((i * 19) % 100);
      const opacity = 0.2 + ((i * 11) % 80) / 100;
      return { id: i, delay, duration, size, top, left, opacity };
    });
  }, [level, gravity]);

  const nebulas = useMemo(() => {
    const count = Math.min(5, Math.max(1, Math.floor((level || 1) / 2)));
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      top: 10 + ((i * 41) % 60),
      left: 5 + ((i * 31) % 80),
      color:
        i % 3 === 0
          ? "from-nebula-500/10 to-cosmic-500/5"
          : i % 3 === 1
          ? "from-star-400/10 to-nebula-500/5"
          : "from-cosmic-400/10 to-star-400/5",
    }));
  }, [level]);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {nebulas.map((n) => (
        <div
          key={n.id}
          className={`absolute w-40 h-40 rounded-full blur-3xl bg-gradient-to-br ${n.color} animate-pulse-slow`}
          style={{ top: `${n.top}%`, left: `${n.left}%` }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)] animate-twinkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
