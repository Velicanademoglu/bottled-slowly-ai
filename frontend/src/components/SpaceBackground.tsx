import { useEffect, useState } from "react";

interface Star {
  id: number;
  left: string;
  top: string;
  size: number;
  delay: string;
  duration: string;
}

export default function SpaceBackground() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const generated: Star[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: `${Math.random() * 4}s`,
      duration: `${3 + Math.random() * 4}s`,
    }));
    setStars(generated);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-space-gradient overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration,
            opacity: 0.4,
          }}
        />
      ))}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-nebula-600/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cosmic-600/10 blur-[100px]" />
    </div>
  );
}
