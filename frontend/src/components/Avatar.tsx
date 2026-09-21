import type { ReactNode } from "react";

export const AVATAR_PRESETS = [
  { key: "comet", icon: "☄️" },
  { key: "star", icon: "⭐" },
  { key: "planet", icon: "🪐" },
  { key: "moon", icon: "🌙" },
  { key: "sun", icon: "🌞" },
  { key: "alien", icon: "👽" },
  { key: "rocket", icon: "🚀" },
  { key: "crystal", icon: "🔮" },
  { key: "ghost", icon: "👻" },
  { key: "robot", icon: "🤖" },
  { key: "cat", icon: "🐱" },
  { key: "fox", icon: "🦊" },
];

interface Props {
  url?: string | null;
  preset?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children?: ReactNode;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-20 h-20 text-xl",
  xl: "w-32 h-32 text-3xl",
};

export default function Avatar({ url, preset, name, size = "md", className = "", children }: Props) {
  const initial = name?.charAt(0).toUpperCase() || "?";
  const presetIcon = AVATAR_PRESETS.find((p) => p.key === preset)?.icon || initial;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-nebula-500 to-cosmic-500 text-white font-semibold shadow-soft overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="select-none">{preset ? presetIcon : initial}</span>
      )}
      {children}
    </div>
  );
}

export function getPresetIcon(key?: string | null): string {
  return AVATAR_PRESETS.find((p) => p.key === key)?.icon || "?";
}
