"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PusherClient from "pusher-js";

import { MIS_CHATS_STYLES } from "../components/mis-chats/styles";
import { ConvSidebar } from "../components/mis-chats/ConvSidebar";
import { ChatArea } from "../components/mis-chats/ChatArea";
import { useVoiceRecorder } from "../components/mis-chats/useVoiceRecorder";
import { type Conversacion, type Mensaje } from "../components/mis-chats/helpers";

// El tipo se re-exporta para consumidores externos (app/mis-chats/page.tsx).
export type { Conversacion } from "../components/mis-chats/helpers";

export default function MisChatsPage({ initialUser, initialConvs }: { initialUser: { id: number; username: string; rol: string }; initialConvs: Conversacion[] }) {
  const [user] = useState<{ id: number; username: string; rol: string } | null>(initialUser);
  const [convs, setConvs] = useState<Conversacion[]>(initialConvs);
  const [selUsuario, setSelUsuario] = useState<Conversacion | null>(null);
  const selUsuarioRef = useRef(selUsuario);
  const [messages, setMessages] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    initialConvs.forEach(c => { map[c.usuario_id] = c.status ?? "offline"; });
    return map;
  });
  const [busqueda, setBusqueda] = useState("");
  const [busquedaActiva, setBusquedaActiva] = useState(false);
  const { isRecording, audioDuration, previewUrl, startRecording, cancelRecording, sendRecording, confirmSend } =
    useVoiceRecorder({ user, selUsuario, setMessages, setSending });
  const bottomRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<PusherClient | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busquedaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !selUsuario) return;
    let cancelado = false;
    fetch(`/api/chat-history?cuidador_id=${user.id}&usuario_id=${selUsuario.usuario_id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelado && d) setMessages(d.messages ?? []); })
      .catch(() => {});
    return () => { cancelado = true; };
  }, [user, selUsuario]);

  useEffect(() => { selUsuarioRef.current = selUsuario; }, [selUsuario]);

  useEffect(() => {
    if (!user) return;
    if (process.env.NEXT_PUBLIC_LOCAL_DEMO === "true") return;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    pusherRef.current = new PusherClient(key, {
      cluster,
      channelAuthorization: { endpoint: "/api/pusher-auth", transport: "ajax" },
    });
    const ch = pusherRef.current.subscribe(`private-panel-${user.id}`);

    ch.bind("nuevo-mensaje", (msg: { id: number; from: string; text: string | null; audio_id?: string | null; usuario_id: number; creado_en: string }) => {
      const isOpen = selUsuarioRef.current?.usuario_id === msg.usuario_id;
      setConvs(prev => {
        const idx = prev.findIndex(c => c.usuario_id === msg.usuario_id);
        if (idx < 0) return prev;
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          ultimo_mensaje: msg.audio_id ? "🎤 Mensaje de voz" : (msg.text ?? ""),
          ultimo_at: msg.creado_en,
          no_leidos: msg.from === "user" && !isOpen
            ? (updated[idx].no_leidos || 0) + 1
            : updated[idx].no_leidos,
        };
        return updated;
      });
      if (isOpen && msg.from !== "care") {
        setMessages(prev => {
          if (msg.id && prev.some(m => m.id === msg.id)) return prev;
          return [...prev, { id: msg.id, from: msg.from, text: msg.text ?? null, audio_id: msg.audio_id, creado_en: msg.creado_en }];
        });
      }
    });

    const presenceCh = pusherRef.current.subscribe("private-presencia");
    presenceCh.bind("cambio-estado", (data: { user_id: number; status: string }) => {
      setStatusMap(prev => ({ ...prev, [data.user_id]: data.status }));
    });

    return () => {
      pusherRef.current?.unsubscribe(`private-panel-${user.id}`);
      pusherRef.current?.unsubscribe("private-presencia");
      pusherRef.current?.disconnect();
    };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  const handleSelectConv = (c: Conversacion) => {
    if (selUsuario?.usuario_id !== c.usuario_id) {
      setMessages([]); 
      setTexto(""); 
      setBusqueda("");
      setBusquedaActiva(false);
    }
    setSelUsuario(c);
    setChatError(null);
    setConvs(prev => prev.map(conv =>
      conv.usuario_id === c.usuario_id ? { ...conv, no_leidos: 0 } : conv
    ));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() || !user || !selUsuario) return;
    setSending(true);

    const sentText = texto.trim();
    const tempId = -Date.now();
    setMessages(prev => [...prev, { id: tempId, from: "care", text: sentText, creado_en: new Date().toISOString() }]);
    setTexto("");
    setTimeout(() => inputRef.current?.focus(), 50);

    try {
      const res = await fetch("/api/chat-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuidador_id: user.id, usuario_id: selUsuario.usuario_id, from: "care", text: sentText }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al enviar el mensaje");
      }
      
      setChatError(null);
      if (data.msg) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.msg.id, creado_en: data.msg.creado_en } : m));
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setTexto(sentText);
      setChatError(err instanceof Error ? err.message : "Error al enviar el mensaje");
    } finally { setSending(false); }
  };

  if (!user) return null;

  return (
    <>
      <style>{MIS_CHATS_STYLES}</style>

      <div className="page">


        <div className="top-bar">
          <div className="top-left">
            <Link href="/" className="back-btn">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </Link>
            <h1 className="title">
              Mis conversaciones<span className="title-dot">.</span>
            </h1>
          </div>
          <div className="doctor-badge">
            <span className="doctor-dot" />
            Dr. {user.username}
          </div>
        </div>


        <div className="layout">

          <ConvSidebar convs={convs} loading={false} selUsuario={selUsuario} onSelectConv={handleSelectConv} />

          <ChatArea
            selUsuario={selUsuario} statusMap={statusMap}
            busquedaActiva={busquedaActiva} setBusquedaActiva={setBusquedaActiva} busqueda={busqueda} setBusqueda={setBusqueda} busquedaRef={busquedaRef}
            messages={messages} chatError={chatError} setChatError={setChatError} handleSend={handleSend}
            isRecording={isRecording} audioDuration={audioDuration} cancelRecording={cancelRecording} sendRecording={sendRecording}
            previewUrl={previewUrl} confirmSend={confirmSend} sending={sending} texto={texto} setTexto={setTexto}
            inputRef={inputRef} startRecording={startRecording} bottomRef={bottomRef}
          />

        </div>
      </div>
    </>
  );
}
