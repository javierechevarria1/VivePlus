"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileText, Package, ChevronDown, ShoppingBag, Loader2, MapPin } from "lucide-react";
import { SolicitarDevolucion } from "@/frontend/src/components/SolicitarDevolucion";
import { PanelCompras, PanelVentas } from "@/frontend/src/components/VentasSegundaMano";

type Pedido = {
  id: number;
  precio_total: string | number;
  estado: string;
  creado_en: string | null;
  factura_numero: string | null;
  factura_pdf_url: string | null;
  factura_url: string | null;
};

type ItemPedido = {
  id: number;
  nombre: string | null;
  imagen: string | string[] | null;
  segunda_mano: boolean | null;
  cantidad: number;
  precio_items: string | number;
};

type DetalleOrden = {
  items: ItemPedido[];
  direccion_envio: string | null;
  precio_total: string | number;
  envio_total: string | number;
  gestion_total: string | number;
  creado_en: string | null;
  dias_devolucion: number | null;
  devolucion_abierta: boolean;
  devolucion: {
    id: number;
    estado: string;
    tiene_etiqueta: boolean;
    seguimiento: string | null;
    seguimiento_url: string | null;
    transportista: string | null;
    dias_para_enviar: number | null;
  } | null;
};

const MP_CARD: React.CSSProperties = {
  background: "white", borderRadius: 16, border: "1.5px solid #EDE9FE",
  padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
};

const MP_FACTURA_BTN: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  background: "linear-gradient(135deg, #EC4899 0%, #9333EA 100%)",
  color: "white", border: "none", borderRadius: 11, padding: "9px 16px",
  fontSize: 13, fontWeight: 700, textDecoration: "none", cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
};

const MP_DETALLE_BTN: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "white", color: "#64748B", border: "1.5px solid #EDE9FE",
  borderRadius: 11, padding: "9px 14px", fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
};

const ESTADO_COLOR: Record<string, { bg: string; color: string }> = {
  activa: { bg: "#ECFDF5", color: "#047857" },
  pendiente: { bg: "#FEF3C7", color: "#B45309" },
  cancelada: { bg: "#FEF2F2", color: "#B91C1C" },
};

