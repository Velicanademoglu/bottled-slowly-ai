import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Phone, PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff } from "lucide-react";
import Avatar from "./Avatar";

interface Props {
  kind: "voice" | "video";
  peerName: string;
  peerAvatar?: string | null;
  onEnd: () => void;
}

// Subscription-gated call experience. Opens the device camera/microphone for a
// live preview and runs the call session (signaling-based P2P lands later).
export default function CallOverlay({ kind, peerName, peerAvatar, onEnd }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(kind === "video");
  const [seconds, setSeconds] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: kind === "video" ? { facingMode: "user" } : false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        if (!cancelled) setMediaError(true);
      } finally {
        if (!cancelled) setConnecting(false);
      }
    };
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, [kind]);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  };

  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 bg-space-950 text-white flex flex-col items-center justify-between py-10 px-4">
      <div className="text-center mt-6">
        <p className="text-lg font-semibold">{peerName}</p>
        <p className="text-sm text-gray-400 mt-1">
          {connecting ? t("call.connecting") : `${mm}:${ss}`}
        </p>
      </div>

      <div className="relative flex-1 w-full max-w-sm flex items-center justify-center">
        {kind === "video" && !mediaError && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-h-[55vh] object-cover rounded-3xl border border-white/10"
          />
        )}
        {(kind === "voice" || mediaError) && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 animate-pulse">
              <Avatar url={peerAvatar ?? undefined} name={peerName} size="xl" />
            </div>
            {mediaError && kind === "video" && (
              <p className="text-xs text-amber-300 text-center max-w-[16rem]">{t("call.noCamera")}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${micOn ? "bg-white/10" : "bg-red-500/80"}`}
          title={micOn ? t("call.mute") : t("call.unmute")}
        >
          {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        {kind === "video" && (
          <button
            onClick={toggleCam}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${camOn ? "bg-white/10" : "bg-red-500/80"}`}
            title={camOn ? t("call.camOff") : t("call.camOn")}
          >
            {camOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
        )}
        <button
          onClick={onEnd}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30"
          title={t("call.end")}
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <Phone className="w-3.5 h-3.5" /> {kind === "video" ? t("premium.videoTierTitle") : t("premium.voiceTierTitle")} · {t("call.subscriptionActive")}
      </p>
    </div>
  );
}
