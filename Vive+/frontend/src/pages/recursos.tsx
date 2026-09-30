"use client";

import { useState, useEffect, useRef, useMemo, useReducer } from "react";
import Link from "next/link";
import {
  Users, HeartPulse, Dumbbell, Leaf, Palette, Landmark, Coffee, GraduationCap,
  Tag, Heart, Shield, Building2, Laptop, ShieldCheck, Activity, Sofa,
  Eye, MessageCircle, Star, Zap, Globe, LayoutGrid,
  ChevronLeft, ChevronRight, MapPin, Clock,
} from "lucide-react";
import PusherClient from "pusher-js";
import { FadeUp } from "@/frontend/src/components/fade-up";
import { BannerPublicitario } from "@/frontend/src/components/BannerPublicitario";
import { FilterBar, type FilterOption } from "@/frontend/src/components/filter-bar";
import { ActividadCard } from "@/frontend/src/components/cards";
import { actividadesService } from "@/frontend/src/services/actividadesService";
import PlanGate from "@/frontend/src/components/plan-gate";
import { usePlan } from "@/frontend/src/components/usePlan";

type CatDB = { id: number; nombre: string; color: string; icono: string; orden: number };

const RC_MOUSE_GLOW: React.CSSProperties = { position: "fixed", pointerEvents: "none", zIndex: 0, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)", left: 0, top: 0, transition: "transform 0.1s ease" };
const RC_CTA_BOX: React.CSSProperties = { marginTop: 32, background: "linear-gradient(135deg, #9333EA 0%, #EC4899 100%)", borderRadius: 28, padding: "52px 48px", textAlign: "center", position: "relative", overflow: "hidden", boxShadow: "0 24px 60px rgba(147,51,234,0.20)" };
const RC_CTA_DISABLED: React.CSSProperties = { background: "#9333EA", color: "white", borderRadius: 99, padding: "14px 38px", fontSize: 15, fontWeight: 600, display: "inline-block", fontFamily: "'DM Sans', sans-serif", opacity: 0.6, cursor: "not-allowed" };
const RC_CTA_LINK: React.CSSProperties = { background: "#9333EA", color: "white", borderRadius: 99, padding: "14px 38px", fontSize: 15, fontWeight: 600, textDecoration: "none", display: "inline-block", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 8px 28px rgba(236,72,153,0.35)" };
const RC_MODAL_BACKDROP: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
const RC_USERS_LABEL: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 8, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" };
const RC_USER_BTN_BASE: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14 };
const RC_ERROR_BOX: React.CSSProperties = { background: "#FFF5F5", border: "1px solid #FFCDD5", borderRadius: 10, padding: "9px 14px", marginBottom: 12, fontSize: 13, color: "#C0392B", fontFamily: "'DM Sans', sans-serif" };
const RC_CANCEL_BTN: React.CSSProperties = { flex: 1, padding: "11px", background: "#F5F0FF", color: "#64748B", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };
const RC_CONFIRM_BTN_BASE: React.CSSProperties = { flex: 2, padding: "11px", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 };
const RC_VOLVER_BTN: React.CSSProperties = { padding: "10px", background: "#F5F0FF", color: "#64748B", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };
const RC_CALENDAR_BOX: React.CSSProperties = { background: "#ffffff", border: "1px solid #F0E7D2", borderRadius: 28, boxShadow: "0 4px 12px rgba(43,33,23,0.07), 0 2px 4px rgba(43,33,23,0.04)", maxWidth: 760, margin: "0 auto", padding: 32, overflow: "visible" };
const RC_CAL_DAY_CELL_BASE: React.CSSProperties = { width: "100%", height: "100%", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 };
const RC_MAIN_CONTENT: React.CSSProperties = { maxWidth: 1520, margin: "0 auto", padding: "2.5rem 1.5rem 4rem", fontFamily: "'DM Sans', sans-serif", display: "flex", gap: "2rem", alignItems: "flex-start", scrollMarginTop: "100px" };
const RC_CAL_NAV_BTN: React.CSSProperties = {
  minHeight: 40, padding: "8px 16px",
  background: "#FFF5F9", color: "#2A2520",
  border: "2px solid #E8DEC8", borderRadius: 12,
  cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
  fontFamily: "'DM Sans', sans-serif",
};

function formatHora(fecha: string) {
  const d = new Date(fecha);
  const h = d.getHours(), m = d.getMinutes();
  if (h === 0 && m === 0) return null;
  return `${h}:${m.toString().padStart(2, "0")}`;
}
function formatDia(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" });
}

const ICON_MAP: Record<string, React.ReactNode> = {
  HeartPulse: <HeartPulse size={16} />, Dumbbell: <Dumbbell size={16} />,
  Leaf: <Leaf size={16} />, Palette: <Palette size={16} />,
  Landmark: <Landmark size={16} />, Coffee: <Coffee size={16} />,
  GraduationCap: <GraduationCap size={16} />, Heart: <Heart size={16} />,
  Shield: <Shield size={16} />, Building2: <Building2 size={16} />,
  Users: <Users size={16} />, Laptop: <Laptop size={16} />,
  ShieldCheck: <ShieldCheck size={16} />, Activity: <Activity size={16} />,
  Sofa: <Sofa size={16} />, Eye: <Eye size={16} />,
  MessageCircle: <MessageCircle size={16} />, Tag: <Tag size={16} />,
  Star: <Star size={16} />, Zap: <Zap size={16} />,
  Globe: <Globe size={16} />, LayoutGrid: <LayoutGrid size={16} />,
};

type Actividad = {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  fecha: string;
  lugar: string;
  plazas_max: number;
  inscritos?: number;
  url?: string | null;
  url_lugar?: string | null;
  duracion_min?: number | null;
  imagen?: string | null;
};

type CancelarPersona = { id: number; username: string };

type CancelarState = {
  modal: Actividad | null;
  usuarios: CancelarPersona[];
  seleccion: number[];
  cancelSelf: boolean;
  selfInscrito: boolean;
};

type CancelarAction =
  | { type: "abrir"; actividad: Actividad | null }
  | { type: "datos-cargados"; usuarios: CancelarPersona[]; selfInscrito: boolean }
  | { type: "toggle-usuario"; id: number }
  | { type: "toggle-self" }
  | { type: "tras-confirmar"; usuarios: CancelarPersona[]; selfRemains: boolean }
  | { type: "cerrar" };

const CANCELAR_INITIAL: CancelarState = { modal: null, usuarios: [], seleccion: [], cancelSelf: false, selfInscrito: false };

