"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, MapPin, Search, Send, User, UserMinus, X } from "lucide-react";
import { AudioPlayer } from "./AudioPlayer";
import { type Person, QUICK_REPLIES, statusColor, statusLabel, formatDuration } from "./helpers";

// Panel principal de chat de comunidad (extraído de comunidad.tsx).
const CM_EMPTY_ICON: React.CSSProperties = { width: 48, height: 48, borderRadius: "50%", background: "#FDF2F8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" };
const CM_CHAT_ERROR: React.CSSProperties = { backgroundColor: "#FFF0F0", border: "1px solid #FFCDD5", color: "#E74C3C", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" };
const CM_MSG_BTN: React.CSSProperties = { marginTop: 20, width: "100%", background: "var(--teal,#EC4899)", color: "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
const CM_ELIMINAR_BTN: React.CSSProperties = { marginTop: 8, width: "100%", background: "white", color: "#E74C3C", border: "1.5px solid #FFCDD5", borderRadius: 12, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background-color .2s" };

export function ComunidadChatMain({
  showMobileSidebar,
  currentPerson,
  goBackToList,
  showProfile,
  setShowProfile,
  messagesAreaRef,
  loadingChat,
  chatError,
  setChatError,
  input,
  setInput,
  sendMessage,
  isRecording,
  audioDuration,
  cancelRecording,
  sendRecording,
  previewUrl,
  confirmSend,
  startRecording,
  eliminarAmigo,
}: {
  showMobileSidebar: boolean;
  currentPerson: Person | null;
  goBackToList: () => void;
  showProfile: boolean;
  setShowProfile: React.Dispatch<React.SetStateAction<boolean>>;
  messagesAreaRef: React.RefObject<HTMLDivElement | null>;
  loadingChat: boolean;
  chatError: string | null;
  setChatError: (v: string | null) => void;
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => void;
  isRecording: boolean;
  audioDuration: number;
  cancelRecording: () => void;
  sendRecording: () => void;
  previewUrl: string | null;
  confirmSend: () => void;
  startRecording: () => void;
  eliminarAmigo: (id: number) => void;
}) {
  const [busqueda,       setBusqueda]       = useState("");
  const [busquedaActiva, setBusquedaActiva] = useState(false);
  const busquedaRef = useRef<HTMLInputElement>(null);

  const q = busqueda.toLowerCase().trim();
  const mensajesFiltrados = currentPerson
    ? (q ? currentPerson.messages.filter(m => m.text?.toLowerCase().includes(q)) : currentPerson.messages)
    : [];

  const resaltarTexto = (texto: string) => {
    if (!q) return texto;
    const idx = texto.toLowerCase().indexOf(q);
    if (idx === -1) return texto;
    return (
      <>
        {texto.slice(0, idx)}
        <mark className="highlight">{texto.slice(idx, idx + q.length)}</mark>
        {texto.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className={`chat-main${showMobileSidebar ? " hide" : ""}`}>

      {!currentPerson ? (
        <div className="chat-empty">
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FDF2F8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MapPin size={28} color="var(--teal)" />
          </div>
          <h3>Conecta con tu vecindario</h3>
          <p>Selecciona a alguien de la lista. Si aún no sois amigos, se enviará una solicitud de conexión.</p>
        </div>
      ) : (
        <>
          <div className="chat-header">
            <button type="button" className="back-btn icon-btn" style={{ display: "none" }} onClick={goBackToList}>
              <ChevronLeft size={18} />
            </button>
            <Image src={currentPerson.photo} alt={currentPerson.name} width={40} height={40}
              className="chat-header-avatar" onClick={() => setShowProfile(v => !v)} />
            <div className="chat-header-info">
              <button type="button" className="chat-header-name" onClick={() => setShowProfile(v => !v)}>
                {currentPerson.name}, {currentPerson.age} años
              </button>
              <div className="chat-header-status">
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor(currentPerson.status), display: "inline-block", flexShrink: 0 }} />
                <span style={{ color: "#64748B", fontSize: 12 }}>{statusLabel(currentPerson.status)}</span>
                <MapPin size={10} color="var(--teal)" />
                <span style={{ color: "var(--teal)", fontSize: 12, fontWeight: 600 }}>{currentPerson.distance}</span>
              </div>
            </div>
            <div className="chat-header-actions">
              <button type="button" aria-label="Buscar en el chat" className={`icon-btn ${busquedaActiva ? "active" : ""}`}
                onClick={() => {
                  setBusquedaActiva(v => !v);
                  setBusqueda("");
                  setTimeout(() => busquedaRef.current?.focus(), 80);
                }}>
                <Search size={15} />
              </button>
              <button type="button" aria-label="Ver perfil" className="icon-btn" onClick={() => setShowProfile(v => !v)}><User size={15} /></button>
              <button type="button" aria-label="Cerrar chat" className="icon-btn" onClick={goBackToList}><X size={15} /></button>
            </div>
          </div>

          {busquedaActiva && (
            <div className="search-bar">
              <Search size={14} color="#94A3B8" />
              <input
                ref={busquedaRef}
                aria-label="Buscar en la conversación"
                className="search-input"
                placeholder="Buscar en la conversación…"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <span className="search-count">
                  {mensajesFiltrados.length} resultado{mensajesFiltrados.length !== 1 ? "s" : ""}
                </span>
              )}
              <button type="button" className="search-close" aria-label="Cerrar búsqueda" onClick={() => { setBusqueda(""); setBusquedaActiva(false); }}>×</button>
            </div>
          )}

          <div className="messages-area" ref={messagesAreaRef}>
            {loadingChat ? (
              <div style={{ textAlign: "center", margin: "auto" }}>
                <div style={{ width: 20, height: 20, border: "2px solid #EDE9FE", borderTopColor: "var(--teal)", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 8px" }} />
                <p style={{ color: "#94A3B8", fontSize: 13 }}>Cargando mensajes…</p>
              </div>
            ) : currentPerson.messages.length === 0 ? (
              <div style={{ textAlign: "center", margin: "auto", color: "#64748B", fontSize: 14 }}>
                <div style={CM_EMPTY_ICON}>
                  <User size={22} color="var(--teal)" />
                </div>
                <strong style={{ color: "#0F172A" }}>Di hola a {currentPerson.name}</strong>
                <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6 }}>Vive a solo {currentPerson.distance} de ti.</p>
              </div>
            ) : mensajesFiltrados.length === 0 ? (
              <div style={{ textAlign: "center", margin: "auto", color: "#64748B", fontSize: 14 }}>
                Sin resultados para &quot;{busqueda}&quot;
              </div>
            ) : (
              <>
                <div className="date-divider">Hoy</div>
                {mensajesFiltrados.map(m => (
                  <div key={m.id} className={`msg-group ${m.from}`}>
                    <div className={`msg-bubble ${m.from}`} style={m.audio_id ? { padding: "8px 12px" } : {}}>
                      {m.audio_id
                        ? <AudioPlayer src={`/api/chat-audio?id=${m.audio_id}`} isMe={m.from === "me"} />
                        : m.text ? resaltarTexto(m.text) : null
                      }
                    </div>
                    <div className="msg-time">{m.time}</div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="chat-input-area">
            {chatError && (
              <div style={CM_CHAT_ERROR}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {chatError}
                </span>
                <button type="button" aria-label="Cerrar error" onClick={() => setChatError(null)} style={{ background: "none", border: "none", color: "#E74C3C", cursor: "pointer", display: "flex", padding: 0 }}>
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="quick-replies">
              {QUICK_REPLIES.map(q => (
                <button type="button" key={q} className="quick-reply" onClick={() => setInput(q)}>{q}</button>
              ))}
            </div>
            <div className="input-row">
              {isRecording ? (
                <>
                  <div className="rec-indicator">
                    <span className="rec-dot" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#E74C3C", fontVariantNumeric: "tabular-nums" }}>{formatDuration(audioDuration)}</span>
                    <span style={{ flex: 1, fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>Grabando…</span>
                  </div>
                  <button type="button" aria-label="Cancelar grabación" className="mic-btn" onClick={cancelRecording} title="Cancelar" style={{ borderColor: "rgba(231,76,60,0.4)", color: "#E74C3C" }}>
                    <X size={15} />
                  </button>
                  <button type="button" aria-label="Detener grabación" className="send-btn" onClick={sendRecording} title="Detener grabación">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
                  </button>
                </>
              ) : previewUrl ? (
                <>
                  <div style={{ flex: 1, padding: "2px 0" }}>
                    <AudioPlayer src={previewUrl} isMe={false} />
                  </div>
                  <button type="button" aria-label="Descartar grabación" className="mic-btn" onClick={cancelRecording} title="Descartar" style={{ borderColor: "rgba(231,76,60,0.4)", color: "#E74C3C" }}>
                    <X size={15} />
                  </button>
                  <button type="button" aria-label="Enviar audio" className="send-btn" onClick={confirmSend} title="Enviar audio">
                    <Send size={16} />
                  </button>
                </>
              ) : (
                <>
                  <input className="msg-input" value={input}
                    placeholder={`Escribe a ${currentPerson.name}…`}
                    onChange={evento => setInput(evento.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()} />
                  <button type="button" aria-label="Grabar audio" className="mic-btn" onClick={startRecording} title="Grabar audio">
                    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="2" width="6" height="13" rx="3" />
                      <path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8" />
                    </svg>
                  </button>
                  <button type="button" aria-label="Enviar mensaje" className="send-btn" onClick={sendMessage} disabled={!input.trim()}>
                    <Send size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {showProfile && currentPerson && (
        <div className="profile-panel">
          <div className="profile-cover">
            <button type="button" aria-label="Cerrar perfil" className="profile-close" onClick={() => setShowProfile(false)}><X size={14} /></button>
            <Image src={currentPerson.photo} alt={currentPerson.name} width={72} height={72} className="profile-avatar" />
          </div>
          <div className="profile-body">
            <div className="profile-name">{currentPerson.name}</div>
            <div className="profile-age">{currentPerson.age} años</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 8, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(currentPerson.status), display: "inline-block" }} />
              <span style={{ fontSize: 13, color: "#64748B" }}>{statusLabel(currentPerson.status)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", fontSize: 13, color: "#0F172A", fontWeight: 600 }}>
              <MapPin size={13} color="var(--teal)" /> A {currentPerson.distance} de ti
            </div>
            <button type="button" style={CM_MSG_BTN}
              onClick={() => setShowProfile(false)}>
              Enviar mensaje
            </button>
            <button type="button" style={CM_ELIMINAR_BTN}
              onMouseEnter={e => { e.currentTarget.style.background = "#FFF0F0"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "white"; }}
              onClick={() => eliminarAmigo(currentPerson.id)}>
              <UserMinus size={14} /> Eliminar amigo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
