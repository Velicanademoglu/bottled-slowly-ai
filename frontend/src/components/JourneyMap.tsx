import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface JourneyEvent {
  type: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  metadata?: string | null;
}

interface Props {
  events: JourneyEvent[];
  className?: string;
}

function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function interpolate(points: [number, number][], progress: number): [number, number] {
  if (points.length === 0) return [0, 0];
  if (points.length === 1 || progress <= 0) return points[0];
  if (progress >= 1) return points[points.length - 1];

  const segments: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = distanceKm(points[i], points[i + 1]);
    segments.push(d);
    total += d;
  }
  if (total === 0) return points[0];

  let traveled = 0;
  for (let i = 0; i < segments.length; i++) {
    const segStart = traveled / total;
    const segEnd = (traveled + segments[i]) / total;
    if (progress <= segEnd) {
      const local = (progress - segStart) / (segEnd - segStart);
      const a = points[i];
      const b = points[i + 1];
      return [a[0] + (b[0] - a[0]) * local, a[1] + (b[1] - a[1]) * local];
    }
    traveled += segments[i];
  }
  return points[points.length - 1];
}

function MapBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points as unknown as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 6 });
    } else if (points.length === 1) {
      map.setView(points[0], 3);
    }
  }, [map, points]);
  return null;
}

function TravelingDot({ points }: { points: [number, number][] }) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    let raf = 0;
    const duration = Math.max(6000, points.length * 2500);
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const p = (elapsed % duration) / duration;
      setProgress(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [points.length]);

  if (points.length < 2) return null;
  const pos = interpolate(points, progress);
  return (
    <CircleMarker
      center={pos}
      radius={8}
      pathOptions={{ color: "#FCD34D", fillColor: "#FCD34D", fillOpacity: 1 }}
      className="animate-pulse"
    >
      <Popup>Your message is traveling ✨</Popup>
    </CircleMarker>
  );
}

export default function JourneyMap({ events, className = "" }: Props) {
  const ordered = useMemo(
    () => [...events].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [events]
  );

  const points = useMemo(
    () =>
      ordered
        .filter((e): e is JourneyEvent & { lat: number; lng: number } => e.lat != null && e.lng != null)
        .map((e) => [e.lat, e.lng] as [number, number]),
    [ordered]
  );

  if (points.length === 0) {
    return (
      <div className={`card flex items-center justify-center text-gray-400 ${className}`}>
        No journey coordinates yet.
      </div>
    );
  }

  const center = points[0];

  return (
    <div className={`card overflow-hidden ${className}`}>
      <MapContainer center={center} zoom={2} scrollWheelZoom={false} className="w-full h-full min-h-[260px] dark-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds points={points} />
        <Polyline positions={points} pathOptions={{ color: "#38BDF8", weight: 2, opacity: 0.8, dashArray: "6 8" }} />
        {points.map((p, i) => {
          const isStart = i === 0;
          const isEnd = i === points.length - 1;
          return (
            <CircleMarker
              key={i}
              center={p}
              radius={isStart || isEnd ? 7 : 4}
              pathOptions={{
                color: isStart ? "#8B5CF6" : isEnd ? "#FCD34D" : "#0EA5E9",
                fillColor: isStart ? "#8B5CF6" : isEnd ? "#FCD34D" : "#0EA5E9",
                fillOpacity: 1,
              }}
            >
              <Popup>
                {ordered[i]?.type || "stop"}: {ordered[i]?.country || "unknown"}
              </Popup>
            </CircleMarker>
          );
        })}
        <TravelingDot points={points} />
      </MapContainer>
    </div>
  );
}
