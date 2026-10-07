"use client";

import Image from "next/image";
import { Check, MapPin, Search, UserPlus } from "lucide-react";
import { MiniMap } from "./MiniMap";
import { SolicitudesPanel } from "./SolicitudesPanel";
import { Spinner } from "./Spinner";
import { type Person, type Solicitud, statusColor } from "./helpers";

// Barra lateral de comunidad: mapa, solicitudes y lista de personas (extraído de comunidad.tsx).
const CM_FILTRO_BTN_BASE: React.CSSProperties = { flex: 1, padding: "6px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" };
const CM_UNREAD_PREVIEW: React.CSSProperties = { fontSize: 12, color: "#EC4899", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160, marginBottom: 2 };
const CM_ENVIADA_TAG: React.CSSProperties = { flexShrink: 0, fontSize: 12, color: "#94A3B8", background: "#F5F0FF", borderRadius: 99, padding: "3px 8px", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif" };
const CM_ACEPTAR_TAG: React.CSSProperties = { flexShrink: 0, fontSize: 12, color: "white", background: "var(--teal)", borderRadius: 99, padding: "3px 8px", border: "none", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", fontWeight: 600 };
const CM_CONECTAR_BTN_BASE: React.CSSProperties = { flexShrink: 0, width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(236,72,153,0.28)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--teal)" };

export function ComunidadSidebar({
  showMobileSidebar,
  people,
  filtered,
  range,
  setRange,
  zonaNombre,
  onOpenMaxMap,
  onSelectPerson,
  search,
  setSearch,
  filtroVista,
  setFiltroVista,
  solicitudesRecibidas,
  aceptarSolicitud,
  rechazarSolicitud,
  locError,
  loadingUsers,
  onRetryLocation,
  selected,
  getPersonaEstado,
  enviarSolicitud,
  enviandoSolicitud,
}: {
  showMobileSidebar: boolean;
  people: Person[];
  filtered: Person[];
  range: number;
  setRange: (v: number) => void;
  zonaNombre: string;
  onOpenMaxMap: () => void;
  onSelectPerson: (p: Person) => void;
  search: string;
  setSearch: (v: string) => void;
  filtroVista: "todos" | "amigos";
  setFiltroVista: (v: "todos" | "amigos") => void;
  solicitudesRecibidas: Solicitud[];
  aceptarSolicitud: (s: Solicitud) => void;
  rechazarSolicitud: (s: Solicitud) => void;
  locError: string | null;
  loadingUsers: boolean;
  onRetryLocation: () => void;
  selected: Person | null;
  getPersonaEstado: (p: Person) => "amigo" | "enviada" | "recibida" | "ninguno";
  enviarSolicitud: (p: Person) => void;
  enviandoSolicitud: number | null;
}) {
  return (
    <div className={`chat-sidebar${!showMobileSidebar ? " hide" : ""}`}>

      <div className="chat-sidebar-header">
        <div className="chat-sidebar-title">Comunidad</div>
        <div className="chat-sidebar-sub">
          <span className="online-pulse" />
          {filtered.filter(p => p.status === "online").length} personas cerca en línea
        </div>
      </div>

      <MiniMap people={people} range={range} zonaNombre={zonaNombre} onToggleMax={onOpenMaxMap} onSelect={onSelectPerson} />

      <div className="range-wrap">
        <div className="range-label">Radio de búsqueda <span>{range} km</span></div>
        <input type="range" min={0.2} max={5} step={0.1} value={range} aria-label="Radio de búsqueda en kilómetros"
          onChange={evento => setRange(parseFloat(evento.target.value))} />
      </div>

      <div className="chat-search">
        <span className="chat-search-icon"><Search size={13} /></span>
        <input aria-label="Buscar persona" placeholder="Buscar persona..." value={search} onChange={evento => setSearch(evento.target.value)} />
      </div>

      <div style={{ display: "flex", padding: "10px 20px", gap: 10, borderBottom: "1px solid #EDE9FE" }}>
         <button type="button" onClick={() => setFiltroVista("todos")} style={{ ...CM_FILTRO_BTN_BASE, background: filtroVista === "todos" ? "#FDF2F8" : "transparent", color: filtroVista === "todos" ? "var(--teal)" : "#64748B" }}>Todos</button>
         <button type="button" onClick={() => setFiltroVista("amigos")} style={{ ...CM_FILTRO_BTN_BASE, background: filtroVista === "amigos" ? "#FDF2F8" : "transparent", color: filtroVista === "amigos" ? "var(--teal)" : "#64748B" }}>Mis Amigos</button>
      </div>

      {/* Solicitudes pendientes */}
      <SolicitudesPanel
        solicitudes={solicitudesRecibidas}
        onAceptar={aceptarSolicitud}
        onRechazar={rechazarSolicitud}
      />

      <div className="people-list">
        {locError ? (
          <div className="no-results loc-error">
            <span>{locError}</span>
            <button
              type="button"
              onClick={onRetryLocation}
              className="loc-error-retry">
              Reintentar ubicación
            </button>
          </div>
        ) : loadingUsers ? (
          <Spinner label="Buscando personas cercanas..." />
        ) : filtered.length === 0 ? (
          <div className="no-results">No hay personas en ese radio.<br />Aumenta el rango de búsqueda.</div>
        ) : filtered.map((p) => {
          const estado = getPersonaEstado(p);
          const clickable = estado === "amigo";
          return (
            <div key={p.id}
              className={`person-item ${selected?.id === p.id ? "active" : ""}`}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => onSelectPerson(p) : undefined}
              onKeyDown={clickable ? (e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectPerson(p); } }) : undefined}
              style={{ cursor: clickable ? "pointer" : "default" }}>
              <div className="p-avatar-wrap">
                <Image src={p.photo} alt={p.name} width={44} height={44} className={`p-avatar ${selected?.id === p.id ? "sel" : ""}`} />
                <span className="p-status-dot" style={{ background: statusColor(p.status) }} />
              </div>
              <div className="p-info">
                <div className="p-name">{p.name}</div>
                {p.unread > 0 && p.ultimo_no_leido && (
                  <div style={CM_UNREAD_PREVIEW}>
                    {p.ultimo_no_leido}
                  </div>
                )}
                <div className="p-meta">
                  <span className="p-dist"><MapPin size={9} />{p.distance}</span>
                </div>
              </div>
              {/* Botón según estado */}
              {estado === "amigo" && p.unread > 0 && <span className="p-unread">{p.unread}</span>}
              {estado === "amigo" && p.unread === 0 && (
                <span title="Conectados" style={{ flexShrink: 0, color: "#00C87A" }}><Check size={14} /></span>
              )}
              {estado === "enviada" && (
                <span style={CM_ENVIADA_TAG}>
                  Enviada
                </span>
              )}
              {estado === "recibida" && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); const s = solicitudesRecibidas.find(s => s.from_user === p.id); if (s) aceptarSolicitud(s); }}
                  style={CM_ACEPTAR_TAG}>
                  Aceptar
                </button>
              )}
              {estado === "ninguno" && (
                <button
                  type="button"
                  aria-label="Enviar solicitud"
                  onClick={e => { e.stopPropagation(); enviarSolicitud(p); }}
                  disabled={enviandoSolicitud === p.id}
                  style={{ ...CM_CONECTAR_BTN_BASE, background: enviandoSolicitud === p.id ? "#EDE9FE" : "#FDF2F8", cursor: enviandoSolicitud === p.id ? "not-allowed" : "pointer" }}>
                  {enviandoSolicitud === p.id
                    ? <div style={{ width: 10, height: 10, border: "1.5px solid #EDE9FE", borderTopColor: "var(--teal)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    : <UserPlus size={13} />}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
