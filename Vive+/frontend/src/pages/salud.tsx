"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FadeUp } from "@/frontend/src/components/fade-up";
import { CuidadorCard, FilterBar } from "@/frontend/src/components/cards";
import { usePlan } from "@/frontend/src/components/usePlan";

import { SALUD_STYLES } from "../components/salud/styles";
import { type CurrentUser, lockScroll, unlockScroll } from "../components/salud/helpers";
import { MouseGlow } from "../components/salud/MouseGlow";
import { ChatSidePanel } from "../components/salud/ChatSidePanel";
import { ValorarModal } from "../components/salud/ValorarModal";
import {
  useCurrentUser, useSaludCuidadores, useCuidadorChat, useVoiceRecorder, useValoracion,
} from "../components/salud/hooks";

// Re-exportado por compatibilidad (antes vivía en esta página).
export type { CurrentUser } from "../components/salud/helpers";

const SL_CTA_BOX: React.CSSProperties = { marginTop: 80, background: "linear-gradient(135deg, #FDF2F8 0%, #FBCFE8 100%)", borderRadius: 28, padding: "52px 48px", textAlign: "center", border: "1px solid rgba(236,72,153,0.15)", position: "relative", overflow: "hidden", maxWidth: 680, marginLeft: "auto", marginRight: "auto" };
const SL_CTA_DECO: React.CSSProperties = { position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(236,72,153,0.05)", pointerEvents: "none" };
const SL_CTA_LINK: React.CSSProperties = { background: "var(--teal)", color: "white", borderRadius: 99, padding: "14px 38px", fontSize: 15, fontWeight: 600, textDecoration: "none", display: "inline-block", transition: "transform 0.25s, box-shadow 0.25s", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 8px 24px rgba(236,72,153,0.30)" };

export default function SaludPage({ initialUser = null }: { initialUser?: CurrentUser }) {
  const { hasPlan } = usePlan();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const { cuidadores, setCuidadores, loadingPage, filterOptions, filtros, setFiltros } = useSaludCuidadores();
  const currentUser = useCurrentUser(initialUser);
  const {
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
  } = useCuidadorChat(currentUser, cuidadores);
  const {
    isRecording, audioDuration, sendingAudio, previewUrl, previewCuidRef,
    startRecording, cancelRecording, sendRecording, confirmSend, stopRecordingOnClose,
  } = useVoiceRecorder(currentUser, setMessages);
  const {
    valorarOpen, setValorarOpen, valorForm, setValorForm, submittingValor,
    valorSuccess, setValorSuccess, valorModalRef, valorScrollRef, handleValoracion,
  } = useValoracion(currentUser, setCuidadores);

  const heroBgRef        = useRef<HTMLDivElement>(null);
  const heroContentRef   = useRef<HTMLDivElement>(null);
  const mainRef          = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);


  useEffect(() => {
    if (valorarOpen) return;
    if (chatOpen !== null) {
      const timer = setTimeout(() => {
        const el = chatPanelRef.current;
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 90;
          window.scrollTo(0, top);
        }
        lockScroll();
      }, 50);
      return () => { clearTimeout(timer); unlockScroll(); };
    } else {
      unlockScroll();
      return () => { unlockScroll(); };
    }
  }, [chatOpen, valorarOpen, chatPanelRef]);

  useEffect(() => {
    if (valorarOpen) {
      valorScrollRef.current = window.scrollY;
      lockScroll();
      valorModalRef.current?.showModal();
    } else {
      if (chatOpen !== null) {
        lockScroll();
      } else {
        unlockScroll();
        window.scrollTo({ top: valorScrollRef.current, behavior: "smooth" });
      }
    }
    return () => { unlockScroll(); };
  }, [valorarOpen, chatOpen, valorModalRef, valorScrollRef]);

  const toggleFiltro = (t: string) => {
    stopRecordingOnClose();
    setChatOpen(null);
    setChatSearch("");
    if (t === "Todos") {
      setFiltros(["Todos"]);
      return;
    }
    setFiltros((prev) => {
      const sinTodos = prev.filter((f) => f !== "Todos");
      if (prev.includes(t)) {
        const next = sinTodos.filter((f) => f !== t);
        return next.length === 0 ? ["Todos"] : next;
      } else {
        return [...sinTodos, t];
      }
    });
  };

  const filtrosSet = new Set(filtros);
  const filtered = filtrosSet.has("Todos")
    ? cuidadores
    : [...cuidadores]
        .filter((c) => filtrosSet.has(c.tipo?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ?? ""))
        .sort((a, b) => filtros.indexOf(a.tipo?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ?? "") - filtros.indexOf(b.tipo?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ?? ""));

  const activeCuidador = chatOpen !== null ? cuidadores.find(x => x.id === chatOpen) : undefined;

  return (
    <div className="page-enter" style={{ background: "#FFFFFF" }}>
      <style>{SALUD_STYLES}</style>

      <MouseGlow />


      <header className="sn-hero" ref={heroRef}>
        <div
          ref={heroBgRef}
          className="sn-hero__bg"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=1800&auto=format&fit=crop')" }}
        />
        <div className="sn-hero__overlay" />
        <div className="sn-hero__inner" ref={heroContentRef}>
          <h1 className="sn-hero__title">
            <span className="sn-word"><span>Salud</span></span>
            <br />
            <span className="sn-word delay gold"><span>Bienestar</span></span>
          </h1>
          <p className="sn-hero__sub">
            Profesionales cualificados y comprometidos con el bienestar de las personas mayores
          </p>
        </div>
        <div className="sn-hero__scroll">
          <div className="sn-hero__bar" />
          <span>SCROLL</span>
        </div>
      </header>


      <div className="cu-wave" style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 55" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%" }}>
          <path d="M0,28 C360,55 1080,0 1440,28 L1440,55 L0,55 Z" fill="white" />
        </svg>
      </div>


      <div style={{ background: "white", borderBottom: "1px solid var(--sand)" }}></div>


      <section ref={mainRef} id="cuidadores" style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(32px,5vw,60px) clamp(16px,4vw,40px) 100px" }}>

        <FilterBar
          options={filterOptions}
          active={filtros}
          onToggle={toggleFiltro}
          resultWord="profesional"
          resultCount={filtered.length}
        />


        {loadingPage && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 32, height: 32, border: "3px solid rgba(236,72,153,0.20)", borderTopColor: "var(--teal)", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}>Cargando profesionales…</p>
          </div>
        )}


        {!loadingPage && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "var(--muted)", fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>No hay profesionales disponibles en esta categoría.</p>
          </div>
        )}

        <div className="cu-cards-chat-wrapper">

          <div className="cu-card-grid" style={{ flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(min(${chatOpen !== null ? "280px" : "340px"}, 100%), 1fr))`, gap: 28, alignItems: "start" }}>
            {filtered.map((c, i) => (
              <CuidadorCard
                key={c.id}
                cuidador={c}
                isLoggedIn={!!currentUser}
                chatOpen={chatOpen === c.id}
                unreadCount={unreadCounts[c.id] ?? 0}
                onChatToggle={() => {
                  if (!hasPlan) { window.location.href = "/planes?error=plan-required"; return; }
                  const next = chatOpen === c.id ? null : c.id;
                  if (next === null) stopRecordingOnClose();
                  setChatOpen(next);
                  if (next !== null) setUnreadCounts(prev => ({ ...prev, [next]: 0 }));
                  setChatSearch("");
                  setChatError(null);
                }}
                onValoracion={() => {
                  if (!currentUser) { window.dispatchEvent(new CustomEvent("r65:open-auth")); return; }
                  setValorForm({ rating: 0, comentario: "" });
                  setValorarOpen(c);
                }}
                delay={i * 0.07}
              />
            ))}
          </div>

          {chatOpen !== null && activeCuidador && (
            <ChatSidePanel
              cuidador={activeCuidador}
              chatPanelRef={chatPanelRef}
              chatSearch={chatSearch}
              setChatSearch={setChatSearch}
              msgs={messages[activeCuidador.id] ?? []}
              isLoadingChat={loadingChat === activeCuidador.id}
              chatError={chatError}
              setChatError={setChatError}
              currentUser={currentUser}
              isRecording={isRecording}
              audioDuration={audioDuration}
              previewUrl={previewUrl}
              previewCuidRef={previewCuidRef}
              cancelRecording={cancelRecording}
              sendRecording={sendRecording}
              confirmSend={confirmSend}
              sendingAudio={sendingAudio}
              inputText={inputs[activeCuidador.id] ?? ""}
              setInputText={v => setInputs(prev => ({ ...prev, [activeCuidador.id]: v }))}
              onSend={() => sendMessage(activeCuidador)}
              onStartRecording={() => startRecording(activeCuidador)}
              onClose={() => { stopRecordingOnClose(); setChatOpen(null); setChatSearch(""); }}
              scrollContainerRef={el => { scrollContainers.current[activeCuidador.id] = el; }}
            />
          )}

        </div>


        <FadeUp>
          <div style={SL_CTA_BOX}>
            <div style={SL_CTA_DECO} />
            <div style={{ fontSize: 36, marginBottom: 16 }}>🤝</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem,3vw,2.4rem)", color: "var(--slate)", marginBottom: 14, fontWeight: 600 }}>
              ¿Quieres trabajar <em>con nosotros</em>?
            </h3>
            <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.7, maxWidth: 500, margin: "0 auto 28px", fontFamily: "'DM Sans', sans-serif" }}>
              Si eres profesional de la salud y quieres formar parte de nuestro equipo, ponte en contacto con nosotros.
            </p>
            <Link href="/contacto" style={SL_CTA_LINK}
              onMouseEnter={(evento) => Object.assign((evento.currentTarget as HTMLElement).style, { transform: "scale(1.02)", boxShadow: "0 14px 36px rgba(236,72,153,0.35)" })}
              onMouseLeave={(evento) => Object.assign((evento.currentTarget as HTMLElement).style, { transform: "none", boxShadow: "0 10px 24px rgba(236,72,153,0.28)" })}>
              Contáctanos
            </Link>
          </div>
        </FadeUp>

        <div style={{ marginTop: "2.5rem" }}>
          <Link
            href="/"
            style={{
              color: "#EC4899",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: 13.5,
              opacity: 0.75,
            }}
          >
            Volver al inicio
          </Link>
        </div>
      </section>


      {valorarOpen && (
        <ValorarModal
          valorarOpen={valorarOpen}
          valorModalRef={valorModalRef}
          setValorarOpen={setValorarOpen}
          valorForm={valorForm}
          setValorForm={setValorForm}
          submittingValor={submittingValor}
          valorSuccess={valorSuccess}
          setValorSuccess={setValorSuccess}
          handleValoracion={handleValoracion}
        />
      )}
    </div>
  );
}
