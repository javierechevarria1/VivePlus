"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Truck, PackageCheck, Clock, Loader2, ShieldCheck, MapPin } from "lucide-react";

export type VentaSegundaMano = {
  id: number;
  producto_id: number;
  estado: string;
  transportista: string | null;
  seguimiento: string | null;
  importe_producto: string;
  importe_envio: string;
  importe_gestion: string;
  importe_total: string;
  limite_envio: string | null;
  limite_confirmacion: string | null;
  enviado_en: string | null;
  liberado_en: string | null;
  creado_en: string;
  direccion_envio?: string | null;
  // Presente cuando la plataforma compró el transporte: el vendedor solo
  // imprime y deja el paquete. Si falta, va por el camino manual.
  etiqueta_url: string | null;
  seguimiento_url: string | null;
  estado_envio: string | null;
  nombre: string;
  imagen: string | string[] | null;
  comprador_nombre: string | null;
  vendedor_nombre: string | null;
};

const CARD: React.CSSProperties = {
  background: "white", borderRadius: 16, border: "1.5px solid #EDE9FE",
  padding: "16px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  display: "flex", flexDirection: "column", gap: 12,
};

const BTN_PRIMARIO: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
  background: "linear-gradient(135deg, #EC4899 0%, #9333EA 100%)",
  color: "white", border: "none", borderRadius: 11, padding: "10px 16px",
  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
};

const INPUT: React.CSSProperties = {
  flex: "1 1 10rem", minWidth: 0, padding: "9px 12px",
  border: "1.5px solid #EDE9FE", borderRadius: 10, fontSize: 13,
  fontFamily: "'DM Sans', sans-serif", color: "#0F172A", background: "white",
  boxSizing: "border-box",
};

const AVISO: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: 8,
  background: "#FFF8E8", border: "1px solid #F5D78E", borderRadius: 10,
  padding: "9px 12px", fontSize: 12.5, color: "#7A5C00", lineHeight: 1.5,
};

// El mismo estado se lee distinto según de qué lado estés: para el vendedor
// "pagado" significa que le toca mover el paquete; para el comprador, esperar.
const ESTADOS: Record<string, { vendedor: string; comprador: string; bg: string; color: string }> = {
  pagado:      { vendedor: "Pendiente de envío", comprador: "Preparando el envío", bg: "#FEF3C7", color: "#B45309" },
  enviado:     { vendedor: "En camino",          comprador: "En camino",           bg: "#E0F2FE", color: "#0369A1" },
  entregado:   { vendedor: "Entregado",          comprador: "Entregado",           bg: "#ECFDF5", color: "#047857" },
  liberado:    { vendedor: "Cobrada",            comprador: "Completada",          bg: "#ECFDF5", color: "#047857" },
  reembolsado: { vendedor: "Reembolsada",        comprador: "Reembolsada",         bg: "#FEF2F2", color: "#B91C1C" },
};

const SPINNER_CSS = `@keyframes vsm-spin { to { transform: rotate(360deg) } } .vsm-spin { animation: vsm-spin .8s linear infinite }`;

