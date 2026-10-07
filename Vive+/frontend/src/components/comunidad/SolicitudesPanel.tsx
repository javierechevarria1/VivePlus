"use client";

import { Check, User, UserPlus, X } from "lucide-react";
import { type Solicitud } from "./helpers";

// Panel de solicitudes de amistad (extraído de comunidad.tsx).
const CM_SOL_HDR: React.CSSProperties = { padding: "8px 12px", background: "rgba(236,72,153,0.10)", fontSize: 12, fontWeight: 700, color: "#EC4899", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 };
const CM_SOL_AVATAR: React.CSSProperties = { width: 32, height: 32, borderRadius: "50%", background: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const CM_ACEPTAR_BTN: React.CSSProperties = { width: 28, height: 28, borderRadius: 8, background: "#EC4899", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const CM_RECHAZAR_BTN: React.CSSProperties = { width: 28, height: 28, borderRadius: 8, background: "#EDE9FE", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };

export function SolicitudesPanel({ solicitudes, onAceptar, onRechazar }: {
  solicitudes: Solicitud[];
  onAceptar: (s: Solicitud) => void;
  onRechazar: (s: Solicitud) => void;
}) {
  if (solicitudes.length === 0) return null;
  return (
    <div style={{ margin: "10px 12px", background: "#FDF2F8", borderRadius: 12, border: "1px solid rgba(236,72,153,0.20)", overflow: "hidden" }}>
      <div style={CM_SOL_HDR}>
        <UserPlus size={11} /> {solicitudes.length} solicitud{solicitudes.length > 1 ? "es" : ""} pendiente{solicitudes.length > 1 ? "s" : ""}
      </div>
      {solicitudes.map(s => (
        <div key={s.id} style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid rgba(236,72,153,0.10)" }}>
          <div style={CM_SOL_AVATAR}>
            <User size={14} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>{s.username}</p>
            <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>quiere conectar contigo</p>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button type="button" aria-label="Aceptar solicitud" onClick={() => onAceptar(s)}
              style={CM_ACEPTAR_BTN}>
              <Check size={13} color="white" />
            </button>
            <button type="button" aria-label="Rechazar solicitud" onClick={() => onRechazar(s)}
              style={CM_RECHAZAR_BTN}>
              <X size={13} color="#64748B" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
