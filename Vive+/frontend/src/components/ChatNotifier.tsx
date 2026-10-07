"use client";

import { useEffect, useRef, useState } from "react";
import PusherClient from "pusher-js";
import { apiService } from "@/frontend/src/services/apiService";

function showNotification(title: string, body: string, icon: string, tag: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try { new Notification(title, { body, icon, tag }); } catch { /* ignore */ }
}

interface StoredMsg {
  from: string;
  text: string;
  id?: number;
  creado_en?: string;
}

interface Medico {
  id: number;
  cuidador_usuario_id: number;
  name: string;
  photo: string;
}

export default function ChatNotifier() {
  const pusherRef = useRef<PusherClient | null>(null);
  const [session, setSession] = useState<{ id: number } | null>(null);
  const [medicos, setMedicos] = useState<Medico[]>([]);

  useEffect(() => {
    const check = () => {
      const saved = sessionStorage.getItem("r65_user:v1");
      if (saved) {
        try {
          const u = JSON.parse(saved);
          setSession(u);
        } catch {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    };
    check();
    window.addEventListener("storage", check);
    window.addEventListener("r65:authed", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("r65:authed", check);
    };
  }, []);

  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    apiService.getMedicos()
      .then(raw => {
        if (cancelled) return;
        setMedicos((Array.isArray(raw) ? raw : []) as Medico[]);
      })
      .catch(() => { /* ignore */ });

    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => {
    if (!session?.id || medicos.length === 0) return;
    if (process.env.NEXT_PUBLIC_LOCAL_DEMO === "true") return;
    const user = session;

    if (!pusherRef.current) {
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
      if (!key || !cluster) return;
      pusherRef.current = new PusherClient(key, {
        cluster,
        channelAuthorization: { endpoint: "/api/pusher-auth", transport: "ajax" },
      });
    }

    const client = pusherRef.current;
    // Los canales se calculan antes de suscribir para que el cleanup cierre
    // exactamente los que abrio esta ejecucion del efecto.
    const canales = medicos.map(medico => `private-chat-${medico.cuidador_usuario_id}-u${user.id}`);

    canales.forEach((canal, i) => {
      const medico = medicos[i];
      const ch = client.subscribe(canal);

      ch.bind("nuevo-mensaje", (msg: {
        id?: number; from: string; text: string; creado_en?: string;
      }) => {
        const isCare = msg.from === "care";
        const isOutsideSalud = !window.location.pathname.includes("/salud");

        try {
          const storageKey = `r65_chat_msgs_${user.id}`;
          const existing = sessionStorage.getItem(storageKey);
          const all: Record<number, StoredMsg[]> = existing ? JSON.parse(existing) : {};
          const prev = all[medico.id] ?? [];
          if (!msg.id || !prev.some((m: StoredMsg) => m.id === msg.id)) {
            all[medico.id] = [...prev, { from: msg.from, text: msg.text, id: msg.id, creado_en: msg.creado_en }];
            sessionStorage.setItem(storageKey, JSON.stringify(all));
            window.dispatchEvent(new StorageEvent("storage", { key: storageKey }));

            // Actualizar no leídos en localStorage solo cuando salud.tsx no está montado
            if (isCare && isOutsideSalud) {
              const unreadKey = `r65_unread_${user.id}`;
              const saved = localStorage.getItem(unreadKey);
              const counts: Record<number, number> = saved ? JSON.parse(saved) : {};
              counts[medico.id] = (counts[medico.id] ?? 0) + 1;
              localStorage.setItem(unreadKey, JSON.stringify(counts));
            }
          }
        } catch { /* ignore */ }

        const isHidden = document.visibilityState !== "visible";
        if (isCare && (isHidden || isOutsideSalud)) {
          showNotification(
            `Mensaje de ${medico.name}`,
            msg.text,
            medico.photo || "/logo.png",
            `chat-${medico.id}`
          );
        }
      });
    });

    return () => {
      canales.forEach(canal => client.unsubscribe(canal));
      // Sin desconectar, el WebSocket sigue vivo tras desmontar y la siguiente
      // sesion abre una conexion nueva sobre la anterior.
      client.disconnect();
      pusherRef.current = null;
    };
  }, [session, medicos]);

  return null;
}