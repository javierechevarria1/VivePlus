"use client";

import { type Conversacion, getAvatarColor, getInitials, formatFecha } from "./helpers";

// Barra lateral de conversaciones (extraída de mis-chats.tsx).
export function ConvSidebar({ convs, loading, selUsuario, onSelectConv }: {
  convs: Conversacion[];
  loading: boolean;
  selUsuario: Conversacion | null;
  onSelectConv: (c: Conversacion) => void;
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">Pacientes ({convs.length})</div>

      <div className="conv-list">
        {loading && (
          <div className="loading-shimmer">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="shimmer-item" style={{ animationDelay: `${n * .1}s` }} />
            ))}
          </div>
        )}
        {!loading && convs.length === 0 && (
          <div className="conv-empty">
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            Sin conversaciones aún.<br />Los pacientes te escribirán aquí.
          </div>
        )}
        {convs.map(c => {
          const [bg, fg] = getAvatarColor(c.usuario_id);
          const hasUnread = c.no_leidos > 0;
          return (
            <div
              key={c.usuario_id}
              className={`conv-item ${selUsuario?.usuario_id === c.usuario_id ? "active" : ""}`}
              role="button" tabIndex={0} onClick={() => onSelectConv(c)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectConv(c); } }}
            >
              <div className="conv-avatar" style={{ background: bg, color: fg }}>
                {getInitials(c.username)}
              </div>
              <div className="conv-info">
                <div className="conv-name" style={hasUnread ? { fontWeight: 700 } : {}}>{c.username}</div>
                <div className="conv-last" style={hasUnread ? { color: "var(--ink-mid)", fontWeight: 500 } : {}}>{c.ultimo_mensaje}</div>
              </div>
              <div className="conv-right">
                <div className="conv-date">{formatFecha(c.ultimo_at)}</div>
                {hasUnread && (
                  <div className="unread-badge">{c.no_leidos > 99 ? "99+" : c.no_leidos}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