function EstadoChip({ estado, rol }: { estado: string; rol: "vendedor" | "comprador" }) {
  const e = ESTADOS[estado] ?? { vendedor: estado, comprador: estado, bg: "#F1F5F9", color: "#475569" };
  return (
    <span style={{
      background: e.bg, color: e.color, borderRadius: 99, padding: "3px 11px",
      fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {rol === "vendedor" ? e.vendedor : e.comprador}
    </span>
  );
}

function fecha(valor: string | null) {
  if (!valor) return null;
  return new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

function primeraImagen(imagen: string | string[] | null): string {
  if (Array.isArray(imagen)) return imagen[0] || "/img/placeholder.png";
  if (typeof imagen === "string" && imagen.startsWith("[")) {
    try {
      const lista = JSON.parse(imagen);
      if (Array.isArray(lista) && lista[0]) return lista[0];
    } catch {
      return imagen;
    }
  }
  return imagen || "/img/placeholder.png";
}

function Cabecera({ venta, rol }: { venta: VentaSegundaMano; rol: "vendedor" | "comprador" }) {
  const importe = rol === "vendedor" ? venta.importe_producto : venta.importe_total;
  return (
    <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
      <div style={{
        width: 62, height: 62, flexShrink: 0, borderRadius: 12,
        background: "#F5F2EB", overflow: "hidden", position: "relative",
      }}>
        <Image fill sizes="62px" src={primeraImagen(venta.imagen)} alt={venta.nombre}
               style={{ objectFit: "contain", padding: 5 }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap", marginBottom: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{venta.nombre}</span>
          <EstadoChip estado={venta.estado} rol={rol} />
        </div>
        <div style={{ fontSize: 13, color: "#64748B" }}>
          {rol === "vendedor"
            ? <>Recibirás <strong style={{ color: "#0F172A" }}>{Number(importe).toFixed(2)} €</strong>
                {venta.comprador_nombre ? ` · Comprador: ${venta.comprador_nombre}` : ""}</>
            : <>Pagaste <strong style={{ color: "#0F172A" }}>{Number(importe).toFixed(2)} €</strong>
                {venta.vendedor_nombre ? ` · Vendedor: ${venta.vendedor_nombre}` : ""}</>}
        </div>
      </div>
    </div>
  );
}

function Seguimiento({ venta }: { venta: VentaSegundaMano }) {
  if (!venta.seguimiento) return null;

  const numero = (
    <strong style={{ color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{venta.seguimiento}</strong>
  );

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC",
      border: "1px solid #E2E8F0", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#475569",
      flexWrap: "wrap",
    }}>
      <Truck size={14} color="#0369A1" />
      <span>
        {venta.transportista} ·{" "}
        {venta.seguimiento_url
          ? <a href={venta.seguimiento_url} target="_blank" rel="noopener noreferrer" style={{ color: "#0369A1" }}>{numero}</a>
          : numero}
      </span>
      {/* Lo que dice el transportista, que es más concreto que el estado
          interno de la venta ("en reparto", "en oficina de origen"...). */}
      {venta.estado_envio && (
        <span style={{ fontSize: 12, color: "#64748B" }}>· {venta.estado_envio}</span>
      )}
    </div>
  );
}

// ---------- Vendedor ----------

function FormularioEnvio({ venta, onHecho }: { venta: VentaSegundaMano; onHecho: () => void }) {
  const [transportista, setTransportista] = useState("");
  const [seguimiento, setSeguimiento] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const marcarEnviado = async () => {
    if (!transportista.trim() || !seguimiento.trim()) {
      setError("Indica el transportista y el número de seguimiento.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/ventas-segunda-mano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venta_id: venta.id, accion: "enviado", transportista, seguimiento }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar el envío");
      onHecho();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el envío");
      setEnviando(false);
    }
  };

  const limite = fecha(venta.limite_envio);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {venta.direccion_envio && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8, background: "#FAF8FF",
          border: "1px solid #EDE9FE", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#475569",
        }}>
          <MapPin size={14} color="#9333EA" style={{ flexShrink: 0, marginTop: 2 }} />
          <span><strong style={{ color: "#0F172A" }}>Enviar a:</strong> {venta.direccion_envio}</span>
        </div>
      )}

      <div style={AVISO}>
        <Clock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Envía el paquete{limite ? <> antes del <strong>{limite}</strong></> : ""} y anota aquí el
          seguimiento. Cobrarás cuando el comprador confirme que lo ha recibido.
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          style={INPUT}
          value={transportista}
          onChange={e => setTransportista(e.target.value)}
          placeholder="Transportista (Correos, SEUR…)"
          aria-label="Transportista"
        />
        <input
          style={INPUT}
          value={seguimiento}
          onChange={e => setSeguimiento(e.target.value)}
          placeholder="Nº de seguimiento"
          aria-label="Número de seguimiento"
        />
      </div>

      {error && <span style={{ fontSize: 12.5, color: "#B91C1C" }}>{error}</span>}

      <button type="button" style={{ ...BTN_PRIMARIO, opacity: enviando ? 0.7 : 1 }}
              onClick={marcarEnviado} disabled={enviando}>
        {enviando ? <Loader2 size={14} className="vsm-spin" /> : <Truck size={14} />}
        {enviando ? "Guardando…" : "Marcar como enviado"}
      </button>
    </div>
  );
}

