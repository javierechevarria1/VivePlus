"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import PusherClient from "pusher-js";
import { type Cuidador, type FilterOption } from "@/frontend/src/components/cards";
import { apiService } from "@/frontend/src/services/apiService";
import { type CatSaludDB, type Msg, type CurrentUser, type ValorarTarget } from "./helpers";

// Hooks de la página Salud (extraídos de salud.tsx).
const FILTER_COLORS_FALLBACK = ["#9B59B6", "#E67E22", "#3B82F6", "#E74C3C", "#F1C40F", "#2ECC71", "#1ABC9C", "#E91E63", "#FF5722", "#607D8B"];

export function useCurrentUser(initialUser: CurrentUser = null) {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(initialUser);

  useEffect(() => {
    const leerUsuario = () => {
      const saved = sessionStorage.getItem("r65_user:v1");
      return saved ? JSON.parse(saved) : null;
    };

    // Verificar sesión única
    const verificarSesion = () => {
      fetch("/api/verify-session")
        .then(async res => {
          if (!res.ok) {
            const data = await res.json();
            if (data.error && data.error.includes("dispositivo")) {
              alert("Tu sesión ha sido iniciada en otro dispositivo.");
              sessionStorage.removeItem("r65_user:v1");
              window.location.href = "/";
            }
          }
        });
    };

    const inicial = leerUsuario();
    const tid = setTimeout(() => setCurrentUser(inicial), 0);
    if (inicial) verificarSesion();

    const checkUser = () => {
      const userObj = leerUsuario();
      setCurrentUser(userObj);
      if (userObj) verificarSesion();
    };

    window.addEventListener("relatia-auth-changed", checkUser);
    window.addEventListener("r65:authed", checkUser);


    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      window.removeEventListener("relatia-auth-changed", checkUser);
      window.removeEventListener("r65:authed", checkUser);
      clearTimeout(tid);
    };
  }, []);

  return currentUser;
}

