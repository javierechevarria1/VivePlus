"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PusherClient from "pusher-js";
import { type CurrentUser, type Msg, type Person, type Solicitud, type SolicitudesIniciales, fmt, safeParseLatLng } from "./helpers";

// Hooks de la página Comunidad (extraídos de comunidad.tsx).
export function useCurrentUser(initialUser: CurrentUser | null = null) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(initialUser);

  useEffect(() => {
    const resolverUsuario = () => {
      const saved = sessionStorage.getItem("r65_user:v1");
      if (!saved) return null;
      const userObj = JSON.parse(saved);
      if (userObj.rol === "medico") {
        window.location.href = "/"; // Expulsar médicos de Comunidad
        return null;
      }
      return userObj;
    };

    const inicial = resolverUsuario();
    const tid = setTimeout(() => { if (inicial) setCurrentUser(inicial); }, 0);

    // Re-evaluar rol cuando se hace login desde esta misma página
    const checkUser = () => {
      const userObj = resolverUsuario();
      if (userObj) setCurrentUser(userObj);
    };
    window.addEventListener("relatia-auth-changed", checkUser);

    return () => {
      window.removeEventListener("relatia-auth-changed", checkUser);
      clearTimeout(tid);
    };
  }, []);

  return currentUser;
}

export function useVoiceRecorder(currentUser: CurrentUser | null, selected: Person | null) {
  const [isRecording,   setIsRecording]   = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const streamRef         = useRef<MediaStream | null>(null);
  const chunksRef         = useRef<Blob[]>([]);
  const audioDurationRef  = useRef(0);
  const timerIntervalRef  = useRef<number | null>(null);
  const shouldSendRef     = useRef(false);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const previewDurRef  = useRef(0);

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
    if (!blob || !currentUser || !selected) return;
    setPreviewUrl(null);
    setPreviewBlob(null);
    try {
      const fd = new FormData();
      fd.append("audio", blob, "voice.webm");
      fd.append("duracion", String(dur));
      const uploadRes = await fetch("/api/chat-audio", { method: "POST", body: fd });
      if (!uploadRes.ok) return;
      const { id: audio_id } = await uploadRes.json();
      await fetch("/api/cercania-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_from: currentUser.id, user_to: selected.id, audio_id }),
      });
    } catch { /* ignore */ }
  };

  return { isRecording, audioDuration, previewUrl, startRecording, cancelRecording, sendRecording, confirmSend };
}