// Cuando la plataforma ya compró el transporte, el vendedor no tiene que
// pagar ni anotar nada: solo imprimir, pegar y dejar el paquete.
function EtiquetaPrepagada({ venta, onHecho }: { venta: VentaSegundaMano; onHecho: () => void }) {
  const limite = fecha(venta.limite_envio);
  const [marcando, setMarcando] = useState(false);
  const [error, setError] = useState("");

  // Respaldo imprescindible: el aviso del transportista puede tardar, fallar o
  // no estar configurado. Sin esto el vendedor se queda sin forma de avanzar
  // la venta y el dinero no llega nunca a liberarse.
  const marcarEnviado = async () => {
    setMarcando(true);
    setError("");
    try {
      const res = await fetch("/api/ventas-segunda-mano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venta_id: venta.id, accion: "enviado" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo marcar como enviado");
      onHecho();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo marcar como enviado");
      setMarcando(false);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {venta.direccion_envio && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8, background: "#FAF8FF",
          border: "1px solid #EDE9FE", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#475569",
        }}>
          <MapPin size={14} color="#9333EA" style={{ flexShrink: 0, marginTop: 2 }} />
          <span><strong style={{ color: "#0F172A" }}>Enviar a:</strong> {venta.direccion_envio}</span>
        </div>
      )}

      <div style={{
        display: "flex", alignItems: "flex-start", gap: 8, background: "#ECFDF5",
        border: "1px solid #A7F3D0", borderRadius: 10, padding: "10px 12px",
        fontSize: 12.5, color: "#047857", lineHeight: 1.5,
      }}>
        <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong>El envío ya está pagado.</strong> Descarga la etiqueta, pégala en el paquete y
          déjalo en tu oficina de correos o punto de entrega.
          {limite ? <> Tienes hasta el <strong>{limite}</strong>.</> : null}
        </span>
      </div>

      {/* La etiqueta se sirve desde el propio sitio: el enlace de Sendcloud
          necesita nuestras credenciales y no puede darse al vendedor. */}
      <a href={`/api/etiqueta-envio?venta_id=${venta.id}`} target="_blank" rel="noopener noreferrer"
         style={{ ...BTN_PRIMARIO, textDecoration: "none" }}>
        <Truck size={14} /> Descargar etiqueta de envío
      </a>

      {error && <span style={{ fontSize: 12.5, color: "#B91C1C" }}>{error}</span>}

      <button type="button" onClick={marcarEnviado} disabled={marcando} style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        background: "white", color: "#64748B", border: "1.5px solid #EDE9FE",
        borderRadius: 11, padding: "9px 14px", fontSize: 13, fontWeight: 600,
        cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: marcando ? 0.7 : 1,
      }}>
        {marcando ? <Loader2 size={13} className="vsm-spin" /> : <PackageCheck size={13} />}
        {marcando ? "Guardando…" : "Ya lo he dejado en la oficina"}
      </button>

      <span style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
        Normalmente no hace falta: en cuanto el transportista lo recoja, el seguimiento se
        actualiza solo. Usa el botón si tarda o si prefieres confirmarlo tú.
      </span>
    </div>
  );
}

