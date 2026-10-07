"use client";

import { useState } from "react";
import { RotateCcw, Loader2, CheckCircle } from "lucide-react";

// Devolución de una compra. Para los productos de la tienda es un derecho:
// 14 días desde la entrega para desistir sin dar explicaciones. Para segunda
// mano es una incidencia (no llegó, llegó roto), que no depende del plazo.

const BTN: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
  background: "white", color: "#64748B", border: "1.5px solid #EDE9FE",
  borderRadius: 11, padding: "9px 14px", fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
};

export function SolicitarDevolucion({
  ordenId,
  ventaId,
  diasRestantes,
  onSolicitada,
}: {
  ordenId?: number;
  ventaId?: number;
  // null cuando no aplica plazo (una incidencia se puede abrir siempre).
  diasRestantes?: number | null;
  onSolicitada?: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [hecho, setHecho] = useState(false);

  const fueraDePlazo = typeof diasRestantes === "number" && diasRestantes <= 0;

  const enviar = async () => {
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/devoluciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(ordenId ? { orden_id: ordenId } : { venta_id: ventaId }),
          tipo: ventaId ? "incidencia" : "desistimiento",
          motivo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo enviar la solicitud");
      setHecho(true);
      onSolicitada?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la solicitud");
      setEnviando(false);
    }
  };

  if (hecho) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, background: "#ECFDF5",
        border: "1px solid #A7F3D0", borderRadius: 10, padding: "9px 12px",
        fontSize: 13, color: "#047857",
      }}>
        <CheckCircle size={14} />
        <span>
          Solicitud enviada. Te escribimos por correo en cuanto la revisemos, y también verás la
          respuesta en este mismo pedido.
        </span>
      </div>
    );
  }

  if (fueraDePlazo) return null;

  if (!abierto) {
    return (
      <button type="button" style={BTN} onClick={() => setAbierto(true)}>
        <RotateCcw size={13} />
        {ventaId ? "Tengo un problema con esta compra" : "Solicitar devolución"}
      </button>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 9,
      background: "#FAF8FF", border: "1px solid #EDE9FE", borderRadius: 12, padding: "12px 14px",
    }}>
      <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.55 }}>
        {ventaId
          ? "Cuéntanos qué ha pasado. Revisaremos el caso y te responderemos."
          : <>Puedes devolverlo sin dar explicaciones
              {typeof diasRestantes === "number" && <> — te quedan <strong style={{ color: "#0F172A" }}>{diasRestantes} día{diasRestantes !== 1 ? "s" : ""}</strong></>}.
              Si quieres, dinos el motivo.</>}
      </p>

      <textarea
        value={motivo}
        onChange={e => setMotivo(e.target.value)}
        rows={3}
        placeholder={ventaId ? "El producto llegó roto…" : "Motivo (opcional)"}
        aria-label="Motivo de la devolución"
        style={{
          width: "100%", padding: "9px 11px", border: "1.5px solid #EDE9FE", borderRadius: 10,
          fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#0F172A",
          background: "white", resize: "none", boxSizing: "border-box",
        }}
      />

      {error && <span style={{ fontSize: 12.5, color: "#B91C1C" }}>{error}</span>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" disabled={enviando} onClick={enviar} style={{
          ...BTN, background: "linear-gradient(135deg, #EC4899 0%, #9333EA 100%)",
          color: "white", border: "none", fontWeight: 700, opacity: enviando ? 0.7 : 1,
        }}>
          {enviando ? <Loader2 size={13} className="dv-spin" /> : <RotateCcw size={13} />}
          {enviando ? "Enviando…" : "Enviar solicitud"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} style={BTN}>
          Cancelar
        </button>
      </div>

      <style>{`@keyframes dv-spin { to { transform: rotate(360deg) } } .dv-spin { animation: dv-spin .8s linear infinite }`}</style>
    </div>
  );
}