// Lo que ve el comprador de su devolución. Cada estado dice qué le toca a él,
// no cómo se llama la fila en la base de datos: mientras el paquete no salga
// de su casa, el único que puede mover la devolución es él.
function EstadoDevolucion({ d }: { d: NonNullable<DetalleOrden["devolucion"]> }) {
  const MENSAJE: Record<string, { texto: string; bg: string; borde: string; color: string }> = {
    solicitada:  { texto: "Hemos recibido tu solicitud de devolución. Te contestamos en cuanto la revisemos.", bg: "#FFFBEB", borde: "#FDE9B8", color: "#B45309" },
    aceptada:    { texto: "Devolución aceptada. Prepara el paquete y déjalo en cualquier oficina del transportista: el envío ya está pagado.", bg: "#F0F9FF", borde: "#BAE0F7", color: "#0369A1" },
    recibida:    { texto: "Ya nos ha llegado tu paquete. Estamos revisándolo y te devolvemos el dinero enseguida.", bg: "#F3EEFF", borde: "#E4DAFB", color: "#7C3AED" },
    reembolsada: { texto: "Te hemos devuelto el dinero. Tarda unos días hábiles en aparecer en tu tarjeta.", bg: "#ECFDF5", borde: "#A7F3D0", color: "#047857" },
    caducada:    { texto: "Cerramos tu devolución porque el paquete no llegó a salir. Si sigues en plazo puedes volver a pedirla y te mandamos una etiqueta nueva.", bg: "#FFFBEB", borde: "#FDE9B8", color: "#B45309" },
    rechazada:   { texto: "No hemos podido aceptar tu solicitud. Revisa el correo que te enviamos.", bg: "#FEF2F2", borde: "#FBD5D5", color: "#B91C1C" },
  };

  const m = MENSAJE[d.estado] ?? MENSAJE.solicitada;
  const dias = d.dias_para_enviar;

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10,
      background: m.bg, border: `1.5px solid ${m.borde}`, borderRadius: 12,
      padding: "12px 14px",
    }}>
      <span style={{ fontSize: 13, color: m.color, lineHeight: 1.6 }}>{m.texto}</span>

      {d.estado === "aceptada" && dias != null && dias > 0 && (
        <span style={{ fontSize: 12.5, color: m.color, fontWeight: 700 }}>
          Te quedan {dias} día{dias !== 1 ? "s" : ""} para dejarlo en el transportista.
        </span>
      )}

      {d.estado === "aceptada" && d.tiene_etiqueta && (
        <a
          href={`/api/etiqueta-envio?devolucion_id=${d.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...MP_FACTURA_BTN, alignSelf: "flex-start" }}
        >
          Descargar la etiqueta de vuelta
        </a>
      )}

      {d.seguimiento && (
        <span style={{ fontSize: 12, color: m.color }}>
          {d.transportista ?? "Transportista"} ·{" "}
          {d.seguimiento_url
            ? <a href={d.seguimiento_url} target="_blank" rel="noopener noreferrer" style={{ color: m.color, fontWeight: 700 }}>{d.seguimiento}</a>
            : <strong>{d.seguimiento}</strong>}
        </span>
      )}
    </div>
  );
}

function EstadoChip({ estado }: { estado: string }) {
  const c = ESTADO_COLOR[estado] ?? { bg: "#F1F5F9", color: "#475569" };
  return (
    <span style={{
      background: c.bg, color: c.color, borderRadius: 99, padding: "3px 10px",
      fontSize: 11.5, fontWeight: 700, textTransform: "capitalize",
    }}>
      {estado}
    </span>
  );
}

function formatoFecha(valor: string | null) {
  if (!valor) return null;
  return new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function formatoImporte(valor: string | number) {
  return `${Number(valor).toFixed(2)} €`;
}

// La imagen puede venir como cadena suelta o como lista JSON, según cómo se
// publicara el producto.
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

function LineaImporte({ etiqueta, valor, destacado = false }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0" }}>
      <span style={{ fontSize: destacado ? 15 : 13.5, color: destacado ? "#0F172A" : "#64748B", fontWeight: destacado ? 600 : 400 }}>
        {etiqueta}
      </span>
      <span style={{
        fontSize: destacado ? 16 : 13.5, fontWeight: destacado ? 700 : 500,
        color: destacado ? "#EC4899" : "#475569", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums",
      }}>
        {valor}
      </span>
    </div>
  );
}

function DetallePedido({ ordenId }: { ordenId: number }) {
  const [detalle, setDetalle] = useState<DetalleOrden | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ordenes?id=${ordenId}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d.ok) setDetalle({ ...d.data, items: (d.data.items ?? []).filter((i: ItemPedido) => i?.id) });
        else setError(d.error ?? "No se pudo cargar el detalle");
      })
      .catch(() => { if (!cancelled) setError("No se pudo cargar el detalle"); });
    return () => { cancelled = true; };
  }, [ordenId]);

  if (error) return <p style={{ fontSize: 13, color: "#B91C1C", margin: "12px 0 0" }}>{error}</p>;
  if (!detalle) return <p style={{ fontSize: 13, color: "#94A3B8", margin: "12px 0 0" }}>Cargando detalle…</p>;

  const envio = Number(detalle.envio_total ?? 0);
  const gestion = Number(detalle.gestion_total ?? 0);
  const total = Number(detalle.precio_total ?? 0);
  const articulos = detalle.items.reduce((s, i) => s + Number(i.precio_items ?? 0), 0);

  return (
    <div style={{ marginTop: 14, borderTop: "1px solid #EDE9FE", paddingTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {detalle.items.map(item => (
          <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{
              width: 48, height: 48, flexShrink: 0, borderRadius: 10,
              background: "#F5F2EB", overflow: "hidden", position: "relative",
            }}>
              <Image fill sizes="48px" src={primeraImagen(item.imagen)}
                     alt={item.nombre ?? "Producto"} style={{ objectFit: "contain", padding: 4 }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                {item.nombre ?? "Producto no disponible"}
              </div>
              <div style={{ fontSize: 12.5, color: "#94A3B8" }}>
                {item.segunda_mano ? "Segunda mano · " : ""}Cantidad: {item.cantidad}
              </div>
            </div>

            <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
              {formatoImporte(item.precio_items)}
            </span>
          </div>
        ))}
      </div>

      {/* Los extras solo existen en las compras de segunda mano: en un pedido
          normal de la tienda no se cobra ni envío ni gestión. */}
      <div style={{ background: "#FAF8FF", borderRadius: 12, padding: "12px 14px" }}>
        <LineaImporte etiqueta="Artículos" valor={formatoImporte(articulos)} />
        {envio > 0 && <LineaImporte etiqueta="Gastos de envío" valor={formatoImporte(envio)} />}
        {gestion > 0 && <LineaImporte etiqueta="Gastos de gestión y seguridad" valor={formatoImporte(gestion)} />}
        <div style={{ height: 1, background: "#EDE9FE", margin: "8px 0" }} />
        <LineaImporte etiqueta="Total pagado" valor={formatoImporte(total)} destacado />
      </div>

      {detalle.direccion_envio && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "#475569" }}>
          <MapPin size={14} color="#9333EA" style={{ flexShrink: 0, marginTop: 2 }} />
          <span><strong style={{ color: "#0F172A" }}>Enviado a:</strong> {detalle.direccion_envio}</span>
        </div>
      )}

      {/* El desistimiento solo aplica a lo que vende la plataforma: entre
          particulares no hay derecho de devolución sin motivo. */}
      {detalle.items.some(i => !i.segunda_mano) && !detalle.devolucion_abierta && (
        <SolicitarDevolucion ordenId={ordenId} diasRestantes={detalle.dias_devolucion} />
      )}

      {/* Se enseña siempre que haya una, abierta o no: una devolución caducada
          o rechazada tiene que verse, y además convive con el botón de volver
          a pedirla. */}
      {detalle.devolucion && <EstadoDevolucion d={detalle.devolucion} />}
    </div>
  );
}

function BotonFactura({ pedido }: { pedido: Pedido }) {
  const [url, setUrl] = useState(pedido.factura_pdf_url ?? pedido.factura_url);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState("");

  if (pedido.estado === "pendiente") {
    return <span style={{ fontSize: 12.5, color: "#94A3B8" }}>Sin factura: el pago no se completó</span>;
  }

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={MP_FACTURA_BTN}>
        <FileText size={14} /> Descargar factura
      </a>
    );
  }

  // La factura tarda unos segundos en emitirse tras el cobro: se pide a Stripe
  // en el momento en que el usuario la reclama.
  const pedirFactura = async () => {
    setCargando(true);
    setAviso("");
    try {
      const res = await fetch(`/api/factura-pedido?orden_id=${pedido.id}`);
      const data = await res.json();
      if (res.ok && data.url) {
        setUrl(data.url);
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        setAviso(data.error ?? "No se pudo obtener la factura");
      }
    } catch {
      setAviso("No se pudo obtener la factura");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button type="button" onClick={pedirFactura} disabled={cargando} style={{ ...MP_FACTURA_BTN, opacity: cargando ? 0.7 : 1 }}>
        {cargando ? <Loader2 size={14} className="mp-spin" /> : <FileText size={14} />}
        {cargando ? "Buscando…" : "Obtener factura"}
      </button>
      {aviso && <span style={{ fontSize: 12, color: "#B45309", maxWidth: 260 }}>{aviso}</span>}
    </div>
  );
}

const TAB_BTN = (activa: boolean): React.CSSProperties => ({
  background: "none", border: "none", borderBottom: `2.5px solid ${activa ? "#EC4899" : "transparent"}`,
  padding: "9px 2px", marginRight: 26, cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif", fontSize: 14.5,
  fontWeight: activa ? 700 : 500, color: activa ? "#EC4899" : "#64748B",
});

export default function MisPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [error, setError] = useState("");
  const [abierto, setAbierto] = useState<number | null>(null);
  const [tab, setTab] = useState<"compras" | "ventas">("compras");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ordenes")
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d.ok) setPedidos(d.data ?? []);
        else { setError(d.error ?? "No se pudieron cargar tus pedidos"); setPedidos([]); }
      })
      .catch(() => {
        if (cancelled) return;
        setError("No se pudieron cargar tus pedidos");
        setPedidos([]);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{
      minHeight: "70vh", background: "#FAF8FF", fontFamily: "'DM Sans', sans-serif",
      // La navbar es fija (top 16 + 60 de alto): el contenido arranca por debajo.
      padding: "124px 20px 64px",
    }}>
      <style>{`@keyframes mp-spin { to { transform: rotate(360deg) } } .mp-spin { animation: mp-spin .8s linear infinite }`}</style>

      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.9rem, 4vw, 2.4rem)",
          fontWeight: 600, color: "#0F172A", margin: "0 0 6px",
        }}>
          Mis pedidos
        </h1>
        <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 18px", lineHeight: 1.6 }}>
          Aquí tienes el historial de tus compras y la factura de cada una.
        </p>

        <div style={{ borderBottom: "1.5px solid #EDE9FE", marginBottom: 26 }}>
          <button type="button" style={TAB_BTN(tab === "compras")} onClick={() => setTab("compras")}>
            Mis compras
          </button>
          <button type="button" style={TAB_BTN(tab === "ventas")} onClick={() => setTab("ventas")}>
            Mis ventas
          </button>
        </div>

        {tab === "ventas" && <PanelVentas />}

        {tab === "compras" && <>
        <PanelCompras />

        {error && (
          <div style={{ ...MP_CARD, borderColor: "#FECACA", background: "#FEF2F2", color: "#B91C1C", fontSize: 14 }}>
            {error}
          </div>
        )}

        {!error && pedidos === null && (
          <p style={{ fontSize: 14, color: "#94A3B8" }}>Cargando tus pedidos…</p>
        )}

        {!error && pedidos?.length === 0 && (
          <div style={{ ...MP_CARD, textAlign: "center", padding: "44px 24px" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "#FDF2F8",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
            }}>
              <Package size={28} color="#EC4899" />
            </div>
            <p style={{ fontSize: 15, color: "#0F172A", fontWeight: 600, margin: "0 0 6px" }}>
              Todavía no has hecho ningún pedido
            </p>
            <p style={{ fontSize: 13.5, color: "#64748B", margin: "0 0 20px" }}>
              Cuando compres algo, aquí podrás descargar su factura.
            </p>
            <Link href="/marketplace" style={MP_FACTURA_BTN}>
              <ShoppingBag size={14} /> Ir al marketplace
            </Link>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {pedidos?.map(pedido => (
            <div key={pedido.id} style={MP_CARD}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Pedido #{pedido.id}</span>
                    <EstadoChip estado={pedido.estado} />
                  </div>
                  <div style={{ fontSize: 13, color: "#64748B" }}>
                    {[
                      formatoFecha(pedido.creado_en),
                      formatoImporte(pedido.precio_total),
                      pedido.factura_numero && `Factura ${pedido.factura_numero}`,
                    ].filter(Boolean).join(" · ")}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={MP_DETALLE_BTN}
                    onClick={() => setAbierto(abierto === pedido.id ? null : pedido.id)}
                  >
                    Detalle
                    <ChevronDown
                      size={13}
                      style={{ transition: "transform .2s", transform: abierto === pedido.id ? "rotate(180deg)" : "none" }}
                    />
                  </button>
                  <BotonFactura pedido={pedido} />
                </div>
              </div>

              {abierto === pedido.id && <DetallePedido ordenId={pedido.id} />}
            </div>
          ))}
        </div>
        </>}
      </div>
    </div>
  );
}