export function PanelVentas() {
  const [ventas, setVentas] = useState<VentaSegundaMano[] | null>(null);
  const [error, setError] = useState("");

  const cargar = () => {
    fetch("/api/ventas-segunda-mano?rol=vendedor")
      .then(r => r.json())
      .then(d => { if (d.ok) setVentas(d.data ?? []); else { setError(d.error ?? "No se pudieron cargar tus ventas"); setVentas([]); } })
      .catch(() => { setError("No se pudieron cargar tus ventas"); setVentas([]); });
  };

  useEffect(cargar, []);

  if (error) return <p style={{ fontSize: 14, color: "#B91C1C" }}>{error}</p>;
  if (ventas === null) return <p style={{ fontSize: 14, color: "#94A3B8" }}>Cargando tus ventas…</p>;

  if (ventas.length === 0) {
    return (
      <div style={{ ...CARD, textAlign: "center", padding: "40px 24px", alignItems: "center" }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%", background: "#FDF2F8",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <PackageCheck size={26} color="#EC4899" />
        </div>
        <p style={{ fontSize: 15, color: "#0F172A", fontWeight: 600, margin: 0 }}>Todavía no has vendido nada</p>
        <p style={{ fontSize: 13.5, color: "#64748B", margin: 0 }}>
          Cuando alguien compre uno de tus productos, aparecerá aquí para que prepares el envío.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{SPINNER_CSS}</style>
      {ventas.map(venta => (
        <div key={venta.id} style={CARD}>
          <Cabecera venta={venta} rol="vendedor" />

          {venta.estado === "pagado" && (
            venta.etiqueta_url
              ? <EtiquetaPrepagada venta={venta} onHecho={cargar} />
              : <FormularioEnvio venta={venta} onHecho={cargar} />
          )}

          {venta.estado === "enviado" && (
            <>
              <Seguimiento venta={venta} />
              <span style={{ fontSize: 12.5, color: "#64748B" }}>
                Esperando a que el comprador confirme la recepción.
                {fecha(venta.limite_confirmacion) && <> Si no dice nada, cobrarás automáticamente el <strong>{fecha(venta.limite_confirmacion)}</strong>.</>}
              </span>
            </>
          )}

          {(venta.estado === "liberado" || venta.estado === "entregado") && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, background: "#ECFDF5",
              border: "1px solid #A7F3D0", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#047857",
            }}>
              <ShieldCheck size={14} />
              <span>
                Venta completada{fecha(venta.liberado_en) ? ` el ${fecha(venta.liberado_en)}` : ""}.
                El ingreso llega a tu cuenta en 2-7 días hábiles.
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------- Comprador ----------

function BotonRecibido({ venta, onHecho }: { venta: VentaSegundaMano; onHecho: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const confirmar = async () => {
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/ventas-segunda-mano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venta_id: venta.id, accion: "recibido" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo confirmar la recepción");
      onHecho();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo confirmar la recepción");
      setEnviando(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={AVISO}>
        <Clock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Confirma solo cuando tengas el producto en la mano y esté como esperabas: al hacerlo se le
          paga al vendedor.
          {fecha(venta.limite_confirmacion) && <> Si no confirmas, se dará por recibido el <strong>{fecha(venta.limite_confirmacion)}</strong>.</>}
        </span>
      </div>

      {error && <span style={{ fontSize: 12.5, color: "#B91C1C" }}>{error}</span>}

      <button type="button" style={{ ...BTN_PRIMARIO, opacity: enviando ? 0.7 : 1 }}
              onClick={confirmar} disabled={enviando}>
        {enviando ? <Loader2 size={14} className="vsm-spin" /> : <PackageCheck size={14} />}
        {enviando ? "Confirmando…" : "He recibido el producto"}
      </button>
    </div>
  );
}

export function PanelCompras() {
  const [compras, setCompras] = useState<VentaSegundaMano[] | null>(null);

  const cargar = () => {
    fetch("/api/ventas-segunda-mano?rol=comprador")
      .then(r => r.json())
      // Solo las compras en curso. Una vez cerrada no hay nada que hacer con
      // ella, y quedaría duplicada con el historial de pedidos de más abajo,
      // que es donde vive con su factura.
      .then(d => setCompras(d.ok
        ? (d.data ?? []).filter((c: VentaSegundaMano) => c.estado !== "liberado" && c.estado !== "reembolsado")
        : []))
      .catch(() => setCompras([]));
  };

  useEffect(cargar, []);

  // Sin compras de segunda mano no se enseña nada: esta sección convive con el
  // historial normal de pedidos y no debe robarle sitio si está vacía.
  if (!compras || compras.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 30 }}>
      <style>{SPINNER_CSS}</style>
      <div>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600,
          color: "#0F172A", margin: "0 0 4px",
        }}>
          Tus compras de segunda mano
        </h2>
        <p style={{ fontSize: 13.5, color: "#64748B", margin: 0 }}>
          El dinero queda retenido hasta que confirmes que has recibido el producto.
        </p>
      </div>

      {compras.map(compra => (
        <div key={compra.id} style={CARD}>
          <Cabecera venta={compra} rol="comprador" />
          <Seguimiento venta={compra} />

          {compra.estado === "pagado" && (
            <span style={{ fontSize: 12.5, color: "#64748B" }}>
              El vendedor está preparando el envío.
              {fecha(compra.limite_envio) && <> Tiene de plazo hasta el <strong>{fecha(compra.limite_envio)}</strong>.</>}
            </span>
          )}

          {/* «entregado» es el transportista diciendo que lo dejó, no el
              comprador diciendo que está bien: sigue pudiendo confirmar, y
              hacerlo libera el dinero sin esperar a que venza el plazo. */}
          {(compra.estado === "enviado" || compra.estado === "entregado") && (
            <BotonRecibido venta={compra} onHecho={cargar} />
          )}
        </div>
      ))}
    </div>
  );
}