function cancelarReducer(state: CancelarState, action: CancelarAction): CancelarState {
  switch (action.type) {
    case "abrir":
      return { modal: action.actividad, usuarios: [], seleccion: [], cancelSelf: false, selfInscrito: false };
    case "datos-cargados":
      return { ...state, usuarios: action.usuarios, selfInscrito: action.selfInscrito };
    case "toggle-usuario":
      return { ...state, seleccion: state.seleccion.includes(action.id) ? state.seleccion.filter(id => id !== action.id) : [...state.seleccion, action.id] };
    case "toggle-self":
      return { ...state, cancelSelf: !state.cancelSelf };
    case "tras-confirmar":
      return {
        ...state,
        usuarios: action.usuarios,
        selfInscrito: action.selfRemains,
        seleccion: [],
        cancelSelf: false,
        modal: action.usuarios.length === 0 && !action.selfRemains ? null : state.modal,
      };
    case "cerrar":
      return { ...state, modal: null };
    default:
      return state;
  }
}

function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (evento: MouseEvent) => { if (ref.current) { ref.current.style.transform = `translate(${evento.clientX - 190}px, ${evento.clientY - 190}px)`; } };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={ref} style={RC_MOUSE_GLOW} />;
}

const CALENDARIO_STYLES = `
  .sn-hero{position:relative;height:100vh;min-height:640px;overflow:hidden;color:#fff;display:grid;place-items:center;isolation:isolate}
  .sn-hero__bg{position:absolute;inset:-8%;z-index:-2;will-change:transform;background-size:cover;background-position:center}
  .sn-hero__overlay{position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(29,78,216,.30) 0%,rgba(29,78,216,.10) 30%,rgba(147,51,234,.45) 78%,rgba(15,10,30,.88) 100%)}
  .sn-hero__inner{text-align:center;max-width:1100px;padding:0 24px;position:relative;z-index:1;will-change:transform,opacity}
  .sn-hero__title{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:clamp(72px,12vw,160px);line-height:.95;letter-spacing:-.03em;margin:28px 0 24px}
  .sn-word{display:inline-block;overflow:hidden;vertical-align:bottom;padding:0 .12em;margin:0 -.12em}
  .sn-word>span{display:inline-block;transform:translateY(110%);animation:snRise .9s cubic-bezier(.2,.7,.2,1) forwards;padding:0 .04em}
  .sn-word.delay>span{animation-delay:.18s}
  .sn-word.gold>span{color:#EC4899;font-style:italic}
  .sn-hero__sub{font-size:clamp(15px,1.4vw,19px);max-width:680px;margin:0 auto;font-weight:300;opacity:0;animation:snFade .9s ease .55s forwards}
  .sn-hero__scroll{position:absolute;bottom:36px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;color:rgba(255,255,255,.85);font-size:11px;letter-spacing:.3em;font-weight:500;opacity:0;animation:snFade .9s ease .9s forwards}
  .sn-hero__bar{width:1px;height:46px;background:linear-gradient(to bottom,transparent,#EC4899,transparent);position:relative;overflow:hidden}
  .sn-hero__bar::after{content:'';position:absolute;left:-1px;top:-20px;width:3px;height:20px;background:#EC4899;border-radius:2px;animation:snScrollDot 2s ease-in-out infinite}
  .sn-eyebrow-hero{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;backdrop-filter:blur(8px);font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase}
  .sn-eyebrow-hero::before{content:'';width:8px;height:8px;border-radius:50%;background:#EC4899;box-shadow:0 0 8px #EC4899;flex-shrink:0}
  @keyframes snRise{to{transform:translateY(0)}}
  @keyframes snFade{to{opacity:1}}
  @keyframes snScrollDot{0%{top:-20px;opacity:0}20%{opacity:1}80%{opacity:1}100%{top:46px;opacity:0}}
  @media(max-width:768px){.sn-hero__title{font-size:clamp(44px,10vw,72px)!important}.sn-hero{height:60vh;min-height:300px}.sn-hero__inner{padding:0 16px}}
  @media(max-width:480px){.sn-hero{height:55vh;min-height:260px}}
  @media(max-width:480px){.sn-hero__title{font-size:clamp(34px,9vw,48px)!important}.sn-hero{min-height:400px}.sn-hero__inner{padding:0 12px}.sn-hero__sub{font-size:14px!important}.sn-eyebrow-hero{font-size:10px;padding:6px 14px}}

  .cal-cell {
    position: relative;
    z-index: 1;
    transition: z-index 0s 0.55s;
  }
  .cal-cell.has-event { cursor: pointer; }
  .cal-cell.has-event:hover {
    z-index: 40;
    transition: z-index 0s 0s;
  }
  .cal-cell.is-today {
    z-index: 2;
    outline: 2.5px solid #EC4899;
    outline-offset: 2px;
    border-radius: 12px;
    animation: todayGlow 2.6s ease-in-out infinite;
  }
  @keyframes todayGlow {
    0%, 100% { box-shadow: 0 0 8px rgba(236,72,153,0.22); }
    50%       { box-shadow: 0 0 20px rgba(236,72,153,0.52); }
  }

  .cal-flip-inner {
    width: 100%; height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.52s cubic-bezier(.4,0,.2,1),
                box-shadow 0.52s ease;
  }
  .cal-cell.has-event:hover .cal-flip-inner {
    transform: rotateY(180deg) scale(2.9);
    box-shadow: 0 18px 52px rgba(147,51,234,0.25);
  }

  .cal-face {
    position: absolute; inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 10px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }
  .cal-face-back {
    transform: rotateY(180deg);
    align-items: flex-start;
    justify-content: flex-start;
    overflow: hidden;
    padding: 0;
  }
  .cal-back-strip {
    width: 100%; height: 3px; flex-shrink: 0;
  }
  .cal-back-content {
    padding: 4px 5px 4px;
    display: flex; flex-direction: column;
    width: 100%; flex: 1; overflow: hidden;
    gap: 2px;
  }
  .cal-back-badge {
    display: inline-flex; align-items: center;
    padding: 1px 4px; border-radius: 99px;
    background: rgba(255,255,255,0.18);
    font-family: 'DM Sans', sans-serif;
    font-size: 3.5px; font-weight: 700;
    color: #fff; letter-spacing: 0.02em;
    white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; max-width: 100%;
    flex-shrink: 0;
  }
  .cal-back-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 6px; font-weight: 600;
    color: #fff; line-height: 1.25;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .cal-back-sep {
    width: 100%; height: 0.5px;
    background: rgba(255,255,255,0.25);
    flex-shrink: 0; margin: 1px 0;
  }
  .cal-back-meta {
    display: flex; align-items: center;
    gap: 2px;
    font-family: 'DM Sans', sans-serif;
    font-size: 3.8px; color: rgba(255,255,255,0.78);
    line-height: 1.3; overflow: hidden;
    white-space: nowrap; text-overflow: ellipsis;
    flex-shrink: 0;
  }
  .cal-back-more {
    font-family: 'DM Sans', sans-serif;
    font-size: 3.5px; color: rgba(255,255,255,0.55);
    font-style: italic; margin-top: 1px;
  }

  @media (max-width: 640px) {
    .cal-cell.has-event:hover .cal-flip-inner { transform: none !important; }
    .cal-cell.has-event:hover { transform: none !important; box-shadow: none !important; }
    .cal-cell.has-event.selected .cal-face {
      outline: 3px solid currentColor;
      outline-offset: 2px;
    }
  }

  .cal-mobile-panel {
    display: none;
  }
  @media (max-width: 640px) {
    .cal-mobile-panel {
      display: block;
      margin-top: 20px;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(147,51,234,0.14);
      animation: calPanelIn 0.28s cubic-bezier(.34,1.56,.64,1) both;
    }
    @keyframes calPanelIn {
      from { opacity: 0; transform: translateY(12px) scale(0.97); }
      to   { opacity: 1; transform: none; }
    }
    .cal-panel-strip { height: 5px; }
    .cal-panel-body {
      background: white;
      padding: 18px 20px 20px;
    }
    .cal-panel-badge {
      display: inline-flex; align-items: center;
      padding: 4px 10px; border-radius: 99px;
      font-family: 'DM Sans', sans-serif;
      font-size: 11px; font-weight: 700;
      margin-bottom: 10px;
    }
    .cal-panel-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 20px; font-weight: 600;
      color: #9333EA; line-height: 1.2;
      margin-bottom: 12px;
    }
    .cal-panel-sep { height: 1px; background: #F5F0FF; margin-bottom: 12px; }
    .cal-panel-meta {
      display: flex; align-items: flex-start; gap: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px; color: #5A6E66;
      line-height: 1.4; margin-bottom: 8px;
    }
    .cal-panel-meta:last-child { margin-bottom: 0; }
    .cal-panel-act-sep { height: 1px; background: #F5F0FF; margin: 14px 0; }
  }
`;

