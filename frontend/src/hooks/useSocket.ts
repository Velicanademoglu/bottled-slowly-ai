import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Capacitor } from "@capacitor/core";
import { getAuthToken, API_BASE_URL } from "../lib/api";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const socket = io(import.meta.env.DEV ? window.location.origin : API_BASE_URL, {
      auth: { token },
      // WebSockets aren't subject to CORS preflight - prefer them on native
      transports: Capacitor.isNativePlatform() ? ["websocket"] : ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, []);

  return { socket: socketRef.current, connected };
}
