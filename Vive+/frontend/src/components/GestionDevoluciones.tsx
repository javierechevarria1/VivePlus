"use client";

import { useEffect, useState, useCallback } from "react";
import { RotateCcw, Loader2, AlertTriangle, RefreshCcw, PackageCheck, Truck } from "lucide-react";
import {
  C, T, R, campo, distintivo, btnPrimario, btnSecundario, type Tono,
} from "./admin/ui";
import { Fila, FilaPrincipal, Vacio } from "./admin/primitives";

export type Devolucion = {
  id: number;
  orden_id: number | null;
  venta_id: number | null;
  tipo: string;
  motivo: string | null;
  estado: string;
  respuesta: string | null;
  importe_solicitado: string | number | null;
  importe_reembolsado: string | number | null;
  creado_en: string;
  solicitante: string | null;
  solicitante_email: string | null;
  producto: string | null;
  seguimiento: string | null;
  seguimiento_url: string | null;
  transportista: string | null;
  estado_envio: string | null;
  motivo_sin_etiqueta: string | null;
  sendcloud_id: string | null;
  limite_retorno: string | null;
  // Lo que se descuenta por el viaje de vuelta y lo que queda por devolver.
  descuento_vuelta: number;
  importe_sugerido: string | number | null;
};

// El estado dice en qué punto del viaje está la devolución, no solo si está
// resuelta: entre aceptarla y devolver el dinero hay un paquete cruzando el
// país, y quien gestiona necesita distinguir «esperando» de «me toca».
const ESTADO: Record<string, { texto: string; tono: Tono }> = {
  solicitada:  { texto: "Sin resolver",      tono: "aviso" },
  aceptada:    { texto: "Esperando paquete", tono: "info" },
  recibida:    { texto: "Paquete recibido",  tono: "marca" },
  caducada:    { texto: "Caducada",          tono: "neutro" },
  rechazada:   { texto: "Rechazada",         tono: "error" },
  reembolsada: { texto: "Reembolsada",       tono: "ok" },
};

const importe = (v: string | number | null) => (v == null ? "—" : `${Number(v).toFixed(2)} €`);

// Días que le quedan al comprador para mandar el paquete. En negativo ya no
// aparece: para eso está el barrido que la cierra.
function diasParaElPaquete(limite: string | null): number | null {
  if (!limite) return null;
  return Math.ceil((new Date(limite).getTime() - Date.now()) / 86_400_000);
}

