"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Package, Loader2, AlertTriangle } from "lucide-react";
import { TRAMOS_ENVIO, TARIFAS_ENVIO, type TamanoPaquete } from "@/backend/services/tarifas-segunda-mano";

export type DireccionVendedor = {
  direccion: string;
  cp: string;
  ciudad: string;
  provincia: string;
  telefono: string;
};

export type ProductoPendiente = { id: number; nombre: string };

const VACIA: DireccionVendedor = { direccion: "", cp: "", ciudad: "", provincia: "", telefono: "" };

const INPUT: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1.5px solid #EDE9FE", borderRadius: 10,
  fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#0F172A",
  background: "white", boxSizing: "border-box",
};

const LABEL: React.CSSProperties = {
  display: "block", fontSize: 12.5, fontWeight: 700, color: "#6A9E8A", marginBottom: 6,
};

// Selector del tramo de envío. Cada opción lleva su peso y ejemplos porque
// "mediano" no significa nada sin referencias, y un tramo mal elegido acaba
// pagándolo la plataforma.
export function SelectorTamano({
  valor,
  onChange,
}: {
  valor: TamanoPaquete | null;
  onChange: (v: TamanoPaquete) => void;
}) {
  return (
    <div>
      <p style={{ ...LABEL, margin: "0 0 6px" }}>TAMAÑO DEL PAQUETE</p>
      <p style={{ fontSize: 12.5, color: "#94A3B8", margin: "0 0 10px", lineHeight: 1.5 }}>
        Define los gastos de envío que paga el comprador. Tú cobras el precio íntegro.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {TRAMOS_ENVIO.map(tramo => {
          const activo = valor === tramo.valor;
          return (
            <button
              key={tramo.valor}
              type="button"
              onClick={() => onChange(tramo.valor)}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
                padding: "11px 13px", borderRadius: 12, cursor: "pointer",
                border: `2px solid ${activo ? "#EC4899" : "#EDE9FE"}`,
                background: activo ? "#FFF5F9" : "white",
                fontFamily: "'DM Sans', sans-serif",
                transition: "border-color .2s, background .2s",
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: activo ? "#EC4899" : "#F5F2EB",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: activo ? "white" : "#94A3B8", fontWeight: 800, fontSize: 14,
              }}>
                {tramo.valor}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{tramo.titulo}</span>
                  <span style={{ fontSize: 12, color: "#64748B" }}>{tramo.limite}</span>
                </div>
                <span style={{ fontSize: 12, color: "#94A3B8", display: "block", lineHeight: 1.4 }}>
                  {tramo.ejemplos}
                </span>
              </div>

              <strong style={{
                fontSize: 14, fontWeight: 800, whiteSpace: "nowrap",
                color: activo ? "#EC4899" : "#64748B",
              }}>
                {TARIFAS_ENVIO[tramo.valor].toFixed(2)} €
              </strong>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Dirección desde la que el vendedor manda sus paquetes. Se pide una vez y
// vale para todo lo que publique.
export function DireccionVendedorModal({
  onClose,
  onGuardada,
}: {
  onClose: () => void;
  onGuardada: () => void;
}) {
  const [datos, setDatos] = useState<DireccionVendedor>(VACIA);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/direccion-vendedor")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.data) {
          setDatos({
            direccion: d.data.direccion ?? "", cp: d.data.cp ?? "", ciudad: d.data.ciudad ?? "",
            provincia: d.data.provincia ?? "", telefono: d.data.telefono ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const set = (k: keyof DireccionVendedor) => (v: string) => setDatos(p => ({ ...p, [k]: v }));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const res = await fetch("/api/direccion-vendedor", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "No se pudo guardar la dirección");
      onGuardada();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la dirección");
      setGuardando(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="sn-modal-overlay">
      <div className="sn-modal-inner" style={{ maxWidth: 480 }}>
        <button type="button" aria-label="Cerrar" onClick={onClose} style={{
          position: "absolute", top: 20, right: 20, background: "none", border: "none",
          fontSize: 24, cursor: "pointer", color: "#94A3B8",
        }}>×</button>

        <h2 style={{ margin: "0 0 6px", color: "#9333EA", fontFamily: "'Cormorant Garamond', serif", fontSize: 26 }}>
          ¿Desde dónde envías?
        </h2>
        <p style={{ fontSize: 13.5, color: "#64748B", margin: "0 0 20px", lineHeight: 1.6 }}>
          La necesitamos para preparar tus envíos. Solo se le muestra al comprador cuando te compra
          algo, y únicamente para que sepa de dónde sale el paquete.
        </p>

        {error && (
          <div style={{ padding: 12, background: "#FFF5F5", color: "#E74C3C", borderRadius: 8, marginBottom: 16, fontSize: 13.5 }}>
            {error}
          </div>
        )}

        {cargando ? (
          <p style={{ fontSize: 14, color: "#94A3B8" }}>Cargando tus datos…</p>
        ) : (
          <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={LABEL} htmlFor="dv-dir">DIRECCIÓN</label>
              <input id="dv-dir" style={INPUT} value={datos.direccion}
                     onChange={e => set("direccion")(e.target.value)}
                     placeholder="Calle Mayor, 12, 3º B" />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: "0 0 34%" }}>
                <label style={LABEL} htmlFor="dv-cp">CÓDIGO POSTAL</label>
                <input id="dv-cp" style={INPUT} value={datos.cp} inputMode="numeric"
                       onChange={e => set("cp")(e.target.value.replace(/\D/g, "").slice(0, 5))}
                       placeholder="39001" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LABEL} htmlFor="dv-ciudad">CIUDAD</label>
                <input id="dv-ciudad" style={INPUT} value={datos.ciudad}
                       onChange={e => set("ciudad")(e.target.value)} placeholder="Santander" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={LABEL} htmlFor="dv-prov">PROVINCIA (OPCIONAL)</label>
                <input id="dv-prov" style={INPUT} value={datos.provincia}
                       onChange={e => set("provincia")(e.target.value)} placeholder="Cantabria" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LABEL} htmlFor="dv-tel">TELÉFONO</label>
                <input id="dv-tel" style={INPUT} value={datos.telefono} inputMode="numeric"
                       onChange={e => set("telefono")(e.target.value.replace(/\D/g, "").slice(0, 9))}
                       placeholder="600123456" />
              </div>
            </div>

            <p style={{ fontSize: 12, color: "#94A3B8", margin: 0, lineHeight: 1.5 }}>
              El teléfono es para que el transportista pueda avisarte de la recogida.
            </p>

            <button type="submit" disabled={guardando} className="sn-submit-btn"
                    style={{ opacity: guardando ? 0.7 : 1 }}>
              {guardando ? "Guardando…" : "Guardar dirección"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

// Avisa al vendedor de lo que le falta: la dirección, o el tamaño de los
// productos que publicó antes de que ese campo existiera.
export function AvisoEnvioVendedor({
  faltaDireccion,
  productosSinTamano,
  onPonerDireccion,
  onCompletarProducto,
}: {
  faltaDireccion: boolean;
  productosSinTamano: ProductoPendiente[];
  onPonerDireccion: () => void;
  onCompletarProducto: (id: number) => void;
}) {
  if (!faltaDireccion && productosSinTamano.length === 0) return null;

  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      background: "#FFF8E8", border: "1px solid #F5D78E", borderRadius: 14,
      padding: "14px 16px", marginBottom: 20, fontFamily: "'DM Sans', sans-serif",
    }}>
      <AlertTriangle size={18} color="#B45309" style={{ flexShrink: 0, marginTop: 2 }} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {faltaDireccion && (
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#7A5C00" }}>
              Falta tu dirección de envío
            </p>
            <p style={{ margin: "2px 0 7px", fontSize: 13, color: "#7A5C00", lineHeight: 1.5 }}>
              Sin ella no puedes publicar productos nuevos.
            </p>
            <button type="button" onClick={onPonerDireccion} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#B45309", color: "white", border: "none", borderRadius: 9,
              padding: "7px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              <MapPin size={13} /> Añadir dirección
            </button>
          </div>
        )}

        {productosSinTamano.length > 0 && (
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#7A5C00" }}>
              {productosSinTamano.length === 1
                ? "Un producto tuyo no tiene tamaño de paquete"
                : `${productosSinTamano.length} productos tuyos no tienen tamaño de paquete`}
            </p>
            <p style={{ margin: "2px 0 7px", fontSize: 13, color: "#7A5C00", lineHeight: 1.5 }}>
              Los publicaste antes de que existieran los gastos de envío. Hasta que lo indiques se
              cobra la tarifa mediana, que puede no cubrir lo que cuesta enviarlos.
            </p>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {productosSinTamano.map(p => (
                <button key={p.id} type="button" onClick={() => onCompletarProducto(p.id)} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "white", color: "#7A5C00", border: "1.5px solid #F5D78E",
                  borderRadius: 9, padding: "6px 11px", fontSize: 12.5, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", maxWidth: "100%",
                }}>
                  <Package size={12} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.nombre}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CargandoEnvio() {
  return <Loader2 size={14} className="sn-spin" />;
}
