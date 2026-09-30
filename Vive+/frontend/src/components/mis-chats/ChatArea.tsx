"use client";

import { AudioPlayer } from "./AudioPlayer";
import {
  type Conversacion, type Mensaje,
  getAvatarColor, getInitials, statusColor, statusLabel, formatHora, formatFecha, formatDuration,
} from "./helpers";

// Panel de conversación activa (extraído de mis-chats.tsx).
const MC_CHAT_ERROR: React.CSSProperties = { backgroundColor: "#FFF0F0", border: "1px solid #FFCDD5", color: "#E74C3C", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 18px 10px 18px" };
const MC_REC_WRAPPER: React.CSSProperties = { flex: 1, display: "flex", alignItems: "center", gap: 10, background: "var(--white)", border: "1.5px solid rgba(231,76,60,0.3)", borderRadius: 99, padding: "0 18px", height: 46 };

export function ChatArea({
  selUsuario, statusMap, busquedaActiva, setBusquedaActiva, busqueda, setBusqueda, busquedaRef,
  messages, chatError, setChatError, handleSend, isRecording, audioDuration, cancelRecording, sendRecording,
  previewUrl, confirmSend, sending, texto, setTexto, inputRef, startRecording, bottomRef,
}: {
  selUsuario: Conversacion | null;
  statusMap: Record<number, string>;
  busquedaActiva: boolean;
  setBusquedaActiva: React.Dispatch<React.SetStateAction<boolean>>;
  busqueda: string;
  setBusqueda: (v: string) => void;
  busquedaRef: React.RefObject<HTMLInputElement | null>;
  messages: Mensaje[];
  chatError: string | null;
  setChatError: (v: string | null) => void;
  handleSend: (e: React.FormEvent) => void;
  isRecording: boolean;
  audioDuration: number;
  cancelRecording: () => void;
  sendRecording: () => void;
  previewUrl: string | null;
  confirmSend: () => void;
  sending: boolean;
  texto: string;
  setTexto: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  startRecording: () => void;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!selUsuario) {
    return (
      <div className="chat-area">
        <div className="chat-empty">
          <div className="chat-empty-icon">💬</div>
          <h3>Selecciona una conversación</h3>
          <p>Elige un paciente de la lista para ver y responder sus mensajes.</p>
        </div>
      </div>
    );
  }

  const [bg, fg] = getAvatarColor(selUsuario.usuario_id);
  const q = busqueda.toLowerCase().trim();
  const mensajesFiltrados = q
    ? messages.filter(m => m.text?.toLowerCase().includes(q))
    : messages;

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
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-header-avatar" style={{ background: bg, color: fg }}>
          {getInitials(selUsuario.username)}
        </div>
        <div className="chat-header-info">
          <div className="chat-header-name">{selUsuario.username}</div>
          <div className="chat-header-status" style={{ color: statusColor(statusMap[selUsuario.usuario_id] ?? "offline") }}>
            <span className="status-dot-sm" style={{ background: statusColor(statusMap[selUsuario.usuario_id] ?? "offline") }} />
            {statusLabel(statusMap[selUsuario.usuario_id] ?? "offline")}
          </div>
        </div>
        <button
          type="button"
          className={`search-btn ${busquedaActiva ? "active" : ""}`}
          title="Buscar en el chat"
          aria-label="Buscar en el chat"
          onClick={() => {
            setBusquedaActiva(v => !v);
            setBusqueda("");
            setTimeout(() => busquedaRef.current?.focus(), 80);
          }}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      </div>

      {busquedaActiva && (
        <div className="search-bar">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--ink-faint)" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
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
          <button type="button" aria-label="Cerrar búsqueda" className="search-close" onClick={() => { setBusqueda(""); setBusquedaActiva(false); }}>×</button>
        </div>
      )}

      <div className="chat-messages">
        {mensajesFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--ink-faint)", fontSize: 13, marginTop: 40 }}>
            {q ? `Sin resultados para "${busqueda}"` : "Aún no hay mensajes. ¡Inicia la conversación! 👋"}
          </div>
        ) : mensajesFiltrados.map((m, i) => {
          const prevMsg = mensajesFiltrados[i - 1];
          const showDay = !prevMsg || formatFecha(m.creado_en) !== formatFecha(prevMsg.creado_en);
          return (
            <div key={m.id}>
              {showDay && <div className="day-label">{formatFecha(m.creado_en)}</div>}
              <div className={`msg-row ${m.from === "care" ? "care" : "user"}`}>
                {m.from !== "care" && (
                  <div className="msg-avatar-sm" style={{ background: bg, color: fg }}>
                    {getInitials(selUsuario.username)}
                  </div>
                )}
                <div className={`msg ${m.from === "care" ? "care" : "user"}`} style={m.audio_id ? { padding: "10px 12px" } : {}}>
                  {m.audio_id
                    ? <AudioPlayer src={`/api/chat-audio?id=${m.audio_id}`} isCare={m.from === "care"} />
                    : m.text ? resaltarTexto(m.text) : null
                  }
                  <div className="msg-time">{formatHora(m.creado_en)}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {chatError && (
        <div style={MC_CHAT_ERROR}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {chatError}
          </span>
          <button type="button" onClick={() => setChatError(null)} aria-label="Cerrar" style={{ background: "none", border: "none", color: "#E74C3C", cursor: "pointer", display: "flex", padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}

      <form className="chat-form" onSubmit={handleSend}>
        {isRecording ? (
          <>
            <div style={MC_REC_WRAPPER}>
              <span className="rec-dot" />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#E74C3C", fontVariantNumeric: "tabular-nums" }}>{formatDuration(audioDuration)}</span>
              <span style={{ flex: 1, fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic" }}>Grabando…</span>
            </div>
            <button type="button" className="mic-btn" onClick={cancelRecording} title="Cancelar" aria-label="Cancelar" style={{ color: "#E74C3C", borderColor: "rgba(231,76,60,0.4)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <button type="button" className="send-btn" onClick={sendRecording} title="Detener grabación" aria-label="Detener grabación">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
            </button>
          </>
        ) : previewUrl ? (
          <>
            <div style={{ flex: 1, padding: "2px 0" }}>
              <AudioPlayer src={previewUrl} isCare={false} />
            </div>
            <button type="button" className="mic-btn" onClick={cancelRecording} title="Descartar" aria-label="Descartar" style={{ color: "#E74C3C", borderColor: "rgba(231,76,60,0.4)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <button type="button" className="send-btn" onClick={confirmSend} disabled={sending} title="Enviar audio" aria-label="Enviar audio">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <div className="input-wrap">
              <input
                ref={inputRef}
                className="chat-input"
                value={texto}
                onChange={e => setTexto(e.target.value)}
                placeholder={`Escribe a ${selUsuario.username}…`}
              />
            </div>
            <button type="button" className="mic-btn" onClick={startRecording} disabled={sending} title="Grabar audio" aria-label="Grabar audio">
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="13" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8" />
              </svg>
            </button>
            <button type="submit" className="send-btn" disabled={sending || !texto.trim()} title="Enviar" aria-label="Enviar">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </form>
    </div>
  );
}
