"use client";

import { MapPin, Maximize, Minimize } from "lucide-react";
import { type Person, statusColor } from "./helpers";

// Mini-mapa de personas cercanas (extraído de comunidad.tsx).
export function MiniMap({ people, range, zonaNombre, onSelect, isMax, onToggleMax,}: {
  people: Person[]; range: number; zonaNombre: string; onSelect: (p: Person) => void;
  isMax?: boolean; onToggleMax?: () => void; center?: { lat: number; lng: number };
}) {
  return (
    <div className="map-section" style={isMax ? { margin: 0, border: "none", height: "100%", borderRadius: 0, display: "flex", flexDirection: "column" } : {}}>
      <div className="map-title" style={{ display: "flex", justifyContent: "space-between" }}>
        <span
          role={onToggleMax ? "button" : undefined}
          tabIndex={onToggleMax ? 0 : undefined}
          style={{ display: "flex", alignItems: "center", gap: 6, cursor: onToggleMax ? "pointer" : "default" }}
          onClick={onToggleMax}
          onKeyDown={e => { if (onToggleMax && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onToggleMax(); } }}
        >
          <MapPin size={11} /> {zonaNombre}
        </span>
        {onToggleMax && (
          <button type="button" aria-label={isMax ? "Minimizar mapa" : "Maximizar mapa"} onClick={onToggleMax} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
            {isMax ? <Minimize size={14} color="#64748B" /> : <Maximize size={14} color="#64748B" />}
          </button>
        )}
      </div>
      <div className="map-body" style={isMax ? { height: "100%", flex: 1 } : {}}>
        <div className="map-grid-bg" />
        <div className="map-radar" style={{ width: "50%",  height: "50%",  marginLeft: "-25%", marginTop: "-25%" }} />
        <div className="map-radar" style={{ width: "90%",  height: "90%",  marginLeft: "-45%", marginTop: "-45%", opacity: 0.4 }} />
        <div className="map-me" />
        {people.slice(0, 5).map(p => {
          const angle = ((p.id * 137.5) % 360) * (Math.PI / 180);
          const r  = Math.min((p.distancia_km / range) * 42, 42);
          const cx = 50 + Math.cos(angle) * r;
          const cy = 50 + Math.sin(angle) * r;
          return (
            <div key={p.id} className="map-person" role="button" aria-label={p.name} tabIndex={0} style={{ left: `${cx}%`, top: `${cy}%` }} onClick={() => onSelect(p)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(p); } }}>
              <div className="map-person-dot" style={{ background: statusColor(p.status), cursor: "pointer" }} title={p.name} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