export function useComunidadData(currentUser: CurrentUser | null, initialSolicitudes: SolicitudesIniciales) {
  /* — Estado — */
  const [people,            setPeople]            = useState<Person[]>([]);
  const [selected,          setSelected]          = useState<Person | null>(null);
  const [input,             setInput]             = useState("");
  const [search,            setSearch]            = useState("");
  const [showProfile,       setShowProfile]       = useState(false);
  const [range,             setRange]             = useState(5);
  const [loadingChat,       setLoadingChat]       = useState(false);
  const [chatError,         setChatError]         = useState<string | null>(null);
  const [loadingUsers,      setLoadingUsers]      = useState(false);
  const [locError,          setLocError]          = useState<string | null>(null);
  const [zonaNombre,        setZonaNombre]        = useState("Tu zona");
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [filtroVista,       setFiltroVista]       = useState<"todos"|"amigos">("todos");
  const [mapaMax,           setMapaMax]           = useState(false);

  /* — Solicitudes — */
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState<Solicitud[]>(initialSolicitudes.recibidas);
  const [amigos,               setAmigos]               = useState<number[]>(initialSolicitudes.amigos);
  const [enviadas,             setEnviadas]             = useState<number[]>(initialSolicitudes.enviadas);
  const [enviandoSolicitud,    setEnviandoSolicitud]    = useState<number | null>(null);

  /* — Refs — */
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const pusherRef       = useRef<PusherClient | null>(null);
  const lastLocRef      = useRef<string | null>(null);
  const requestIdRef    = useRef(0);
  const channelRefs     = useRef<Record<string, ReturnType<PusherClient["subscribe"]>>>({});
  const selectedRef     = useRef<Person | null>(null);

  /* ── Mantener ref de selected actualizada ── */
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  /* ── Cargar no leídos ── */
  const cargarNoLeidos = useCallback(async (userId: number) => {
    try {
      const res  = await fetch(`/api/cercania-history?user_from=${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<number, { count: number; texto: string | null }> = {};
      (data.unreads ?? []).forEach((r: { otro_usuario_id: number; no_leidos: string; ultimo_no_leido: string | null }) => {
        map[Number(r.otro_usuario_id)] = { count: Number(r.no_leidos), texto: r.ultimo_no_leido };
      });
      setPeople(prev => prev.map(p => ({
        ...p,
        unread:          map[p.id]?.count ?? 0,
        ultimo_no_leido: map[p.id]?.texto ?? undefined,
      })));
    } catch { /* ignore */ }
  }, []);

  /* ── Cargar solicitudes ── */
  const cargarSolicitudes = useCallback(async (userId: number) => {
    try {
      const res  = await fetch(`/api/solicitudes?user_id=${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      setSolicitudesRecibidas(data.recibidas ?? []);
      setAmigos(data.amigos ?? []);
      setEnviadas(data.enviadas ?? []);
    } catch { /* ignore */ }
  }, []);

  /* ── Presencia ── */
  useEffect(() => {
    if (!currentUser) return;
    const ping = () => fetch("/api/ping", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ user_id: currentUser.id }),
    });
    ping();
    const interval = setInterval(ping, 30000);
    const onUnload = () =>
      navigator.sendBeacon("/api/ping", JSON.stringify({ user_id: currentUser.id, offline: true }));
    window.addEventListener("beforeunload", onUnload);
    return () => { clearInterval(interval); window.removeEventListener("beforeunload", onUnload); };
  }, [currentUser]);

  /* ── Pusher ── */
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_LOCAL_DEMO === "true") return;
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: { endpoint: "/api/pusher-auth", transport: "ajax" },
    });
    pusherRef.current = pusher;

    const presenceCh = pusher.subscribe("private-presencia");
    presenceCh.bind("cambio-estado", (data: { user_id: number; status: string }) => {
      const s = data.status as Person["status"];
      setPeople(prev  => prev.map(p  => p.id  === data.user_id ? { ...p,  status: s } : p));
      setSelected(prev => prev?.id === data.user_id ? { ...prev, status: s } : prev);
    });

    return () => {
      presenceCh.unbind_all();
      pusher.unsubscribe("private-presencia");
      pusher.disconnect();
      pusherRef.current = null;
    };
  }, []);

  /* ── Pusher solicitudes ── */
  useEffect(() => {
    if (!currentUser || !pusherRef.current) return;

    const pusher = pusherRef.current;
    const chName = `private-solicitudes-${currentUser.id}`;
    const ch = pusher.subscribe(chName);

    // Nueva solicitud recibida
    ch.bind("nueva-solicitud", (data: { id: number; from_user: number; username: string }) => {
      setSolicitudesRecibidas(prev => {
        if (prev.find(s => s.from_user === data.from_user)) return prev;
        return [{ id: data.id, from_user: data.from_user, username: data.username, creado_en: new Date().toISOString() }, ...prev];
      });
    });

    // Solicitud enviada aceptada
    ch.bind("solicitud-aceptada", (data: { to_user: number }) => {
      const amigoId = Number(data.to_user);
      setAmigos(prev => prev.includes(amigoId) ? prev : [...prev, amigoId]);
      setEnviadas(prev => prev.filter(id => Number(id) !== amigoId));
      // Re-fetch para garantizar estado sincronizado con el servidor
      cargarSolicitudes(currentUser.id);
    });

    // Amistad eliminada por el otro usuario
    ch.bind("amistad-eliminada", (data: { eliminado_por: number }) => {
      const exAmigoId = Number(data.eliminado_por);
      setAmigos(prev => prev.filter(id => Number(id) !== exAmigoId));
      setEnviadas(prev => prev.filter(id => Number(id) !== exAmigoId));
      setSelected(prev => prev?.id === exAmigoId ? null : prev);
      cargarSolicitudes(currentUser.id);
    });

    // Canal de notificaciones de nuevos mensajes
    const notifChName = `private-notif-${currentUser.id}`;
    const notifCh = pusher.subscribe(notifChName);
    notifCh.bind("nuevo-mensaje", (data: { user_from: number; texto: string }) => {
      if (selectedRef.current?.id !== data.user_from) {
        setPeople(prev => prev.map(p =>
          p.id === data.user_from
            ? { ...p, unread: p.unread + 1, ultimo_no_leido: data.texto }
            : p
        ));
      }
    });

    return () => {
      ch.unbind_all();
      pusher.unsubscribe(chName);
      notifCh.unbind_all();
      pusher.unsubscribe(notifChName);
    };
  }, [currentUser]);

  /* ── Geolocalización ── */
  const fetchLoc = useCallback(async (lat: number, lng: number) => {
    const myRequestId = ++requestIdRef.current;

    const geoPromise = fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(r => r.json())
      .then(geo => setZonaNombre(geo?.address?.village ?? geo?.address?.town ?? geo?.address?.suburb ?? geo?.address?.city ?? "Tu zona"))
      .catch(() => setZonaNombre("Tu zona"));

    const ubicacionPromise = fetch("/api/ubicacion", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ user_id: currentUser?.id, latitud: lat, longitud: lng }),
    });

    const [res] = await Promise.all([
      fetch(`/api/usuarios?user_id=${currentUser?.id}&latitud=${lat}&longitud=${lng}&radio=${range}`),
      geoPromise,
      ubicacionPromise,
    ]);
    if (requestIdRef.current !== myRequestId) return;
    if (!res.ok) { setPeople([]); setLoadingUsers(false); return; }

    const { users = [] } = await res.json().catch(() => ({ users: [] }));
    if (requestIdRef.current !== myRequestId) return;
    setPeople(prev => {
      const prevMap = new Map(prev.map(p => [p.id, p]));
      return users.map((u: { id: number; username: string; edad: number; foto: string | null; distancia_texto: string; distancia_km: number; status: string }) => {
        const existing = prevMap.get(u.id);
        return {
          id: u.id, name: u.username, age: u.edad,
          distance: u.distancia_texto, distancia_km: u.distancia_km,
          photo: u.foto || `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(u.username)}`,
          status: (u.status as Person["status"]) ?? "offline",
          bio: "", barrio: "",
          unread:   existing?.unread   ?? 0,
          messages: existing?.messages ?? [],
        };
      });
    });
    setLoadingUsers(false);

    if (currentUser) {
      await cargarSolicitudes(currentUser.id);
      await cargarNoLeidos(currentUser.id);
    }
  }, [currentUser, range, cargarSolicitudes, cargarNoLeidos]);

  const requestLocation = useCallback((cachedLoc: string | null = null) => {
    setLocError(null);
    setLoadingUsers(true);

    const succeed = (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      sessionStorage.setItem("r65_last_loc:v1", JSON.stringify({ lat, lng }));
      fetchLoc(lat, lng);
    };

    const fail = (msg: string) => {
      const parsed = cachedLoc ? safeParseLatLng(cachedLoc) : null;
      if (parsed) {
        fetchLoc(parsed.lat, parsed.lng);
      } else {
        setLoadingUsers(false);
        setLocError(msg);
      }
    };

    // Primera llamada sin GPS forzado: rápida en iOS via WiFi/red (1-2s)
    navigator.geolocation.getCurrentPosition(
      succeed,
      (err) => {
        if (err.code === 1) {
          fail("Acceso a ubicación denegado. En iPhone: Ajustes → Privacidad y seguridad → Servicios de localización → Safari → «Al usar la app». Luego pulsa Reintentar.");
        } else {
          // Timeout o unavailable: segundo intento con GPS de alta precisión
          navigator.geolocation.getCurrentPosition(succeed, () => {
            fail("No se pudo obtener la ubicación. Asegúrate de tener el GPS activado y pulsa Reintentar.");
          }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 });
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }, [fetchLoc]);

  useEffect(() => {
    if (!currentUser) return;
    if (!navigator.geolocation) {
      const tid = setTimeout(() => setLocError("Tu navegador no soporta geolocalización."), 0);
      return () => clearTimeout(tid);
    }

    let tid: ReturnType<typeof setTimeout> | null = null;
    const cached = sessionStorage.getItem("r65_last_loc:v1");
    lastLocRef.current = cached;
    const parsedCached = cached ? safeParseLatLng(cached) : null;
    if (parsedCached) {
      fetchLoc(parsedCached.lat, parsedCached.lng);
    } else {
      tid = setTimeout(() => setLoadingUsers(true), 0);
    }

    requestLocation(cached);
    return () => { requestIdRef.current++; if (tid !== null) clearTimeout(tid); };
  }, [currentUser, range, fetchLoc, requestLocation]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    const el = messagesAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [selected?.id, selected?.messages.length]);

  /* Estado del botón para cada persona */
  const getPersonaEstado = (p: Person): "amigo" | "enviada" | "recibida" | "ninguno" => {
    if (amigos.includes(p.id)) return "amigo";
    if (enviadas.includes(p.id)) return "enviada";
    if (solicitudesRecibidas.find(s => s.from_user === p.id)) return "recibida";
    return "ninguno";
  };

  /* ═══════════════════════
     ACCIONES
  ═══════════════════════ */
  const filtered = people.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (filtroVista === "todos" || getPersonaEstado(p) === "amigo")
  );

  /* Enviar solicitud */
  const enviarSolicitud = async (p: Person) => {
    if (!currentUser) return;
    setEnviandoSolicitud(p.id);
    try {
      await fetch("/api/solicitudes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ from_user: currentUser.id, to_user: p.id }),
      });
      setEnviadas(prev => [...prev, p.id]);
    } finally {
      setEnviandoSolicitud(null);
    }
  };

  /* Aceptar solicitud */
  const aceptarSolicitud = async (s: Solicitud) => {
    await fetch("/api/solicitudes", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ solicitud_id: s.id, accion: "aceptar", from_user: s.from_user, to_user: currentUser?.id }),
    });
    setSolicitudesRecibidas(prev => prev.filter(x => x.id !== s.id));
    setAmigos(prev => [...prev, s.from_user]);
  };

  /* Rechazar solicitud */
  const rechazarSolicitud = async (s: Solicitud) => {
    await fetch("/api/solicitudes", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ solicitud_id: s.id, accion: "rechazar" }),
    });
    setSolicitudesRecibidas(prev => prev.filter(x => x.id !== s.id));
  };

  /* Seleccionar persona para chatear — solo si son amigos */
  const selectPerson = (p: Person, stopRecording: () => void) => {
    if (!currentUser) return;

    // Si no son amigos, enviar solicitud en vez de abrir chat
    if (!amigos.includes(p.id)) {
      enviarSolicitud(p);
      return;
    }

    // Cancelar grabación en curso al cambiar de chat
    stopRecording();

    setShowMobileSidebar(false);
    setShowProfile(false);
    setChatError(null);
    setInput(""); // Limpiar input al cambiar de persona
    setPeople(prev => prev.map(x => x.id === p.id ? { ...x, unread: 0 } : x));
    setSelected({ ...p, unread: 0, messages: [] });
    setLoadingChat(true);
    fetch(`/api/cercania-history?user_from=${currentUser.id}&user_to=${p.id}`)
      .then(r => r.json())
      .then(data => {
        const msgs: Msg[] = (data.messages ?? []).map((m: { id: number; user_from: number; texto: string | null; audio_id?: string | null; creado_en: string }) => ({
          id:       m.id,
          from:     m.user_from === currentUser.id ? "me" : "other",
          text:     m.texto ?? null,
          audio_id: m.audio_id ?? null,
          time:     fmt(m.creado_en),
        }));
        setSelected(prev => prev && { ...prev, messages: msgs });
        setPeople(prev => prev.map(x => x.id === p.id ? { ...x, messages: msgs } : x));
      })
      .finally(() => setLoadingChat(false));
  };

  /* Suscripción al canal de mensajes de la conversación abierta */
  useEffect(() => {
    if (!currentUser || !selected?.id || !pusherRef.current) return;

    const otherId = selected.id;
    const channelId = `private-cercania-${Math.min(currentUser.id, otherId)}-${Math.max(currentUser.id, otherId)}`;
    const pusher = pusherRef.current;
    const ch = pusher.subscribe(channelId);
    ch.bind("nuevo-mensaje", (data: { id: number; user_from: number; texto: string | null; audio_id?: string | null; creado_en: string }) => {
      const msg: Msg = { id: data.id, from: data.user_from === currentUser.id ? "me" : "other", text: data.texto ?? null, audio_id: data.audio_id ?? null, time: fmt(data.creado_en) };
      setPeople(prev  => prev.map(x  => x.id  === otherId ? { ...x,  messages: [...x.messages,  msg] } : x));
      setSelected(prev => prev?.id === otherId ? { ...prev, messages: [...prev.messages, msg] } : prev);
    });
    channelRefs.current[channelId] = ch;

    return () => {
      ch.unbind_all();
      pusher.unsubscribe(channelId);
      delete channelRefs.current[channelId];
    };
  }, [currentUser, selected?.id]);

  const goBackToList = () => { setShowMobileSidebar(true); setSelected(null); setShowProfile(false); };

  const eliminarAmigo = async (amigoId: number) => {
    if (!currentUser) return;
    await fetch("/api/solicitudes", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ user_id: currentUser.id, amigo_id: amigoId }),
    });
    setAmigos(prev => prev.filter(id => id !== amigoId));
    setSelected(null);
    setShowProfile(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selected || !currentUser) return;
    const text = input.trim();
    setInput("");
    try {
      const res = await fetch("/api/cercania-send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_from: currentUser.id, user_to: selected.id, texto: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar el mensaje");
      }
      setChatError(null);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Error al enviar el mensaje");
      setInput(text); // Recuperar el texto para que el usuario pueda corregirlo
    }
  };

  const currentPerson = selected ? (people.find(p => p.id === selected.id) ?? selected) : null;

  const retryLocation = () => {
    sessionStorage.removeItem("r65_last_loc:v1");
    lastLocRef.current = null;
    requestLocation(null);
  };

  return {
    people, selected, input, setInput, search, setSearch, showProfile, setShowProfile,
    range, setRange, loadingChat, chatError, setChatError, loadingUsers, locError,
    zonaNombre, showMobileSidebar, filtroVista, setFiltroVista,
    mapaMax, setMapaMax, solicitudesRecibidas, amigos, enviandoSolicitud,
    messagesAreaRef, filtered, getPersonaEstado, enviarSolicitud, aceptarSolicitud,
    rechazarSolicitud, selectPerson, goBackToList, eliminarAmigo, sendMessage,
    retryLocation, currentPerson,
  };
}
