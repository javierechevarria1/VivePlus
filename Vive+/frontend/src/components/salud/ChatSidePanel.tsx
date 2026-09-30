"use client";

import Image from "next/image";
import { Send, X, Search } from "lucide-react";
import { AudioPlayerUser } from "./AudioPlayerUser";
import { type Cuidador } from "@/frontend/src/components/cards";
import { type Msg, type CurrentUser, formatAudioDuration, formatTime, formatDateLabel, getDayKey } from "./helpers";

// Panel lateral de chat con el cuidador (extraído de salud.tsx).
const SL_CHAT_CLOSE_BTN: React.CSSProperties = { background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "white", display: "flex", alignItems: "center" };
const SL_DATE_LABEL: React.CSSProperties = { background: "rgba(255,255,255,0.65)", backdropFilter: "blur(6px)", color: "#64748B", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", padding: "4px 14px", borderRadius: 99, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", letterSpacing: "0.02em", textTransform: "capitalize" as const };
const SL_MSG_BUBBLE_BASE: React.CSSProperties = { padding: "10px 14px", fontSize: 13, maxWidth: "82%", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 };
const SL_CHAT_ERROR: React.CSSProperties = { backgroundColor: "#FFF0F0", border: "1px solid #FFCDD5", color: "#E74C3C", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" };
const SL_REC_INDICATOR: React.CSSProperties = { flex: 1, display: "flex", alignItems: "center", gap: 10, background: "white", border: "1.5px solid rgba(231,76,60,0.3)", borderRadius: 10, padding: "0 13px", height: 38 };
const SL_CANCEL_REC_BTN: React.CSSProperties = { background: "white", border: "1.5px solid rgba(231,76,60,0.35)", borderRadius: 10, padding: "8px 10px", cursor: "pointer", color: "#E74C3C", display: "flex", alignItems: "center" };
const SL_SEND_BTN_BASE: React.CSSProperties = { border: "none", borderRadius: 10, padding: "9px 12px", cursor: "pointer", color: "white", display: "flex", alignItems: "center" };
const SL_MIC_BTN_BASE: React.CSSProperties = { background: "white", border: "1.5px solid #C4B5FD", borderRadius: 10, padding: "8px 10px", color: "#94A3B8", display: "flex", alignItems: "center", transition: "border-color .2s, color .2s, opacity .2s" };
const SL_LOGIN_BTN: React.CSSProperties = { width: "100%", padding: "12px", borderRadius: 14, background: "#EDE9FE", color: "var(--muted)", border: "1.5px dashed #C4B5FD", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };

export function ChatSidePanel({
  cuidador: c,
  chatPanelRef,
  chatSearch,
  setChatSearch,
  msgs,
  isLoadingChat,
  chatError,
  setChatError,
  currentUser,
  isRecording,
  audioDuration,
  previewUrl,
  previewCuidRef,
  cancelRecording,
  sendRecording,
  confirmSend,
  sendingAudio,
  inputText,
  setInputText,
  onSend,
  onStartRecording,
  onClose,
  scrollContainerRef,
}: {
  cuidador: Cuidador;
  chatPanelRef: React.RefObject<HTMLDivElement | null>;
  chatSearch: string;
  setChatSearch: (v: string) => void;
  msgs: Msg[];
  isLoadingChat: boolean;
  chatError: string | null;
  setChatError: (v: string | null) => void;
  currentUser: CurrentUser;
  isRecording: boolean;
  audioDuration: number;
  previewUrl: string | null;
  previewCuidRef: React.RefObject<Cuidador | null>;
  cancelRecording: () => void;
  sendRecording: () => void;
  confirmSend: () => void;
  sendingAudio: boolean;
  inputText: string;
  setInputText: (v: string) => void;
  onSend: () => void;
  onStartRecording: () => void;
  onClose: () => void;
  scrollContainerRef: (el: HTMLDivElement | null) => void;
}) {
  const term = chatSearch.trim().toLowerCase();
  const visibleMsgs = msgs.filter(m => !term || m.text?.toLowerCase().includes(term));

  return (
    <div
      ref={chatPanelRef}
      className="cu-chat-side-panel"
    >

      <div style={{ background: c.color, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <Image src={c.photo} width={40} height={40} style={{ borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(255,255,255,0.45)", flexShrink: 0 }} alt={c.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "white", fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
          <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>● En línea · {c.specialty}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar chat"
          style={SL_CHAT_CLOSE_BTN}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.30)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
        >
          <X size={16} />
        </button>
      </div>


      <div className="cu-msg-search" style={{ padding: "10px 14px", borderBottom: "1px solid #C4B5FD", background: "#FAF8FF", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1.5px solid #E9D8FD", borderRadius: 10, padding: "7px 12px" }}>
          <Search size={14} color="#94A3B8" />
          <input
            aria-label="Buscar en mensajes"
            value={chatSearch}
            onChange={e => setChatSearch(e.target.value)}
            placeholder="Buscar en mensajes…"
            className="salud-input-bare"
          />
          {chatSearch && (
            <button type="button" onClick={() => setChatSearch("")} aria-label="Limpiar búsqueda" style={{ border: "none", background: "none", cursor: "pointer", color: "#94A3B8", padding: 0, display: "flex" }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="cu-chat-msgs"
        style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", background: "#F0EAFF" }}
      >
        {isLoadingChat ? (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ width: 24, height: 24, border: `2px solid ${c.color}40`, borderTopColor: c.color, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 10px" }} />
            <p style={{ color: "var(--muted)", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cargando mensajes…</p>
          </div>
        ) : visibleMsgs.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 50 }}>
            <div style={{ fontSize: 32, marginBottom: 2 }}>{term ? "🔍" : "👋"}</div>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 40, fontFamily: "'DM Sans', sans-serif" }}>
              {term ? "Sin resultados" : "Escribe para iniciar la conversación"}
            </p>
          </div>
        ) : visibleMsgs.map((m, idx) => {
          const prevMsg = visibleMsgs[idx - 1];
          const showDate = getDayKey(m.creado_en) !== getDayKey(prevMsg?.creado_en);
          const dateLabel = formatDateLabel(m.creado_en);
          return (
            <div key={m.id ?? m.creado_en}>
              {showDate && dateLabel && (
                <div style={{ display: "flex", justifyContent: "center", margin: "10px 0 8px" }}>
                  <span style={SL_DATE_LABEL}>
                    {dateLabel}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 6 }}>
                <span style={{ ...SL_MSG_BUBBLE_BASE, background: m.from === "user" ? c.color : "white", color: m.from === "user" ? "white" : "var(--slate)", borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px" }}>
                  {m.audio_id ? (
                    <AudioPlayerUser src={`/api/chat-audio?id=${m.audio_id}`} isUser={m.from === "user"} color={c.color} />
                  ) : term && m.text ? (
                    (() => {
                      const idx2 = m.text.toLowerCase().indexOf(term);
                      if (idx2 === -1) return m.text;
                      return (
                        <>{m.text.slice(0, idx2)}<mark style={{ background: m.from === "user" ? "rgba(255,255,255,0.35)" : `${c.color}30`, borderRadius: 3, padding: "0 2px" }}>{m.text.slice(idx2, idx2 + term.length)}</mark>{m.text.slice(idx2 + term.length)}</>
                      );
                    })()
                  ) : (m.text ?? null)}
                </span>
                {m.creado_en && (
                  <span style={{ fontSize: 12, color: "var(--muted)", marginTop: 3, fontFamily: "'DM Sans', sans-serif", opacity: 0.7 }}>
                    {formatTime(m.creado_en)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>


      <div style={{ padding: "12px 14px", borderTop: "1px solid #C4B5FD", background: "#FAF8FF", flexShrink: 0 }}>
        {chatError && (
          <div style={SL_CHAT_ERROR}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {chatError}
            </span>
            <button type="button" onClick={() => setChatError(null)} aria-label="Cerrar aviso de error" style={{ background: "none", border: "none", color: "#E74C3C", cursor: "pointer", display: "flex", padding: 0 }}>
              <X size={14} />
            </button>
          </div>
        )}
        {currentUser ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {isRecording ? (
              <>
                <div style={SL_REC_INDICATOR}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#E74C3C", flexShrink: 0, animation: "availPulse 1s infinite" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#E74C3C", fontVariantNumeric: "tabular-nums" }}>{formatAudioDuration(audioDuration)}</span>
                  <span style={{ flex: 1, fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Grabando…</span>
                </div>
                <button type="button" onClick={cancelRecording} aria-label="Cancelar grabación" style={SL_CANCEL_REC_BTN}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
                <button type="button" onClick={sendRecording} aria-label="Detener grabación" style={{ ...SL_SEND_BTN_BASE, background: c.color }} title="Detener grabación">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
                </button>
              </>
            ) : previewUrl && previewCuidRef.current?.id === c.id ? (
              <>
                <div style={{ flex: 1, padding: "2px 0" }}>
                  <AudioPlayerUser src={previewUrl} isUser={true} color={c.color} />
                </div>
                <button type="button" onClick={cancelRecording} aria-label="Descartar grabación" style={SL_CANCEL_REC_BTN} title="Descartar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
                <button type="button" onClick={confirmSend} disabled={sendingAudio} aria-label="Enviar audio" style={{ ...SL_SEND_BTN_BASE, background: c.color }} title="Enviar audio">
                  <Send size={16} />
                </button>
              </>
            ) : (
              <>
                <input
                  aria-label="Escribe un mensaje"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                  placeholder="Escribe un mensaje…"
                  className="salud-msg-input"
                />
                <button type="button" onClick={onStartRecording} disabled={sendingAudio} title="Grabar audio" aria-label="Grabar audio"
                  style={{ ...SL_MIC_BTN_BASE, cursor: sendingAudio ? "not-allowed" : "pointer", opacity: sendingAudio ? 0.6 : 1 }}
                  onMouseEnter={e => { if (!sendingAudio) Object.assign((e.currentTarget as HTMLElement).style, { borderColor: c.color, color: c.color }); }}
                  onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { borderColor: "#C4B5FD", color: "#94A3B8" })}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="13" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8" />
                  </svg>
                </button>
                <button type="button" onClick={onSend} aria-label="Enviar mensaje" style={{ ...SL_SEND_BTN_BASE, background: c.color }}>
                  <Send size={16} />
                </button>
              </>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("r65:open-auth"))}
            className="cu-chat-btn"
            style={SL_LOGIN_BTN}>
            🔒 Inicia sesión para chatear
          </button>
        )}
      </div>
    </div>
  );
}