function CalendarioActividades({ actividades, catsDB }: { actividades: Actividad[]; catsDB: CatDB[] }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [año, setAño] = useState(hoy.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const actividadesPorDia = useMemo(() => {
    const map = new Map<number, Actividad[]>();
    actividades.forEach(a => {
      const d = new Date(a.fecha);
      if (d.getMonth() === mes && d.getFullYear() === año) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(a);
      }
    });
    return map;
  }, [actividades, mes, año]);

  const primerDia = new Date(año, mes, 1).getDay();
  const offset = primerDia === 0 ? 6 : primerDia - 1;
  const diasEnMes = new Date(año, mes + 1, 0).getDate();
  const nombreMes = new Date(año, mes, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: "Europe/Madrid" });

  const prevMes = () => { setSelectedDay(null); if (mes === 0) { setMes(11); setAño(y => y - 1); } else { setMes(m => m - 1); } };
  const nextMes = () => { setSelectedDay(null); if (mes === 11) { setMes(0); setAño(y => y + 1); } else { setMes(m => m + 1); } };

  return (
    <section style={{ background: "#F8F5FF", padding: "80px 0" }}>
      <style>{CALENDARIO_STYLES}</style>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px" }}>

        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 48px" }}>
          <div style={{ marginBottom: 14, display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-block", width: 56, height: 4, borderRadius: 2, background: "#EC4899" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "#EC4899", fontFamily: "'DM Sans', sans-serif" }}>
              Próximamente
            </span>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.6rem,3.2vw,2.5rem)", fontWeight: 500, color: "#1F1B17", lineHeight: 1.1, margin: 0 }}>
            Calendario completo{" "}
            <em style={{ fontStyle: "italic", color: "#EC4899" }}>del mes.</em>
          </h2>
        </div>

        <div style={RC_CALENDAR_BOX}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button type="button" onClick={prevMes} aria-label="Mes anterior" style={RC_CAL_NAV_BTN}><ChevronLeft size={16} /></button>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 500, color: "#1F1B17", textTransform: "capitalize", margin: 0 }}>
              {nombreMes}
            </h3>
            <button type="button" onClick={nextMes} aria-label="Mes siguiente" style={RC_CAL_NAV_BTN}><ChevronRight size={16} /></button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, overflow: "visible" }}>
            {["L","M","X","J","V","S","D"].map(d => (
              <div key={d} style={{ textAlign: "center", padding: 8, fontWeight: 600, color: "#4F4533", fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif" }}>
                {d}
              </div>
            ))}
            {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: diasEnMes }).map((_, i) => {
              const day = i + 1;
              const dayActivities = actividadesPorDia.get(day);
              const hasEvent = !!dayActivities;
              const esHoy = day === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear();

              return (
                <div
                  key={day}
                  className={`cal-cell${hasEvent ? " has-event" : ""}${selectedDay === day ? " selected" : ""}${esHoy ? " is-today" : ""}`}
                  style={{ aspectRatio: "1", borderRadius: 10 }}
                  role={hasEvent ? "button" : undefined}
                  tabIndex={hasEvent ? 0 : undefined}
                  onClick={() => hasEvent && setSelectedDay(selectedDay === day ? null : day)}
                  onKeyDown={(e) => { if (hasEvent && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setSelectedDay(selectedDay === day ? null : day); } }}
                >
                  {hasEvent ? (
                    <div className="cal-flip-inner">
                      {/* Frente */}
                      {(() => {
                        const frontColor = catsDB.find(c => c.nombre === dayActivities![0].categoria)?.color ?? "#EC4899";
                        return (
                          <div className="cal-face" style={{
                            background: `${frontColor}18`,
                            border: `2px solid ${frontColor}`,
                            fontWeight: 700,
                            color: frontColor,
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.9rem",
                            gap: 4,
                          }}>
                            {day}
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: frontColor, display: "block" }} />
                          </div>
                        );
                      })()}

                      {/* Reverso — card dentro del mismo cuadrado */}
                      {(() => {
                        const a = dayActivities![0];
                        const catColor = catsDB.find(c => c.nombre === a.categoria)?.color ?? "#EC4899";
                        return (
                      <div className="cal-face cal-face-back" style={{ background: `linear-gradient(145deg, ${catColor}dd 0%, ${catColor} 100%)` }}>
                        {(() => {
                          const hora = formatHora(a.fecha);
                          const libres = a.plazas_max ? a.plazas_max - Number(a.inscritos ?? 0) : null;
                          const extras = dayActivities!.length - 1;
                          return (
                            <>
                              <div className="cal-back-strip" style={{ background: "rgba(255,255,255,0.25)" }} />
                              <div className="cal-back-content">
                                <span className="cal-back-badge">{a.categoria}</span>
                                <div className="cal-back-name">{a.nombre}</div>
                                <div className="cal-back-sep" />
                                <div className="cal-back-meta">
                                  <Clock size={3.5} color="rgba(255,255,255,0.78)" />
                                  <span>{formatDia(a.fecha)}{hora ? ` · ${hora}h` : ""}{a.duracion_min ? ` · ${a.duracion_min}min` : ""}</span>
                                </div>
                                {a.lugar && (
                                  <div className="cal-back-meta">
                                    <MapPin size={3.5} color="rgba(255,255,255,0.78)" />
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{a.lugar}</span>
                                  </div>
                                )}
                                {libres !== null && (
                                  <div className="cal-back-meta">
                                    <Users size={3.5} color="rgba(255,255,255,0.78)" />
                                    <span style={{ color: libres <= 0 ? "#FF8A80" : "rgba(255,255,255,0.78)" }}>
                                      {libres <= 0 ? "Completo" : `${libres} plazas`}
                                    </span>
                                  </div>
                                )}
                                {extras > 0 && (
                                  <div className="cal-back-more">+{extras} más</div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div style={{
                      ...RC_CAL_DAY_CELL_BASE,
                      background: esHoy ? "rgba(236,72,153,0.10)" : "#FFF5F9",
                      border: esHoy ? "2px solid #EC4899" : "1px solid #F0E7D2",
                      fontWeight: esHoy ? 700 : 500,
                      color: esHoy ? "#EC4899" : "#1F1B17",
                    }}>
                      {day}
                      {esHoy && <span style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#EC4899", lineHeight: 1 }}>hoy</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Panel móvil — aparece al tocar un día */}
          {selectedDay && actividadesPorDia.get(selectedDay) && (
            <div className="cal-mobile-panel" key={selectedDay}>
              {actividadesPorDia.get(selectedDay)!.map((a, idx) => {
                const catColor = catsDB.find(c => c.nombre === a.categoria)?.color ?? "#EC4899";
                const hora = formatHora(a.fecha);
                const libres = a.plazas_max ? a.plazas_max - Number(a.inscritos ?? 0) : null;
                return (
                  <div key={a.id}>
                    {idx === 0 && <div className="cal-panel-strip" style={{ background: catColor }} />}
                    <div className="cal-panel-body">
                      {idx > 0 && <div className="cal-panel-act-sep" />}
                      <span className="cal-panel-badge" style={{ background: `${catColor}18`, color: catColor }}>
                        {a.categoria}
                      </span>
                      <div className="cal-panel-name">{a.nombre}</div>
                      <div className="cal-panel-sep" />
                      <div className="cal-panel-meta">
                        <Clock size={14} color={catColor} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{formatDia(a.fecha)}{hora ? ` · ${hora}h` : ""}{a.duracion_min ? ` · ${a.duracion_min} min` : ""}</span>
                      </div>
                      {a.lugar && (
                        <div className="cal-panel-meta">
                          <MapPin size={14} color={catColor} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{a.lugar}</span>
                        </div>
                      )}
                      {libres !== null && (
                        <div className="cal-panel-meta">
                          <Users size={14} color={catColor} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ color: libres <= 0 ? "#C0392B" : "#5A6E66" }}>
                            {libres <= 0 ? "Completo" : `${libres} plaza${libres !== 1 ? "s" : ""} libre${libres !== 1 ? "s" : ""}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

const RECURSOS_PAGE_STYLES = `
  .sn-hero{position:relative;height:100vh;min-height:640px;overflow:hidden;color:#fff;display:grid;place-items:center;isolation:isolate}
  .sn-hero__bg{position:absolute;inset:-8%;z-index:-2;will-change:transform;background-size:cover;background-position:center}
  .sn-hero__overlay{position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(29,78,216,.30) 0%,rgba(29,78,216,.10) 30%,rgba(147,51,234,.45) 78%,rgba(15,10,30,.88) 100%)}
  .sn-hero__inner{text-align:center;max-width:1100px;padding:0 24px;position:relative;z-index:1;will-change:transform,opacity}
  .sn-hero__title{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:clamp(72px,12vw,160px);line-height:.95;letter-spacing:-.03em;margin:28px 0 24px}
  .sn-word{display:inline-block;overflow:hidden;vertical-align:bottom;padding:0 .12em;margin:0 -.12em}
  .sn-word>span{display:inline-block;transform:translateY(110%);animation:snRise .9s cubic-bezier(.2,.7,.2,1) forwards;padding:0 .04em}
  .sn-word.delay>span{animation-delay:.18s}
  .sn-word.gold>span{color:#EC4899;font-style:italic}
  .sn-hero__sub{font-size:clamp(15px,1.4vw,19px);max-width:680px;margin:0 auto;font-weight:300;opacity:0;animation:snFade .9s ease .55s forwards}
  .sn-hero__scroll{position:absolute;bottom:36px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;color:rgba(255,255,255,.85);font-size:11px;letter-spacing:.3em;font-weight:500;opacity:0;animation:snFade .9s ease .9s forwards}
  .sn-hero__bar{width:1px;height:46px;background:linear-gradient(to bottom,transparent,#EC4899,transparent);position:relative;overflow:hidden}
  .sn-hero__bar::after{content:'';position:absolute;left:-1px;top:-20px;width:3px;height:20px;background:#EC4899;border-radius:2px;animation:snScrollDot 2s ease-in-out infinite}
  .sn-eyebrow-hero{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;backdrop-filter:blur(8px);font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase}
  .sn-eyebrow-hero::before{content:'';width:8px;height:8px;border-radius:50%;background:#EC4899;box-shadow:0 0 8px #EC4899;flex-shrink:0}
  @keyframes snRise{to{transform:translateY(0)}}
  @keyframes snFade{to{opacity:1}}
  @keyframes snScrollDot{0%{top:-20px;opacity:0}20%{opacity:1}80%{opacity:1}100%{top:46px;opacity:0}}
  @media(max-width:768px){.sn-hero__title{font-size:clamp(44px,10vw,72px)!important}.sn-hero{height:60vh;min-height:300px}.sn-hero__inner{padding:0 16px}}
  @media(max-width:480px){.sn-hero{height:55vh;min-height:260px}}
  @media(max-width:480px){.sn-hero__title{font-size:clamp(34px,9vw,48px)!important}.sn-hero{min-height:400px}.sn-hero__inner{padding:0 12px}.sn-hero__sub{font-size:14px!important}.sn-eyebrow-hero{font-size:10px;padding:6px 14px}}

  .rc-badge{animation:fadeInScale .7s cubic-bezier(.22,1,.36,1) both}
  .rc-h1{animation:slideUp .9s .15s cubic-bezier(.22,1,.36,1) both}
  .rc-sub{animation:slideUp .9s .3s cubic-bezier(.22,1,.36,1) both}
  .rc-cat{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 16px;min-width:82px;border-radius:16px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;transition:background-color .22s cubic-bezier(.22,1,.36,1),border-color .22s cubic-bezier(.22,1,.36,1),transform .22s cubic-bezier(.22,1,.36,1);position:relative}
  .rc-cat:hover{transform:translateY(-3px)}
  .rc-cat-check{position:absolute;top:-7px;right:-7px;width:20px;height:20px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15)}
  .rc-top-bar{transition:height .3s ease}
  .rc-btn{transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s cubic-bezier(.22,1,.36,1)}
  .rc-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.2) !important}
  .rc-scroll{animation:bounce-y 2s infinite}
  @media(max-width:480px){.rc-grid{grid-template-columns:1fr !important}}
`;


function InscribirModal({ modalActividad, modalRef, misUsuarios, inscForm, setInscForm, inscSelf, setInscSelf, inscError, setInscError, submittingInsc, setSubmittingInsc, inscribingRef, handleInscribirse, onClose }: {
  modalActividad: Actividad;
  modalRef: React.RefObject<HTMLDialogElement | null>;
  misUsuarios: { id: number; username: string }[];
  inscForm: { usuarios: { id: number; username: string }[] };
  setInscForm: React.Dispatch<React.SetStateAction<{ usuarios: { id: number; username: string }[] }>>;
  inscSelf: boolean;
  setInscSelf: React.Dispatch<React.SetStateAction<boolean>>;
  inscError: string;
  setInscError: (v: string) => void;
  submittingInsc: boolean;
  setSubmittingInsc: (v: boolean) => void;
  inscribingRef: React.RefObject<boolean>;
  handleInscribirse: (actividadId: number, usuariosLista?: { id: number; username: string }[], includeSelf?: boolean) => Promise<string | null>;
  onClose: () => void;
}) {
  return (
    <dialog ref={modalRef} aria-labelledby="rc-modal-apuntar-titulo"
      style={{ background: "white", borderRadius: 20, padding: 32, width: "100%", maxWidth: 420, border: "none", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", position: "fixed", top: "50%", left: "50%", margin: 0, transform: "translate(-50%, -50%)", maxHeight: "90vh", overflowY: "auto" }}
      onCancel={e => { e.preventDefault(); onClose(); }}>
      <h3 id="rc-modal-apuntar-titulo" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#9333EA", marginBottom: 4 }}>
        Apuntar personas
      </h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748B", marginBottom: 20 }}>
        {modalActividad.nombre}
      </p>

      <div style={{ marginBottom: 16 }}>
        <p style={RC_USERS_LABEL}>
          Personas a tu cargo
        </p>
        {misUsuarios.length === 0
          ? <p style={{ fontSize: 13, color: "#64748B", fontFamily: "'DM Sans', sans-serif" }}>No tienes personas asignadas a tu cargo.</p>
          : <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
              {misUsuarios.map(u => {
                const sel = inscForm.usuarios.some(x => x.id === u.id);
                return (
                  <button key={u.id} type="button"
                    onClick={() => setInscForm(f => sel
                      ? { usuarios: f.usuarios.filter(x => x.id !== u.id) }
                      : { usuarios: [...f.usuarios, u] }
                    )}
                    style={{ ...RC_USER_BTN_BASE, border: `1.5px solid ${sel ? "#EC4899" : "#C8E6E1"}`, background: sel ? "#FDF2F8" : "white", color: sel ? "#9333EA" : "#2D3B35", fontWeight: sel ? 600 : 400 }}>
                    <span>{u.username}</span>
                    {sel && <span style={{ fontSize: 16, color: "#EC4899" }}>&#10003;</span>}
                  </button>
                );
              })}
            </div>
        }
      </div>

      <button type="button"
        onClick={() => setInscSelf(v => !v)}
        style={{ ...RC_USER_BTN_BASE, width: "100%", border: `1.5px solid ${inscSelf ? "#EC4899" : "#C8E6E1"}`, background: inscSelf ? "#FDF2F8" : "white", color: inscSelf ? "#9333EA" : "#2D3B35", fontWeight: inscSelf ? 600 : 400, marginBottom: 16 }}>
        <span>Apuntarme también a mí</span>
        {inscSelf && <span style={{ fontSize: 16, color: "#EC4899" }}>&#10003;</span>}
      </button>

      {inscError && (
        <div style={RC_ERROR_BOX}>
          &#9888; {inscError}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={() => { onClose(); setInscError(""); }}
          style={RC_CANCEL_BTN}>
          Cancelar
        </button>
        <button
          type="button"
          disabled={submittingInsc || (inscForm.usuarios.length === 0 && !inscSelf)}
          onClick={async () => {
            if (inscribingRef.current) return;
            inscribingRef.current = true;
            setSubmittingInsc(true);
            const err = await handleInscribirse(modalActividad.id, inscForm.usuarios, inscSelf);
            inscribingRef.current = false;
            setSubmittingInsc(false);
            if (err) { setInscError(err); } else { onClose(); setInscError(""); }
          }}
          style={{ ...RC_CONFIRM_BTN_BASE, color: "white", background: submittingInsc || (inscForm.usuarios.length === 0 && !inscSelf) ? "#A0C8BF" : "#EC4899", cursor: submittingInsc || (inscForm.usuarios.length === 0 && !inscSelf) ? "not-allowed" : "pointer" }}>
          {submittingInsc ? "Apuntando..." : `Confirmar (${inscForm.usuarios.length + (inscSelf ? 1 : 0)} persona${inscForm.usuarios.length + (inscSelf ? 1 : 0) !== 1 ? "s" : ""})`}
        </button>
      </div>
    </dialog>
  );
}

function CancelarModal({ modalCancelar, cancelModalRef, usuariosCancelar, selCancelar, selCancelarSet, cancelSelf, selfInscrito, submittingCancel, dispatchCancelar, confirmarCancelacion }: {
  modalCancelar: Actividad;
  cancelModalRef: React.RefObject<HTMLDialogElement | null>;
  usuariosCancelar: { id: number; username: string }[];
  selCancelar: number[];
  selCancelarSet: Set<number>;
  cancelSelf: boolean;
  selfInscrito: boolean;
  submittingCancel: boolean;
  dispatchCancelar: React.Dispatch<CancelarAction>;
  confirmarCancelacion: (soloSeleccionados: boolean) => void;
}) {
  return (
    <dialog ref={cancelModalRef} aria-labelledby="rc-modal-cancelar-titulo"
      style={{ background: "white", borderRadius: 20, padding: 32, width: "100%", maxWidth: 420, border: "none", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}
      onCancel={e => { e.preventDefault(); dispatchCancelar({ type: "cerrar" }); }}>
      <h3 id="rc-modal-cancelar-titulo" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#9333EA", marginBottom: 4 }}>
        Cancelar inscripciones
      </h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748B", marginBottom: 20 }}>
        {modalCancelar.nombre}
      </p>

      {usuariosCancelar.length === 0 && !selfInscrito
        ? <p style={{ fontSize: 13, color: "#64748B", fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>Cargando…</p>
        : <>

            {usuariosCancelar.length > 0 && (
              <>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#64748B", fontFamily: "'DM Sans', sans-serif", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Personas a tu cargo
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto", marginBottom: 14 }}>
                  {usuariosCancelar.map(u => {
                    const sel = selCancelarSet.has(u.id);
                    return (
                      <button key={u.id} type="button"
                        onClick={() => dispatchCancelar({ type: "toggle-usuario", id: u.id })}
                        style={{ ...RC_USER_BTN_BASE, border: `1.5px solid ${sel ? "#E74C3C" : "#C8E6E1"}`, background: sel ? "#FFF5F5" : "white", color: sel ? "#C0392B" : "#2D3B35", fontWeight: sel ? 600 : 400 }}>
                        <span>{u.username}</span>
                        {sel && <span style={{ fontSize: 13, color: "#E74C3C" }}>Quitar &#215;</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {selfInscrito && (
              <>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#64748B", fontFamily: "'DM Sans', sans-serif", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Tu propia inscripción
                </p>
                <button type="button"
                  onClick={() => dispatchCancelar({ type: "toggle-self" })}
                  style={{ ...RC_USER_BTN_BASE, width: "100%", border: `1.5px solid ${cancelSelf ? "#E74C3C" : "#C8E6E1"}`, background: cancelSelf ? "#FFF5F5" : "white", color: cancelSelf ? "#C0392B" : "#2D3B35", fontWeight: cancelSelf ? 600 : 400, marginBottom: 14 }}>
                  <span>Desapuntarme a mí</span>
                  {cancelSelf && <span style={{ fontSize: 13, color: "#E74C3C" }}>Quitar &#215;</span>}
                </button>
              </>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

              {(selCancelar.length > 0 || cancelSelf) && (
                <button
                  type="button"
                  disabled={submittingCancel}
                  onClick={() => confirmarCancelacion(true)}
                  style={{ ...RC_CONFIRM_BTN_BASE, background: submittingCancel ? "#F5F0FF" : "#E74C3C", color: submittingCancel ? "#94A3B8" : "white", border: "none", cursor: submittingCancel ? "not-allowed" : "pointer" }}>
                  {submittingCancel ? "Cancelando..." : `Quitar seleccionados (${selCancelar.length + (cancelSelf ? 1 : 0)})`}
                </button>
              )}

              <button
                type="button"
                disabled={submittingCancel}
                onClick={() => confirmarCancelacion(false)}
                style={{ ...RC_CONFIRM_BTN_BASE, background: "transparent", color: "#E74C3C", border: "1.5px solid #FFCDD5", cursor: submittingCancel ? "not-allowed" : "pointer" }}>
                {`Cancelar todo (${usuariosCancelar.length + (selfInscrito ? 1 : 0)})`}
              </button>
              <button type="button" onClick={() => dispatchCancelar({ type: "cerrar" })}
                style={RC_VOLVER_BTN}>
                Volver
              </button>
            </div>
          </>
      }
    </dialog>
  );
}

// Sincroniza inscritos/actividades en tiempo real vía Pusher
function useActividadesRealtime(
  currentUserRef: React.RefObject<{ id: number } | null>,
  setActividades: React.Dispatch<React.SetStateAction<Actividad[]>>,
  setInscrito: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
) {
  const pusherRef = useRef<PusherClient | null>(null);

  useEffect(() => {
    pusherRef.current = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const ch = pusherRef.current.subscribe("actividades");
    ch.bind("cambio-inscritos", (data: { actividad_id: number; inscritos: number }) => {
      setActividades(prev => prev.map(a =>
        a.id === data.actividad_id ? { ...a, inscritos: data.inscritos } : a
      ));
    });
    ch.bind("lista-actualizada", () => {
      actividadesService.getActividades(currentUserRef.current?.id)
        .then(({ actividades: updated, inscritas }) => {
          setActividades(updated);
          const map: Record<number, boolean> = {};
          inscritas.forEach(id => { map[id] = true; });
          setInscrito(map);
        });
    });
    return () => { pusherRef.current?.unsubscribe("actividades"); pusherRef.current?.disconnect(); };
  }, [currentUserRef, setActividades, setInscrito]);
}

// Handlers de inscripción, desinscripción y cancelación de actividades
function useInscripciones({
  currentUser, actividades, setActividades, setInscrito, setLoadingBtn,
  dispatchCancelar, modalCancelar, usuariosCancelar, selCancelar, selCancelarSet, cancelSelf, selfInscrito, setSubmittingCancel,
}: {
  currentUser: { id: number; username: string; email: string; rol: string } | null;
  actividades: Actividad[];
  setActividades: React.Dispatch<React.SetStateAction<Actividad[]>>;
  setInscrito: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  setLoadingBtn: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  dispatchCancelar: React.Dispatch<CancelarAction>;
  modalCancelar: Actividad | null;
  usuariosCancelar: { id: number; username: string }[];
  selCancelar: number[];
  selCancelarSet: Set<number>;
  cancelSelf: boolean;
  selfInscrito: boolean;
  setSubmittingCancel: (v: boolean) => void;
}) {
  const handleInscribirse = async (actividadId: number, usuariosLista?: { id: number; username: string }[], includeSelf?: boolean): Promise<string | null> => {
    if (!currentUser) return null;
    setLoadingBtn(prev => ({ ...prev, [actividadId]: true }));
    try {
      await actividadesService.inscribirse({
        actividad_id:    actividadId,
        usuario_id:      currentUser.id,
        nombre_usuario:  currentUser.username,
        email_usuario:   currentUser.email,
        ...(usuariosLista ? { personas_lista: usuariosLista } : {}),
        ...(includeSelf  ? { include_intermediario: true } : {}),
      });
      setInscrito(prev => ({ ...prev, [actividadId]: true }));
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Error al inscribirse";
    } finally {
      setLoadingBtn(prev => ({ ...prev, [actividadId]: false }));
    }
  };

  const handleDesinscribirse = async (actividadId: number) => {
    if (!currentUser) return;

    if (currentUser.rol === "intermediario") {
      const actividad = actividades.find(a => a.id === actividadId) ?? null;
      dispatchCancelar({ type: "abrir", actividad });
      const { personas, selfInscrito: isSelf } = await actividadesService.getPersonasInscritas(currentUser.id, actividadId);
      dispatchCancelar({ type: "datos-cargados", usuarios: personas, selfInscrito: isSelf });
      return;
    }

    setLoadingBtn(prev => ({ ...prev, [actividadId]: true }));
    try {
      await actividadesService.desinscribirse({ actividad_id: actividadId, usuario_id: currentUser.id });
      setInscrito(prev => ({ ...prev, [actividadId]: false }));
    } catch {

    } finally {
      setLoadingBtn(prev => ({ ...prev, [actividadId]: false }));
    }
  };

  const confirmarCancelacion = async (soloSeleccionados: boolean) => {
    if (!currentUser || !modalCancelar) return;
    setSubmittingCancel(true);
    const body: Record<string, unknown> = { actividad_id: modalCancelar.id, usuario_id: currentUser.id };
    if (soloSeleccionados) {
      body.personas_ids = selCancelar;
      if (cancelSelf) body.cancel_self = true;
    } else {
      body.personas_ids = usuariosCancelar.map(u => u.id);
      if (selfInscrito) body.cancel_self = true;
    }
    try {
      const data = await actividadesService.desinscribirse(body);
      const restantes = soloSeleccionados
        ? usuariosCancelar.filter(u => !selCancelarSet.has(u.id))
        : [];
      const selfRemains = soloSeleccionados ? (selfInscrito && !cancelSelf) : false;
      if (restantes.length === 0 && !selfRemains) {
        setInscrito(prev => ({ ...prev, [modalCancelar.id]: false }));
      }
      if (typeof data.inscritos === "number") {
        setActividades(prev => prev.map(a =>
          a.id === modalCancelar.id ? { ...a, inscritos: data.inscritos } : a
        ));
      }
      dispatchCancelar({ type: "tras-confirmar", usuarios: restantes, selfRemains });
    } catch {

    }
    setSubmittingCancel(false);
  };

  return { handleInscribirse, handleDesinscribirse, confirmarCancelacion };
}

export default function RecursosPage() {
  const { hasPlan, ready } = usePlan();
  const isAdminRef = useRef(false);
  const [catsDB,        setCatsDB]        = useState<CatDB[]>([]);
  const [categorias,    setCategorias]    = useState<string[]>(["Todas"]);
  const [actividades,   setActividades]   = useState<Actividad[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [inscrito,      setInscrito]      = useState<Record<number, boolean>>({});
  const [loadingBtn,    setLoadingBtn]    = useState<Record<number, boolean>>({});
  const [currentUser,   setCurrentUser]   = useState<{ id: number; username: string; email: string; rol: string } | null>(null);
  const [modalActividad, setModalActividad] = useState<Actividad | null>(null);
  const [inscForm,        setInscForm]        = useState<{ usuarios: { id: number; username: string }[] }>({ usuarios: [] });
  const [inscSelf,        setInscSelf]        = useState(false);
  const [misUsuarios,     setMisUsuarios]     = useState<{ id: number; username: string }[]>([]);
  const [submittingInsc,   setSubmittingInsc]   = useState(false);
  const [inscError,        setInscError]        = useState("");
  const [cancelarState, dispatchCancelar] = useReducer(cancelarReducer, CANCELAR_INITIAL);
  const { modal: modalCancelar, usuarios: usuariosCancelar, seleccion: selCancelar, cancelSelf, selfInscrito } = cancelarState;
  const selCancelarSet = new Set(selCancelar);
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const currentUserRef   = useRef(currentUser);
  const modalRef         = useRef<HTMLDialogElement>(null);
  const cancelModalRef   = useRef<HTMLDialogElement>(null);
  const scrollSaveRef    = useRef<number>(0);
  const inscribingRef    = useRef(false);
  const heroBgRef        = useRef<HTMLDivElement>(null);
  const heroContentRef   = useRef<HTMLDivElement>(null);
  const mainRef          = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const load = () => {
      const saved = sessionStorage.getItem("r65_user:v1");
      const user = saved ? JSON.parse(saved) : null;
      setCurrentUser(user);
      isAdminRef.current = user?.rol === "admin";
    };
    load();
    window.addEventListener("relatia-auth-changed", load);
    window.addEventListener("r65:authed", load);
    return () => {
      window.removeEventListener("relatia-auth-changed", load);
      window.removeEventListener("r65:authed", load);
    };
  }, []);

  useEffect(() => {
    actividadesService.getCategoriasActividades()
      .then(cats => setCatsDB(cats))
      .catch(() => {});
  }, []);

  const filterOptions: FilterOption[] = [
    { key: "Todas", label: "Todas", color: "#EC4899" },
    ...catsDB.map(c => ({
      key:   c.nombre,
      label: c.nombre,
      color: c.color,
      icon:  ICON_MAP[c.icono] ?? <Tag size={16} />,
    })),
  ];

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  useActividadesRealtime(currentUserRef, setActividades, setInscrito);



  const toggleCategoria = (key: string) => {
    if (key === "Todas") { setCategorias(["Todas"]); return; }
    setCategorias(prev => {
      const sinTodas = prev.filter(k => k !== "Todas");
      if (prev.includes(key)) {
        const next = sinTodas.filter(k => k !== key);
        return next.length === 0 ? ["Todas"] : next;
      } else {
        return [...sinTodas, key];
      }
    });
  };

  const categoriaSet = new Set(categorias);
  const actividadesFiltradas = categorias.includes("Todas")
    ? actividades
    : [...actividades]
        .filter(a => categoriaSet.has(a.categoria))
        .sort((a, b) => categorias.indexOf(a.categoria) - categorias.indexOf(b.categoria));

  useEffect(() => {
    setLoading(true);
    actividadesService.getActividades(currentUser?.id)
      .then(({ actividades, inscritas }) => {
        setActividades(actividades);
        const map: Record<number, boolean> = {};
        inscritas.forEach(id => { map[id] = true; });
        setInscrito(map);
      })
      .finally(() => setLoading(false));

  }, [currentUser?.id]);

  const { handleInscribirse, handleDesinscribirse, confirmarCancelacion } = useInscripciones({
    currentUser, actividades, setActividades, setInscrito, setLoadingBtn,
    dispatchCancelar, modalCancelar, usuariosCancelar, selCancelar, selCancelarSet, cancelSelf, selfInscrito, setSubmittingCancel,
  });

  useEffect(() => {
    if (modalActividad || modalCancelar) {
      scrollSaveRef.current = window.scrollY;
      document.body.style.overflow = "hidden";
      if (modalActividad) modalRef.current?.showModal();
      else if (modalCancelar) cancelModalRef.current?.showModal();
    } else {
      document.body.style.overflow = "";
      window.scrollTo({ top: scrollSaveRef.current, behavior: "smooth" });
      modalRef.current?.close();
      cancelModalRef.current?.close();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalActividad, modalCancelar]);

  if (ready && !hasPlan) return <PlanGate />;

  return (
    <div className="page-enter" style={{ background: "#FFFFFF" }}>
      <style>{RECURSOS_PAGE_STYLES}</style>

      <MouseGlow />


      <header className="sn-hero" ref={heroRef}>
        <div
          ref={heroBgRef}
          className="sn-hero__bg"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1800&auto=format&fit=crop')" }}
        />
        <div className="sn-hero__overlay" />
        <div className="sn-hero__inner" ref={heroContentRef}>
          <h1 className="sn-hero__title">
            <span className="sn-word"><span>Actividades</span></span>
            <br />
            <span className="sn-word delay gold"><span>Disponibles</span></span>
          </h1>
          <p className="sn-hero__sub">
            Apúntate a actividades, talleres y excursiones para personas mayores en Santander
          </p>
        </div>
        <div className="sn-hero__scroll">
          <div className="sn-hero__bar" />
          <span>SCROLL</span>
        </div>
      </header>

      <div style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 55" fill="none" style={{ width: "100%" }}>
          <path d="M0,28 C360,55 1080,0 1440,28 L1440,55 L0,55 Z" fill="white" />
        </svg>
      </div>

      <main
        ref={mainRef}
        id="actividades"
        style={RC_MAIN_CONTENT}
      >
        <div className="hidden-mobile">
          <BannerPublicitario ubicacion="actividades" lateral={true} />
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingBottom: "100px" }}>
          <FilterBar
            options={filterOptions}
            active={categorias}
            onToggle={toggleCategoria}
            resultWord="actividad"
            resultCount={actividadesFiltradas.length}
            loading={loading}
          />

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 24, height: 24, border: "2px solid #EDE9FE", borderTopColor: "var(--teal)", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ color: "var(--muted)", fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>Cargando actividades…</p>
          </div>
        ) : (
          <div className="rc-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(320px,100%),1fr))", gap: 28 }}>
            {actividadesFiltradas.map((a, i) => {
              const libres = a.plazas_max ? a.plazas_max - Number(a.inscritos) : null;
              const lleno  = libres !== null && libres <= 0;
              return (
                <ActividadCard
                  key={a.id}
                  actividad={a}
                  inscrito={!!inscrito[a.id]}
                  loading={!!loadingBtn[a.id]}
                  catColor={catsDB.find(c => c.nombre === a.categoria)?.color}
                  delay={i * 0.07}
                  onAction={() => {
                    if (loadingBtn[a.id]) return;
                    if (inscrito[a.id]) { handleDesinscribirse(a.id); return; }
                    if (lleno) return;
                    if (currentUser?.rol === "intermediario") {
                      setInscForm({ usuarios: [] });
                      setInscSelf(false);
                      setInscError("");
                      if (misUsuarios.length === 0) {
                        actividadesService.getMisUsuarios(currentUser.id)
                          .then(users => setMisUsuarios(users));
                      }
                      setModalActividad(a);
                    } else {
                      handleInscribirse(a.id);
                    }
                  }}
                />
              );
            })}
          </div>
        )}


        <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <BannerPublicitario ubicacion="actividades" lateral={false} />
        </div>
        </div>

        <div className="hidden-mobile">
          <BannerPublicitario ubicacion="actividades" lateral={true} />
        </div>
      </main>

      <CalendarioActividades actividades={actividades} catsDB={catsDB} />

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 1.5rem 60px" }}>
        <FadeUp>
          <div style={RC_CTA_BOX}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem,3vw,2.4rem)", color: "white", marginBottom: 14, fontWeight: 600 }}>
              ¿No encuentras lo que buscas?
            </h3>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.7, maxWidth: 480, margin: "0 auto 28px", fontFamily: "'DM Sans', sans-serif" }}>
              Contáctanos y te ayudamos a encontrar la actividad más adecuada para tu situación.
            </p>
            {currentUser?.rol === "admin" ? (
              <div style={RC_CTA_DISABLED}>Solo para usuarios</div>
            ) : (
              <Link href="/contacto" style={RC_CTA_LINK}>Contactar ahora</Link>
            )}
          </div>
        </FadeUp>
        <div style={{ marginTop: "2.5rem" }}>
          <Link href="/" style={{ color: "#EC4899", textDecoration: "none", fontWeight: 500, fontSize: 13.5, opacity: 0.75 }}>
            Volver al inicio
          </Link>
        </div>
      </div>

      {modalActividad && (
        <InscribirModal
          modalActividad={modalActividad}
          modalRef={modalRef}
          misUsuarios={misUsuarios}
          inscForm={inscForm}
          setInscForm={setInscForm}
          inscSelf={inscSelf}
          setInscSelf={setInscSelf}
          inscError={inscError}
          setInscError={setInscError}
          submittingInsc={submittingInsc}
          setSubmittingInsc={setSubmittingInsc}
          inscribingRef={inscribingRef}
          handleInscribirse={handleInscribirse}
          onClose={() => setModalActividad(null)}
        />
      )}

      {modalCancelar && (
        <CancelarModal
          modalCancelar={modalCancelar}
          cancelModalRef={cancelModalRef}
          usuariosCancelar={usuariosCancelar}
          selCancelar={selCancelar}
          selCancelarSet={selCancelarSet}
          cancelSelf={cancelSelf}
          selfInscrito={selfInscrito}
          submittingCancel={submittingCancel}
          dispatchCancelar={dispatchCancelar}
          confirmarCancelacion={confirmarCancelacion}
        />
      )}
    </div>
  );
}