function Ficha({ d, onCambio }: { d: Devolucion; onCambio: () => void }) {
  const [respuesta, setRespuesta] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  // Vacío significa «devuélvelo todo», que es lo que pasa casi siempre. Solo se
  // toca cuando el artículo vuelve incompleto o dañado.
  const [importeParcial, setImporteParcial] = useState("");
  // Cuando al vendedor ya se le pagó, el servidor exige confirmar antes de
  // reembolsar: la plataforma pondría ese dinero de su bolsillo.
  const [avisoConfirmar, setAvisoConfirmar] = useState("");

  const resolver = async (accion: string, confirmado = false) => {
    setOcupado(true);
    setError("");
    try {
      const parcial = accion === "reembolsar" && importeParcial.trim()
        ? Number(importeParcial.replace(",", "."))
        : null;
      if (parcial !== null && (!Number.isFinite(parcial) || parcial <= 0)) {
        setError("El importe a devolver tiene que ser un número mayor que cero");
        setOcupado(false);
        return;
      }

      const res = await fetch("/api/devoluciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: d.id, accion, respuesta, confirmado, importe: parcial }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "REQUIERE_CONFIRMACION") {
          setAvisoConfirmar(data.error);
          setOcupado(false);
          return;
        }
        throw new Error(data.error ?? "No se pudo completar");
      }
      // La etiqueta puede fallar sin que la devolución falle: se avisa, porque
      // significa que hay que escribirle al comprador a mano.
      if (data.aviso) setAvisoConfirmar(data.aviso);
      onCambio();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar");
      setOcupado(false);
    }
  };

  const est = ESTADO[d.estado] ?? { texto: d.estado, tono: "neutro" as Tono };
  const abierta = d.estado === "solicitada" || d.estado === "aceptada" || d.estado === "recibida";
  const dias = diasParaElPaquete(d.limite_retorno);
  // Pedir el producto de vuelta solo tiene sentido en lo que vendemos
  // nosotros: entre particulares el artículo tendría que volver a casa del
  // vendedor, y ese camino no existe.
  const puedePedirVuelta = d.estado === "solicitada" && d.orden_id != null;

  return (
    <Fila
      // Destacadas las que esperan a alguien: la recién pedida y la que ya ha
      // vuelto. La que está en tránsito no necesita a nadie todavía.
      destacada={d.estado === "solicitada" || d.estado === "recibida"}
      desplegado={
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {d.motivo && (
            <div>
              <p style={{ margin: "0 0 5px", fontSize: T.micro, fontWeight: 600, color: C.suave }}>
                Motivo que dio {d.solicitante ?? "el comprador"}
              </p>
              <p style={{
                margin: 0, background: C.superficie, border: `1px solid ${C.borde}`,
                borderRadius: R.chico, padding: "10px 12px",
                fontSize: T.dato, color: C.texto, lineHeight: 1.6,
              }}>
                {d.motivo}
              </p>
            </div>
          )}

          {d.estado === "reembolsada" && (
            <p style={{ margin: 0, fontSize: T.dato, color: C.ok, fontWeight: 600 }}>
              Reembolsados {importe(d.importe_reembolsado)}.
            </p>
          )}

          {/* El viaje de vuelta. Es lo que responde a «¿por dónde va?», que es
              lo primero que se pregunta cuando una devolución lleva días. */}
          {d.seguimiento && (
            <div style={{
              display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap",
              background: C.infoSuave, border: "1px solid #BAE0F7", borderRadius: R.chico,
              padding: "10px 13px", fontSize: T.dato, color: C.info,
            }}>
              <Truck size={14} style={{ flexShrink: 0 }} />
              <span>
                Vuelve por <strong>{d.transportista ?? "el transportista"}</strong> ·{" "}
                {d.seguimiento_url
                  ? <a href={d.seguimiento_url} target="_blank" rel="noopener noreferrer" style={{ color: C.info, fontVariantNumeric: "tabular-nums" }}>{d.seguimiento}</a>
                  : <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{d.seguimiento}</span>}
              </span>
              {d.estado_envio && <span style={{ color: C.suave }}>· {d.estado_envio}</span>}
            </div>
          )}

          {d.estado === "aceptada" && d.motivo_sin_etiqueta && !d.sendcloud_id && (
            <div style={{
              display: "flex", gap: 9, alignItems: "flex-start",
              background: C.avisoSuave, border: "1px solid #FDE9B8", borderRadius: R.chico,
              padding: "11px 13px", fontSize: T.micro, color: C.aviso, lineHeight: 1.55,
            }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                No se pudo crear la etiqueta de vuelta ({d.motivo_sin_etiqueta}). Al comprador se le
                ha dicho que le escribimos con las instrucciones: hay que hacerlo.
              </span>
            </div>
          )}

          {d.estado === "recibida" && (
            <p style={{ margin: 0, fontSize: T.dato, color: C.marca, fontWeight: 600 }}>
              El paquete ya está aquí. Comprueba que llega completo y reembolsa.
            </p>
          )}

          {d.estado === "aceptada" && dias != null && (
            <p style={{ margin: 0, fontSize: T.micro, color: dias <= 3 ? C.aviso : C.tenue }}>
              {dias > 0
                ? `Le quedan ${dias} día${dias !== 1 ? "s" : ""} para enviarlo. Pasado el plazo se cierra sola.`
                : "El plazo ha vencido; se cerrará en el próximo repaso diario."}
            </p>
          )}

          {d.estado === "caducada" && (
            <p style={{ margin: 0, fontSize: T.dato, color: C.suave }}>
              El paquete no llegó a salir y el plazo venció. No se ha devuelto nada. Si el comprador
              sigue en plazo puede volver a pedirla, y se le mandará una etiqueta nueva.
            </p>
          )}

          {avisoConfirmar && (
            <div style={{
              display: "flex", gap: 9, alignItems: "flex-start",
              background: C.avisoSuave, border: "1px solid #FDE9B8", borderRadius: R.chico,
              padding: "11px 13px", fontSize: T.micro, color: C.aviso, lineHeight: 1.55,
            }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{avisoConfirmar}</span>
            </div>
          )}

          {error && <span style={{ fontSize: T.micro, color: C.error }}>{error}</span>}

          {abierta && (
            <>
              <div>
                <label htmlFor={`dev-resp-${d.id}`} style={{ display: "block", fontSize: T.micro, fontWeight: 600, color: C.suave, marginBottom: 6 }}>
                  Respuesta al comprador (opcional)
                </label>
                <textarea
                  id={`dev-resp-${d.id}`}
                  value={respuesta}
                  onChange={ev => setRespuesta(ev.target.value)}
                  rows={2}
                  placeholder="Se incluirá en el email que recibe."
                  style={{ ...campo, resize: "vertical" }}
                />
              </div>

              {/* Solo con el paquete delante: hasta que no se abre la caja no
                  hay forma de saber que falta algo, y ofrecerlo antes invita a
                  recortar el reembolso sin haber visto nada. */}
              {d.estado === "recibida" && (
                <div>
                  <label htmlFor={`dev-imp-${d.id}`} style={{ display: "block", fontSize: T.micro, fontWeight: 600, color: C.suave, marginBottom: 6 }}>
                    Importe a devolver
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                    <input
                      id={`dev-imp-${d.id}`}
                      type="text"
                      inputMode="decimal"
                      value={importeParcial}
                      onChange={ev => setImporteParcial(ev.target.value)}
                      placeholder={String(Number(d.importe_sugerido ?? d.importe_solicitado ?? 0).toFixed(2))}
                      style={{ ...campo, width: 120, fontVariantNumeric: "tabular-nums" }}
                    />
                    <span style={{ fontSize: T.micro, color: C.tenue, lineHeight: 1.6 }}>
                      {d.descuento_vuelta > 0 ? (
                        <>
                          En blanco devuelve {importe(d.importe_sugerido)}: los{" "}
                          {importe(d.importe_solicitado)} que pagó menos {importe(d.descuento_vuelta)}{" "}
                          del envío de vuelta.{" "}
                          <strong style={{ color: C.aviso }}>
                            Si el fallo fue nuestro —llegó roto, no llegó, no era lo que pidió—
                            escribe {importe(d.importe_solicitado)}
                          </strong>: ahí el retorno no se le cobra.
                        </>
                      ) : (
                        <>En blanco devuelve {importe(d.importe_sugerido ?? d.importe_solicitado)}, que es todo lo que pagó.</>
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {/* El camino normal: se acepta, se le manda la etiqueta de
                    vuelta y el dinero sale cuando el paquete llega. */}
                {puedePedirVuelta && (
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => resolver("aceptar")}
                    style={{ ...btnPrimario, opacity: ocupado ? 0.7 : 1 }}
                  >
                    {ocupado ? <Loader2 size={13} className="adm-giro" /> : <PackageCheck size={13} />}
                    Aceptar y pedir el producto
                  </button>
                )}

                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => resolver("reembolsar", Boolean(avisoConfirmar))}
                  style={{
                    ...(puedePedirVuelta ? btnSecundario : btnPrimario),
                    opacity: ocupado ? 0.7 : 1,
                  }}
                >
                  {ocupado ? <Loader2 size={13} className="adm-giro" /> : <RotateCcw size={13} />}
                  {avisoConfirmar
                    ? "Reembolsar de todas formas"
                    : d.estado === "recibida" ? "Reembolsar" : "Reembolsar sin esperar"}
                </button>

                {d.estado === "solicitada" && (
                  <button type="button" disabled={ocupado} onClick={() => resolver("rechazar")} style={{ ...btnSecundario, opacity: ocupado ? 0.7 : 1 }}>
                    Rechazar
                  </button>
                )}
              </div>

              {puedePedirVuelta && (
                <span style={{ fontSize: T.micro, color: C.tenue, lineHeight: 1.6 }}>
                  Al aceptar se le manda una etiqueta de vuelta pagada por nosotros, y el dinero se
                  devuelve cuando el paquete llegue. Reembolsa sin esperar solo si el artículo no
                  tiene que volver.
                </span>
              )}
            </>
          )}
        </div>
      }
    >
      <FilaPrincipal
        titulo={d.orden_id ? `Pedido #${d.orden_id}` : `Venta #${d.venta_id}`}
        meta={[
          d.producto,
          d.solicitante,
          new Date(d.creado_en).toLocaleDateString("es-ES", { day: "numeric", month: "long" }),
        ].filter(Boolean).join(" · ")}
      >
        <span style={distintivo(est.tono)}>{est.texto}</span>
        <span style={distintivo("neutro")}>{d.tipo === "incidencia" ? "Incidencia" : "Desistimiento"}</span>
      </FilaPrincipal>

      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <div style={{ fontSize: T.cuerpo, fontWeight: 700, color: C.accion, fontVariantNumeric: "tabular-nums" }}>
          {importe(d.importe_solicitado)}
        </div>
        <div style={{ fontSize: T.micro, color: C.tenue, marginTop: 1 }}>solicitado</div>
      </div>
    </Fila>
  );
}

// La lista la pide el propio hook para que la página que la aloja pueda
// enseñar el contador en su pestaña sin duplicar la petición.
export function useDevoluciones() {
  const [lista, setLista] = useState<Devolucion[] | null>(null);

  const cargar = useCallback(() => {
    fetch("/api/devoluciones")
      .then(r => r.json())
      .then(d => setLista(d.ok ? (d.data ?? []) : []))
      .catch(() => setLista([]));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const todas = lista ?? [];

  return {
    lista,
    cargar,
    // Lo que espera a una persona: la solicitud sin resolver y el paquete que
    // ya ha vuelto y hay que reembolsar. Lo que está en tránsito se cuenta
    // aparte porque no hay nada que hacer con ello.
    pendientes: todas.filter(d => d.estado === "solicitada" || d.estado === "recibida").length,
    sinResolver: todas.filter(d => d.estado === "solicitada").length,
    recibidas: todas.filter(d => d.estado === "recibida").length,
    enCamino: todas.filter(d => d.estado === "aceptada").length,
  };
}

export function ListaDevoluciones({ lista, onCambio }: { lista: Devolucion[]; onCambio: () => void }) {
  if (lista.length === 0) {
    return (
      <Vacio
        icono={<RefreshCcw size={24} />}
        titulo="No hay devoluciones"
        texto="Cuando alguien solicite una devolución o reporte una incidencia, aparecerá aquí."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {lista.map(d => <Ficha key={d.id} d={d} onCambio={onCambio} />)}
    </div>
  );
}
