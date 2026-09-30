"use client";

import { useState, useEffect, useRef } from "react";
import type { Conversacion, Mensaje } from "./helpers";

// Hook de grabación de mensajes de voz (extraído de mis-chats.tsx).
export function useVoiceRecorder({
  user, selUsuario, setMessages, setSending,
}: {
  user: { id: number } | null;
  selUsuario: Conversacion | null;
  setMessages: React.Dispatch<React.SetStateAction<Mensaje[]>>;
  setSending: (v: boolean) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioDurationRef = useRef(0);
  const timerIntervalRef = useRef<number | null>(null);
  const shouldSendRef = useRef(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const previewDurRef = useRef(0);

  // El object URL se crea y se revoca en el mismo sitio: al cambiar el blob y al desmontar.
  useEffect(() => {
    if (!previewBlob) return;
    const url = URL.createObjectURL(previewBlob);
    setPreviewUrl(url);
    return () => { URL.revokeObjectURL(url); };
  }, [previewBlob]);

  const startRecording = async () => {
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch {
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    shouldSendRef.current = false;
    audioDurationRef.current = 0;
    setIsRecording(true);
    setAudioDuration(0);

    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]
      .find(t => MediaRecorder.isTypeSupported(t)) ?? "";

    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      return;
    }

    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

    mr.onstop = () => {
      window.clearInterval(timerIntervalRef.current ?? undefined);
      streamRef.current?.getTracks().forEach(t => t.stop());
      const dur = audioDurationRef.current;
      setIsRecording(false);
      setAudioDuration(0);
      audioDurationRef.current = 0;
      if (!shouldSendRef.current || chunksRef.current.length === 0) { chunksRef.current = []; return; }
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || mimeType || "audio/webm" });
      chunksRef.current = [];
      setPreviewBlob(blob);
      previewDurRef.current = dur;
    };

    mr.start(200);
    mediaRecorderRef.current = mr;
    timerIntervalRef.current = window.setInterval(() => {
      audioDurationRef.current += 1;
      setAudioDuration(d => d + 1);
    }, 1000) as unknown as number;
  };

  const cancelRecording = () => {
    shouldSendRef.current = false;
    window.clearInterval(timerIntervalRef.current ?? undefined);
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setAudioDuration(0);
    audioDurationRef.current = 0;
    setPreviewUrl(null);
    setPreviewBlob(null);
  };

  const sendRecording = () => {
    shouldSendRef.current = true;
    mediaRecorderRef.current?.requestData();
    mediaRecorderRef.current?.stop();
  };

  const confirmSend = async () => {
    const blob = previewBlob;
    const dur  = previewDurRef.current;
    if (!blob || !user || !selUsuario) return;
    setPreviewUrl(null);
    setPreviewBlob(null);
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("audio", blob, "voice.webm");
      fd.append("duracion", String(dur));
      const uploadRes = await fetch("/api/chat-audio", { method: "POST", body: fd });
      if (!uploadRes.ok) return;
      const { id: audio_id } = await uploadRes.json();
      const tempId = -Date.now();
      setMessages(prev => [...prev, { id: tempId, from: "care", text: null, audio_id, creado_en: new Date().toISOString() }]);
      const res = await fetch("/api/chat-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuidador_id: user.id, usuario_id: selUsuario.usuario_id, from: "care", audio_id }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.msg) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.msg.id, creado_en: data.msg.creado_en } : m));
      }
    } finally { setSending(false); }
  };

  return { isRecording, audioDuration, previewUrl, startRecording, cancelRecording, sendRecording, confirmSend };
}
