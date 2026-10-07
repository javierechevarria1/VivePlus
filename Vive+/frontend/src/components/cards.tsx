"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MapPin, Calendar, Users, ArrowRight, CheckCircle, ExternalLink,
  Shield, Heart, Building2, Clock, MessageCircle, X, Star,
} from "lucide-react";
import { FadeUp } from "@/frontend/src/components/fade-up";

export { FilterBar, type FilterOption } from "@/frontend/src/components/filter-bar";

/* ═══════════════════════════════════════════════════════════
   TIPOS
═══════════════════════════════════════════════════════════ */

export type Actividad = {
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

export type Servicio = { nombre: string; descripcion: string };

export type Org = {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  web: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  estado: string | null;
  logo_url: string | null;
  servicios: Servicio[];
};

export type Cuidador = {
  id: number;
  cuidador_usuario_id: number;
  name: string;
  specialty: string;
  tag: string;
  hours: string;
  rating: number;
  reviews: number;
  tipo: string;
  photo: string;
  color: string;
  verificado: boolean;
};

/* ═══════════════════════════════════════════════════════════
   ICONO POR TIPO DE ORGANIZACIÓN (fallback para tipos predefinidos)
═══════════════════════════════════════════════════════════ */

const ORG_ICON: Record<string, React.ReactNode> = {
  ong:       <Heart     size={12} />,
  fundacion: <Shield    size={12} />,
  empresa:   <Building2 size={12} />,
};

/* ═══════════════════════════════════════════════════════════
   STYLE CONSTS — ActividadCard
═══════════════════════════════════════════════════════════ */

const AC_CARD_BASE: React.CSSProperties = { background: "white", borderRadius: 20, overflow: "hidden", transition: "border-color 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)", display: "flex", flexDirection: "column", flex: 1, position: "relative" };
const AC_MAP_LINK_BASE: React.CSSProperties = { display: "flex", alignItems: "center", gap: 7, padding: "6px 10px", borderRadius: 8, background: "var(--cream)", textDecoration: "none" };
const AC_URL_LINK_BASE: React.CSSProperties = { width: "100%", padding: "9px 14px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease" };
const AC_REG_BTN_BASE: React.CSSProperties = { width: "100%", padding: "11px", borderRadius: 12, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease" };
const AC_DATE_BADGE_BASE: React.CSSProperties = { position: "absolute", top: 8, left: 8, background: "rgba(255,252,246,0.95)", padding: "3px 9px", borderRadius: 7, fontSize: "0.72rem", fontWeight: 700, backdropFilter: "blur(4px)" };
const AC_PLAZAS_BADGE_BASE: React.CSSProperties = { position: "absolute", top: 8, right: 8, color: "#fff", padding: "3px 9px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700 };
const AC_TITLE_BASE: React.CSSProperties = { fontSize: 15, color: "var(--slate)", marginBottom: 6, lineHeight: 1.35, fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" };
const AC_DESC_BASE: React.CSSProperties = { fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginBottom: 8, fontFamily: "'DM Sans', sans-serif", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" };
const AC_LUGAR_LINK_BASE: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "4px 7px", borderRadius: 7, background: "var(--cream)", textDecoration: "none", overflow: "hidden" };

/* ═══════════════════════════════════════════════════════════
   STYLE CONSTS — OrganizacionCard
═══════════════════════════════════════════════════════════ */

const OC_CARD_BASE: React.CSSProperties = { background: "white", borderRadius: 22, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column", transition: "border-color 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)", position: "relative" };
const OC_LOGO_BOX_BASE: React.CSSProperties = { width: 54, height: 54, borderRadius: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", position: "relative" };
const OC_TYPE_TAG_BASE: React.CSSProperties = { fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'DM Sans', sans-serif" };
const OC_CONTACT_BOX: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16, padding: "12px 14px", background: "var(--cream)", borderRadius: 12, border: "1px solid var(--sand)" };
const OC_VISIT_BTN_BASE: React.CSSProperties = { width: "100%", padding: "12px", color: "white", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };
const OC_LOCATION_BADGE_BASE: React.CSSProperties = { position: "absolute", bottom: 12, right: 14, fontSize: 12, color: "rgba(255,255,255,0.9)", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, background: "rgba(0,0,0,0.28)", backdropFilter: "blur(4px)", padding: "3px 8px", borderRadius: 99 };
const OC_CONTACT_INFO_BASE: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16, padding: "12px 14px", background: "#FAF8FF", borderRadius: 12, border: "1px solid #EDE9FE" };

/* ═══════════════════════════════════════════════════════════
   STYLE CONSTS — CuidadorCard
═══════════════════════════════════════════════════════════ */

const CU_AVAIL_DOT: React.CSSProperties = { position: "absolute", bottom: 3, right: 3, width: 13, height: 13, borderRadius: "50%", background: "#4CAF50", border: "2px solid white" };
const CU_TAG_BASE: React.CSSProperties = { fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, fontFamily: "'DM Sans', sans-serif", display: "inline-block" };
const CU_CHAT_BTN_BASE: React.CSSProperties = { position: "relative", width: "100%", marginTop: 14, marginBottom: 18, padding: "12px", borderRadius: 14, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };
const CU_UNREAD_BADGE: React.CSSProperties = { position: "absolute", top: -8, right: -8, background: "#E74C3C", color: "white", borderRadius: 99, fontSize: 12, fontWeight: 700, minWidth: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", border: "2.5px solid white", boxShadow: "0 2px 6px rgba(231,76,60,0.4)" };
const CU_LOGIN_BTN: React.CSSProperties = { width: "100%", marginTop: 14, padding: "12px", borderRadius: 14, background: "#EDE9FE", color: "var(--muted)", border: "1.5px dashed #C4B5FD", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };
const CU_VALORAR_BTN_BASE: React.CSSProperties = { width: "100%", marginTop: 8, marginBottom: 18, padding: "10px", borderRadius: 14, background: "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background-color 0.2s, color 0.2s, border-color 0.2s, transform 0.2s" };
const CU_VERIFIED_BADGE_BASE: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, fontFamily: "'DM Sans', sans-serif", border: "1px solid #A5D6A7" };

/* ═══════════════════════════════════════════════════════════
   CARD — ACTIVIDAD (página Recursos)
═══════════════════════════════════════════════════════════ */

interface ActividadCardProps {
  actividad: Actividad;
  inscrito: boolean;
  loading: boolean;
  onAction: () => void;
  catColor?: string;
  delay?: number;
}

const formatFecha = (f: string) =>
  new Date(f).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

const formatFechaCorta = (f: string) =>
  new Date(f).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Madrid" });

const CATEGORY_IMAGES: Record<string, string> = {
  "Salud":        "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=600&h=375&fit=crop",
  "Deporte":      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=375&fit=crop",
  "Cultura":      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=375&fit=crop",
  "Tecnología":   "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=375&fit=crop",
  "Social":       "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=375&fit=crop",
  "Naturaleza":   "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=375&fit=crop",
  "Cocina":       "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=375&fit=crop",
  "Arte":         "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=375&fit=crop",
  "Ocio":         "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=375&fit=crop",
  "Excursión":    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=375&fit=crop",
  "Música":       "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&h=375&fit=crop",
};
const FALLBACK_IMG = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=375&fit=crop";

export function ActividadCard({ actividad: a, inscrito, loading, onAction, catColor = "#EC4899", delay = 0 }: ActividadCardProps) {
  const [hovered, setHovered] = useState(false);

  const color  = catColor;
  const libres = a.plazas_max ? a.plazas_max - Number(a.inscritos) : null;
  const lleno  = libres !== null && libres <= 0;

  return (
    <FadeUp delay={delay}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div className="rc-card" style={{ ...AC_CARD_BASE, border: `1px solid ${hovered ? color + "40" : "var(--sand)"}`, boxShadow: hovered ? "0 28px 56px rgba(0,0,0,0.1)" : "0 4px 16px rgba(0,0,0,0.05)", transform: hovered ? "translateY(-8px)" : "none", zIndex: hovered ? 10 : 1 }}>

          {/* Imagen compacta 16/7 */}
          <div style={{ position: "relative", aspectRatio: "16/7", overflow: "hidden", flexShrink: 0 }}>
            <Image
              fill sizes="400px"
              src={a.imagen || CATEGORY_IMAGES[a.categoria] || FALLBACK_IMG}
              alt={a.nombre}
              style={{ objectFit: "cover", transition: "transform 0.5s ease", transform: hovered ? "scale(1.06)" : "scale(1)" }}
            />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${color}60 100%)` }} />
            <div style={{ ...AC_DATE_BADGE_BASE, color }}>
              {formatFechaCorta(a.fecha)}
            </div>
            {libres !== null && (
              <div style={{ ...AC_PLAZAS_BADGE_BASE, background: lleno ? "rgba(231,76,60,0.88)" : color }}>
                {lleno ? "Completo" : `${libres} plazas`}
              </div>
            )}
          </div>

          {/* Cuerpo compacto */}
          <div style={{ padding: "11px 14px 13px", flex: 1, display: "flex", flexDirection: "column" }}>

            <div style={{ marginBottom: 6 }}>
              <span style={{ background: `${color}15`, color, fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 99, fontFamily: "'DM Sans', sans-serif" }}>{a.categoria}</span>
            </div>

            <h4 style={AC_TITLE_BASE}>{a.nombre}</h4>

            {a.descripcion && (
              <p style={AC_DESC_BASE}>
                {a.descripcion}
              </p>
            )}

            {/* Meta en grid 2 columnas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 6px", marginBottom: 10 }}>
              <a
                href={a.url_lugar || `https://maps.google.com/maps?q=${encodeURIComponent(a.lugar)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ ...AC_LUGAR_LINK_BASE, border: `1px solid ${color}25` }}
              >
                <MapPin size={10} color={color} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.lugar}</span>
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 7px", borderRadius: 7, background: "var(--cream)", border: "1px solid var(--sand)" }}>
                <Calendar size={10} color={color} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{formatFecha(a.fecha)}</span>
              </div>
              {a.plazas_max > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 7px", borderRadius: 7, background: "var(--cream)", border: "1px solid var(--sand)" }}>
                  <Users size={10} color={color} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}>{Number(a.inscritos)}/{a.plazas_max}</span>
                </div>
              )}
              {a.duracion_min != null && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 7px", borderRadius: 7, background: "var(--cream)", border: "1px solid var(--sand)" }}>
                  <Clock size={10} color={color} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}>
                    {a.duracion_min >= 60 ? `${Math.floor(a.duracion_min / 60)}h${a.duracion_min % 60 > 0 ? `${a.duracion_min % 60}m` : ""}` : `${a.duracion_min}m`}
                  </span>
                </div>
              )}
            </div>

            {/* Botones en fila */}
            <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
              {a.url && (
                <a href={a.url} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, ...AC_URL_LINK_BASE, border: `1.5px solid ${color}40`, background: `${color}08`, color, padding: "8px 10px" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}18`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}08`; }}>
                  <ExternalLink size={12} /> Info
                </a>
              )}
              <button type="button" className="rc-btn" onClick={onAction} disabled={(lleno && !inscrito) || loading}
                style={{ ...AC_REG_BTN_BASE, flex: a.url ? 2 : 1, padding: "8px 10px", background: loading ? `${color}80` : inscrito ? "#EDE9FE" : lleno ? "#EDE9FE" : color, color: inscrito ? "#E74C3C" : lleno ? "var(--muted)" : "white", border: inscrito ? "1.5px solid #FFCDD5" : "none", cursor: (lleno && !inscrito) || loading ? "not-allowed" : "pointer", boxShadow: inscrito || lleno ? "none" : `0 4px 14px ${color}35` }}>
                {loading
                  ? <><div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />{inscrito ? "Cancelando…" : "Apuntando…"}</>
                  : inscrito ? <><CheckCircle size={13} /> Cancelar</>
                  : lleno ? "Sin plazas"
                  : <><ArrowRight size={12} /> Inscribirse</>}
              </button>
            </div>

          </div>
        </div>
      </div>
    </FadeUp>
  );
}