export function useSaludCuidadores() {
  const [cuidadores,  setCuidadores]  = useState<Cuidador[]>([]);
  const [catsDB,      setCatsDB]      = useState<CatSaludDB[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [filtros,     setFiltros]     = useState<string[]>(["Todos"]);

  useEffect(() => {
    apiService.getCategoriasSalud()
      .then(categorias => setCatsDB(categorias))
      .catch(() => {});
  }, []);

  const filterOptions = useMemo<FilterOption[]>(() => [
    { key: "Todos", label: "Todos" },
    ...catsDB.map((c, i) => ({
      key: c.nombre,
      label: c.nombre.charAt(0).toUpperCase() + c.nombre.slice(1),
      color: c.color ?? FILTER_COLORS_FALLBACK[i % FILTER_COLORS_FALLBACK.length],
    })),
  ], [catsDB]);

  useEffect(() => {
    const validKeys = new Set(filterOptions.map(o => o.key));
    setFiltros(prev => {
      const cleaned = prev.filter(f => validKeys.has(f));
      return cleaned.length === 0 ? ["Todos"] : cleaned;
    });
  }, [filterOptions]);

  useEffect(() => {
    const tid = setTimeout(() => setLoadingPage(true), 0);
    apiService.getMedicos()
      .then(medicos => setCuidadores(medicos))
      .finally(() => setLoadingPage(false));
    return () => clearTimeout(tid);
  }, []);

  return { cuidadores, setCuidadores, loadingPage, filterOptions, filtros, setFiltros };
}

export function useCuidadorChat(currentUser: CurrentUser, cuidadores: Cuidador[]) {
  const [chatOpen,      setChatOpen]      = useState<number | null>(null);
  const [messages,      setMessages]      = useState<Record<number, Msg[]>>({});
  const [unreadCounts,  setUnreadCounts]  = useState<Record<number, number>>({});
  const [inputs,        setInputs]        = useState<Record<number, string>>({});
  const [loadingChat,   setLoadingChat]   = useState<number | null>(null);
  const [chatSearch,    setChatSearch]    = useState("");
  const [chatError,     setChatError]     = useState<string | null>(null);

  const pusherRef        = useRef<PusherClient | null>(null);
  const channelRefs      = useRef<Record<number, ReturnType<PusherClient["subscribe"]>>>({});
  const scrollContainers = useRef<Record<number, HTMLDivElement | null>>({});
  const cuidadoresRef    = useRef<Cuidador[]>([]);
  const chatPanelRef     = useRef<HTMLDivElement | null>(null);
  const chatOpenRef      = useRef<number | null>(null);
  const messagesRef      = useRef<Record<number, Msg[]>>({});

  useEffect(() => { cuidadoresRef.current = cuidadores; }, [cuidadores]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("r65_user:v1");
      const uid = raw ? JSON.parse(raw).id : null;
      if (!uid) return;
      const cachedMsgs = sessionStorage.getItem(`r65_chat_msgs_${uid}`);
      if (cachedMsgs) setMessages(JSON.parse(cachedMsgs));
      const savedUnread = localStorage.getItem(`r65_unread_${uid}`);
      if (savedUnread) setUnreadCounts(JSON.parse(savedUnread));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { chatOpenRef.current = chatOpen; }, [chatOpen]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);


  useEffect(() => {
    if (process.env.NEXT_PUBLIC_LOCAL_DEMO === "true") return;
    pusherRef.current = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: { endpoint: "/api/pusher-auth", transport: "ajax" },
    });
    return () => { pusherRef.current?.disconnect(); };
  }, []);


  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key?.startsWith("r65_chat_msgs_")) return;
      try {
        const saved = sessionStorage.getItem(e.key!);
        if (!saved) return;
        const stored: Record<number, Msg[]> = JSON.parse(saved);
        const currentMsgs = messagesRef.current;
        const currentOpen = chatOpenRef.current;
        const newUnread: Record<number, number> = {};

        for (const [cidStr, msgs] of Object.entries(stored)) {
          const cid = Number(cidStr);
          const prevMsgs = currentMsgs[cid] ?? [];
          const careNuevos = (msgs as Msg[]).filter(m =>
            m.from === "care" && (!m.id || !prevMsgs.some((pm: Msg) => pm.id === m.id))
          );
          if (careNuevos.length > 0 && currentOpen !== cid) {
            newUnread[cid] = careNuevos.length;
          }
        }

        setMessages(prev => {
          const merged = { ...prev };
          for (const [cidStr, msgs] of Object.entries(stored)) {
            const cid = Number(cidStr);
            const prevMsgs = prev[cid] ?? [];
            const newMsgs  = (msgs as Msg[]).filter(m =>
              !m.id || !prevMsgs.some((pm: Msg) => pm.id === m.id)
            );
            if (newMsgs.length > 0) {
              merged[cid] = [...prevMsgs, ...newMsgs];
            }
          }
          return merged;
        });

        if (Object.keys(newUnread).length > 0) {
          setUnreadCounts(prev => {
            const updated = { ...prev };
            for (const [cidStr, count] of Object.entries(newUnread)) {
              const cid = Number(cidStr);
              updated[cid] = (updated[cid] ?? 0) + count;
            }
            return updated;
          });
        }
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);


  useEffect(() => {
    try {
      if (Object.keys(messages).length === 0) return;
      const uid = currentUser?.id ?? "guest";
      sessionStorage.setItem(`r65_chat_msgs_${uid}`, JSON.stringify(messages));
    } catch { /* ignore */ }
  }, [messages, currentUser?.id]);

  useEffect(() => {
    try {
      if (!currentUser?.id) return;
      localStorage.setItem(`r65_unread_${currentUser.id}`, JSON.stringify(unreadCounts));
    } catch { /* ignore */ }
  }, [unreadCounts, currentUser?.id]);


  useEffect(() => {
    const pusher = pusherRef.current;
    if (!currentUser?.id || cuidadores.length === 0 || !pusher) return;

    // Los canales se calculan antes de suscribir para que el cleanup cierre
    // exactamente los que abrio esta ejecucion del efecto.
    const canales = cuidadores.map(doc => `private-chat-${doc.cuidador_usuario_id}-u${currentUser.id}`);

    canales.forEach((channelKey, i) => {
      const doc = cuidadores[i];
      const ch = pusher.subscribe(channelKey);
      ch.bind("nuevo-mensaje", (data: Msg) => {
        setMessages(prev => {
          const existingMsgs = prev[doc.id] ?? [];
          if (data.id && existingMsgs.some((m: Msg) => m.id === data.id)) return prev;
          return { ...prev, [doc.id]: [...existingMsgs, data] };
        });
        if (data.from === "care" && chatOpenRef.current !== doc.id) {
          setUnreadCounts(prev => ({ ...prev, [doc.id]: (prev[doc.id] ?? 0) + 1 }));
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(`Mensaje de ${doc.name}`, {
                body: data.text || "Mensaje de voz",
                icon: doc.photo || "/logo.png",
                tag: `chat-${doc.id}`,
              });
            } catch {}
          }
        }
      });

      channelRefs.current[doc.id] = ch;
    });

    return () => {
      canales.forEach(channelKey => pusher.unsubscribe(channelKey));
      channelRefs.current = {};
    };
  }, [currentUser?.id, cuidadores]);

  // Cargar historial cuando se abre un chat
  useEffect(() => {
    if (chatOpen === null || !currentUser?.id) return;
    const id = chatOpen;
    const doctor = cuidadoresRef.current.find(x => x.id === id);
    const cuidadorUserId = doctor?.cuidador_usuario_id ?? id;

    let cancelado = false;
    const tid = setTimeout(() => setLoadingChat(id), 0);
    fetch(`/api/chat-history?cuidador_id=${cuidadorUserId}&usuario_id=${currentUser.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelado || !data) return;
        const updated = { ...messagesRef.current, [id]: data.messages ?? [] };
        setMessages(updated);
        try {
          const uid = currentUser?.id ?? "guest";
          sessionStorage.setItem(`r65_chat_msgs_${uid}`, JSON.stringify(updated));
        } catch {}
      })
      .catch(() => {})
      .finally(() => { if (!cancelado) setLoadingChat(null); });
    return () => { cancelado = true; clearTimeout(tid); };
  }, [chatOpen, currentUser?.id]);


  useEffect(() => {
    if (chatOpen !== null && scrollContainers.current[chatOpen]) {
      const container = scrollContainers.current[chatOpen]!;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, chatOpen]);

  const sendMessage = async (c: Cuidador) => {
    const id = c.id;
    const text = inputs[id]?.trim();
    if (!text) return;
    setInputs(prev => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch("/api/chat-send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ cuidador_id: c.cuidador_usuario_id, usuario_id: currentUser?.id, from: "user", text }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar el mensaje");
      }
      setChatError(null);

      if (data.msg?.id) {
        setMessages(prev => {
          const existingMsgs = prev[id] ?? [];
          if (existingMsgs.some((m: Msg) => m.id === data.msg.id)) return prev;
          return { ...prev, [id]: [...existingMsgs, { id: data.msg.id, from: "user", text, creado_en: data.msg.creado_en }] };
        });
      }
    } catch (err: unknown) {
      setInputs(prev => ({ ...prev, [id]: text }));
      setChatError(err instanceof Error ? err.message : "Error al enviar mensaje");
    }
  };

  return {
    chatOpen, setChatOpen,
    messages, setMessages,
    unreadCounts, setUnreadCounts,
    inputs, setInputs,
    loadingChat,
    chatSearch, setChatSearch,
    chatError, setChatError,
    chatPanelRef,
    scrollContainers,
    sendMessage,
  };
}

export function useVoiceRecorder(currentUser: CurrentUser, setMessages: React.Dispatch<React.SetStateAction<Record<number, Msg[]>>>) {
  const [isRecording,   setIsRecording]   = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [sendingAudio,  setSendingAudio]  = useState(false);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const audioDurationRef = useRef(0);
  const timerIntervalRef = useRef<number | null>(null);
  const shouldSendRef    = useRef(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const previewDurRef   = useRef(0);
  const previewCuidRef  = useRef<Cuidador | null>(null);

  // El object URL se crea y se revoca en el mismo sitio: al cambiar el blob y al desmontar.
  useEffect(() => {
    if (!previewBlob) return;
    const url = URL.createObjectURL(previewBlob);
    setPreviewUrl(url);
    return () => { URL.revokeObjectURL(url); };
  }, [previewBlob]);

  const stopRecordingOnClose = () => {
    shouldSendRef.current = false;
    clearInterval(timerIntervalRef.current!);
    timerIntervalRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setAudioDuration(0);
    audioDurationRef.current = 0;
  };

  const startRecording = async (c: Cuidador) => {
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch { return; }

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
      previewCuidRef.current = c;
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
    previewCuidRef.current = null;
  };

  const sendRecording = () => {
    shouldSendRef.current = true;
    mediaRecorderRef.current?.requestData();
    mediaRecorderRef.current?.stop();
  };

  const confirmSend = async () => {
    const blob = previewBlob;
    const dur  = previewDurRef.current;
    const c    = previewCuidRef.current;
    if (!blob || !currentUser || !c) return;
    setPreviewUrl(null);
    setPreviewBlob(null);
    previewCuidRef.current = null;
    setSendingAudio(true);
    try {
      const fd = new FormData();
      fd.append("audio", blob, "voice.webm");
      fd.append("duracion", String(dur));
      const uploadRes = await fetch("/api/chat-audio", { method: "POST", body: fd });
      if (!uploadRes.ok) return;
      const { id: audio_id } = await uploadRes.json();
      const res = await fetch("/api/chat-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuidador_id: c.cuidador_usuario_id, usuario_id: currentUser.id, from: "user", audio_id }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.msg?.id) {
        setMessages(prev => {
          const existingMsgs = prev[c.id] ?? [];
          if (existingMsgs.some((m: Msg) => m.id === data.msg.id)) return prev;
          return { ...prev, [c.id]: [...existingMsgs, { id: data.msg.id, from: "user" as const, text: null, audio_id, creado_en: data.msg.creado_en }] };
        });
      }
    } finally { setSendingAudio(false); }
  };

  return { isRecording, audioDuration, sendingAudio, previewUrl, previewCuidRef, startRecording, cancelRecording, sendRecording, confirmSend, stopRecordingOnClose };
}

export function useValoracion(currentUser: CurrentUser, setCuidadores: React.Dispatch<React.SetStateAction<Cuidador[]>>) {
  const [valorarOpen,     setValorarOpen]     = useState<ValorarTarget | null>(null);
  const [valorForm,       setValorForm]       = useState({ rating: 0, comentario: "" });
  const [submittingValor, setSubmittingValor] = useState(false);
  const [valorSuccess,    setValorSuccess]    = useState(false);
  const valorModalRef    = useRef<HTMLDialogElement>(null);
  const valorScrollRef   = useRef<number>(0);

  const handleValoracion = async () => {
    if (!currentUser || !valorarOpen || valorForm.rating === 0) return;
    setSubmittingValor(true);
    try {
      const res = await fetch("/api/valoraciones-medico", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          medico_id:  valorarOpen.id,
          usuario_id: currentUser.id,
          rating:     valorForm.rating,
          comentario: valorForm.comentario,
        }),
      });
      if (res.ok) {
        setValorSuccess(true);
        apiService.getMedicos().then(medicos => setCuidadores(medicos));
        setTimeout(() => {
          setValorarOpen(null);
          setValorForm({ rating: 0, comentario: "" });
          setValorSuccess(false);
        }, 2000);
      }
    } catch { /* ignore */ }
    finally { setSubmittingValor(false); }
  };

  return { valorarOpen, setValorarOpen, valorForm, setValorForm, submittingValor, valorSuccess, setValorSuccess, valorModalRef, valorScrollRef, handleValoracion };
}