/* ═══════════════════════════════════════════════════════════
   CARD — ORGANIZACIÓN (página Organizaciones)
═══════════════════════════════════════════════════════════ */

interface OrganizacionCardProps {
  org: Org;
  typeColor?: string;
  typeLabel?: string;
  delay?: number;
}

export function OrganizacionCard({ org, typeColor = "#EC4899", typeLabel, delay = 0 }: OrganizacionCardProps) {
  const [hovered, setHovered] = useState(false);

  const color    = typeColor;
  const orgLabel = typeLabel ?? org.tipo;
  const orgIcon  = ORG_ICON[org.tipo] ?? <Users size={12} />;

  return (
    <FadeUp delay={delay}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div className="org-card" style={{
          background: "white", borderRadius: 22, overflow: "hidden",
          height: "100%", display: "flex", flexDirection: "column",
          border: `1px solid ${hovered ? color + "40" : "#EDE9FE"}`,
          boxShadow: hovered ? "0 30px 56px -28px rgba(147,51,234,.35)" : "0 18px 40px -24px rgba(147,51,234,.22)",
          transform: hovered ? "translateY(-4px)" : "none",
          transition: "border-color 0.25s, box-shadow 0.25s, transform 0.2s",
        }}>

          {/* Cabecera — logo ocupa todo el área */}
          <div style={{
            position: "relative", height: 160, overflow: "hidden",
            background: org.logo_url ? "transparent" : `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
            borderBottom: `1px solid ${color}15`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {org.logo_url ? (
              <Image
                fill sizes="400px"
                src={org.logo_url}
                alt={org.nombre}
                style={{
                  objectFit: "contain",
                  padding: "16px",
                  transform: hovered ? "scale(1.04)" : "scale(1)",
                  transition: "transform 0.5s cubic-bezier(.22,.68,0,1.1)",
                }}
              />
            ) : (
              <div style={{ color, opacity: 0.4 }}>{orgIcon}</div>
            )}
            {/* Overlay degradado inferior para legibilidad del badge */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45) 100%)" }} />
            {/* Badge de tipo encima del overlay */}
            <span style={{
              position: "absolute", bottom: 12, left: 14,
              ...OC_TYPE_TAG_BASE, background: "rgba(255,255,255,0.92)", color,
              backdropFilter: "blur(6px)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}>
              {orgIcon}{orgLabel}
            </span>
            {(org.ciudad || org.estado) && (
              <span style={OC_LOCATION_BADGE_BASE}>
                {[org.ciudad, org.estado].filter(Boolean).join(", ")}
              </span>
            )}
          </div>

          {/* Nombre */}
          <div style={{ padding: "16px 20px 0" }}>
            <h3 style={{ fontSize: 19, color: "#0F172A", margin: 0, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}>{org.nombre}</h3>
          </div>

          <div style={{ padding: "20px 24px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.75, marginBottom: 16, flex: 1, fontFamily: "'DM Sans', sans-serif" }}>{org.descripcion}</p>

            {(org.telefono || org.email || org.direccion) && (
              <div style={OC_CONTACT_INFO_BASE}>
                {org.telefono && <span style={{ fontSize: 12, color: "#475569", fontFamily: "'DM Sans', sans-serif" }}>📞 {org.telefono}</span>}
                {org.email    && <span style={{ fontSize: 12, color: "#475569", fontFamily: "'DM Sans', sans-serif" }}>✉️ {org.email}</span>}
                {org.direccion && <span style={{ fontSize: 12, color: "#475569", fontFamily: "'DM Sans', sans-serif" }}>📍 {org.direccion}</span>}
              </div>
            )}

            {org.servicios?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>Servicios</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {org.servicios.map(s => (
                    <div key={s.nombre} style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 10, padding: "8px 12px" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{s.nombre}</p>
                      {s.descripcion && <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{s.descripcion}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="button" className="org-visit-btn" onClick={() => org.web && window.open(org.web, "_blank", "noopener,noreferrer")}
              style={{ ...OC_VISIT_BTN_BASE, background: color, cursor: org.web ? "pointer" : "default", boxShadow: `0 8px 24px ${color}35`, opacity: org.web ? 1 : 0.6, fontWeight: 700 }}>
              <ExternalLink size={14} /> {org.web ? "Visitar web" : "Sin web disponible"}
            </button>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}

/* ═══════════════════════════════════════════════════════════
   CARD — CUIDADOR (página Salud)
═══════════════════════════════════════════════════════════ */

interface CuidadorCardProps {
  cuidador: Cuidador;
  isLoggedIn: boolean;
  chatOpen: boolean;
  onChatToggle: () => void;
  onValoracion?: () => void;
  delay?: number;
  unreadCount?: number;
}

export function CuidadorCard({ cuidador: c, isLoggedIn, chatOpen, onChatToggle, onValoracion, delay = 0, unreadCount = 0 }: CuidadorCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <FadeUp delay={delay}>
      <div className="cu-card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ background: "white", borderRadius: 22, overflow: "hidden", border: `1px solid ${hovered ? c.color + "40" : "var(--sand)"}`, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", transition: "border-color 0.3s ease" }}>

        <div style={{ height: 6, background: `linear-gradient(90deg, ${c.color}, ${c.color}80)`, transform: hovered ? "scaleY(1)" : "scaleY(0.67)", transformOrigin: "top", transition: "transform 0.3s ease" }} />

        <div style={{ padding: "22px 22px 0" }}>

          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Image src={c.photo} alt={c.name} width={76} height={76} className="cu-photo"
                style={{ borderRadius: "50%", objectFit: "cover", border: `3px solid ${c.color}30`, display: "block", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
              <div className="avail-dot" style={CU_AVAIL_DOT} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h3 style={{ fontSize: 19, color: "var(--slate)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, margin: 0 }}>{c.name}</h3>
                <span className="cu-tag" style={{ ...CU_TAG_BASE, background: `${c.color}15`, color: c.color }}>{c.tag}</span>
              </div>
              {c.verificado && (
                <div style={{ marginBottom: 6 }}>
                  <span style={CU_VERIFIED_BADGE_BASE}>
                    <Shield size={11} /> Verificado
                  </span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {[...Array(5)].map((_, si) => (
                  <span key={si} className="cu-star" style={{ color: si < Math.floor(c.rating) ? "#F5A623" : "#E8E0D6", fontSize: 13 }}>★</span>
                ))}
                <span style={{ fontWeight: 700, fontSize: 13, color: "var(--slate)", marginLeft: 4, fontFamily: "'DM Sans', sans-serif" }}>{c.rating}</span>
                <span style={{ color: "var(--muted)", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>({c.reviews})</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: "13px 15px", background: "var(--cream)", borderRadius: 12, border: "1px solid var(--sand)" }}>
            <p style={{ fontSize: 14, color: "var(--slate)", marginBottom: 7, fontFamily: "'DM Sans', sans-serif" }}>
              <strong style={{ color: c.color }}>Especialidad: </strong>{c.specialty}
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
              <Clock size={13} color={c.color} /> {c.hours}
            </p>
          </div>

          {isLoggedIn ? (
            <button type="button" onClick={onChatToggle} className="cu-chat-btn"
              style={{ ...CU_CHAT_BTN_BASE, background: chatOpen ? "var(--sand)" : c.color, color: chatOpen ? "var(--slate)" : "white", boxShadow: chatOpen ? "none" : `0 6px 20px ${c.color}40` }}>
              {chatOpen ? <><X size={15} /> Cerrar chat</> : <><MessageCircle size={15} /> Chatear con {c.name.split(" ")[0]}</>}
              {!chatOpen && unreadCount > 0 && (
                <span style={CU_UNREAD_BADGE}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          ) : (
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("r65:open-auth"))}
              className="cu-chat-btn"
              style={CU_LOGIN_BTN}>
              🔒 Inicia sesión para chatear
            </button>
          )}

          <button
            type="button"
            onClick={onValoracion}
            style={{ ...CU_VALORAR_BTN_BASE, color: c.color, border: `1.5px solid ${c.color}50` }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${c.color}12`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Star size={14} /> Valorar a {c.name.split(" ")[0]}
          </button>

        </div>
      </div>
    </FadeUp>
  );
}
