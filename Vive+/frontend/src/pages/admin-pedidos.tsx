"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Package, MapPin, Mail, ChevronDown, ChevronUp, Truck, Loader2, RotateCcw } from "lucide-react";
import { useDevoluciones, ListaDevoluciones } from "@/frontend/src/components/GestionDevoluciones";
import { AdminShell } from "@/frontend/src/components/admin/AdminShell";
import {
  C, T, R, campo, distintivo, seccionTitulo,
  btnPrimario, btnSecundario, type Tono,
} from "@/frontend/src/components/admin/ui";
import {
  Aviso, Barra, BotonIcono, Buscador, Esqueleto,
  Fila, FilaAcciones, FilaDato, FilaPrincipal, Miniatura,
  Recuento, Segmentos, Vacio,
} from "@/frontend/src/components/admin/primitives";

type ItemPedido = {
  nombre: string;
  imagen: string | string[] | null;
  cantidad: number;
  importe: string | number;
};

type PedidoAdmin = {
  id: number;
  precio_total: string | number;
  estado: string;
  direccion_envio: string | null;
  creado_en: string | null;
  comprador: string;
  comprador_email: string | null;
  items: ItemPedido[] | null;
  sendcloud_id: string | null;
  seguimiento: string | null;
  seguimiento_url: string | null;
  transportista: string | null;
  estado_envio: string | null;
  motivo_sin_etiqueta: string | null;
  devolucion_estado: string | null;
};

// Cómo se anuncia en la lista de pedidos que hay una devolución en marcha.
// El texto dice de quién es el turno, no en qué estado está la fila.
const DEVOLUCION: Record<string, { texto: string; tono: Tono }> = {
  solicitada: { texto: "Devolución pedida",  tono: "error" },
  aceptada:   { texto: "Devolución en vuelo", tono: "info" },
  recibida:   { texto: "Devolución recibida", tono: "marca" },
};

const TRAMOS = [
  { valor: "S", texto: "S · hasta 2 kg" },
  { valor: "M", texto: "M · hasta 5 kg" },
  { valor: "L", texto: "L · hasta 15 kg" },
];

// «activa» significa pagada y sin preparar: para quien gestiona los pedidos,
// eso es «pendiente de enviar», que es lo que necesita ver de un vistazo.
const ESTADO: Record<string, { texto: string; tono: Tono }> = {
  activa:    { texto: "Pendiente de enviar", tono: "aviso" },
  enviada:   { texto: "Enviada",             tono: "info" },
  entregada: { texto: "Entregada",           tono: "ok" },
  cancelada: { texto: "Cancelada",           tono: "error" },
};

type Vista = "pedidos" | "devoluciones";
type Filtro = "pendientes" | "curso" | "todos";

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

const fecha = (valor: string | null) =>
  valor ? new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : null;

const importe = (v: string | number) => `${Number(v).toFixed(2)} €`;

// El bloque de envío de un pedido. La etiqueta se genera aquí y no al cobrar:
// hasta que no se empaqueta no se sabe si el stock real da, cuánto pesa ni si
// el comprador va a cancelar.
function BloqueEnvio({ pedido, onCambio }: { pedido: PedidoAdmin; onCambio: () => void }) {
  const [tramo, setTramo] = useState("M");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  const llamar = async (cuerpo: Record<string, unknown>) => {
    setOcupado(true);
    setError("");
    try {
      const res = await fetch("/api/admin-pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orden_id: pedido.id, ...cuerpo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo completar la acción");
      onCambio();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la acción");
      setOcupado(false);
    }
  };

  const cerrado = pedido.estado === "entregada" || pedido.estado === "cancelada";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={seccionTitulo}>Envío</p>

      {pedido.seguimiento && (
        <div style={{
          display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap",
          background: C.infoSuave, border: "1px solid #BAE0F7", borderRadius: R.chico,
          padding: "10px 13px", fontSize: T.dato, color: C.info,
        }}>
          <Truck size={14} style={{ flexShrink: 0 }} />
          <span>
            <strong>{pedido.transportista}</strong> ·{" "}
            {pedido.seguimiento_url
              ? <a href={pedido.seguimiento_url} target="_blank" rel="noopener noreferrer" style={{ color: C.info, fontVariantNumeric: "tabular-nums" }}>{pedido.seguimiento}</a>
              : <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{pedido.seguimiento}</span>}
          </span>
          {pedido.estado_envio && <span style={{ color: C.suave }}>· {pedido.estado_envio}</span>}
        </div>
      )}

      {error && <span style={{ fontSize: T.micro, color: C.error }}>{error}</span>}

      {pedido.motivo_sin_etiqueta && !pedido.sendcloud_id && (
        <span style={{ fontSize: T.micro, color: C.aviso }}>
          Último intento fallido: {pedido.motivo_sin_etiqueta}
        </span>
      )}

      {!cerrado && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          {!pedido.sendcloud_id ? (
            <>
              <div>
                <label htmlFor={`tramo-${pedido.id}`} style={{ display: "block", fontSize: T.micro, fontWeight: 600, color: C.suave, marginBottom: 6 }}>
                  Tamaño del paquete
                </label>
                <select id={`tramo-${pedido.id}`} value={tramo} onChange={e => setTramo(e.target.value)} style={{ ...campo, width: "auto", minWidth: 150 }}>
                  {TRAMOS.map(t => <option key={t.valor} value={t.valor}>{t.texto}</option>)}
                </select>
              </div>
              <button
                type="button"
                disabled={ocupado}
                onClick={() => llamar({ accion: "preparar", tamano: tramo })}
                style={{ ...btnPrimario, opacity: ocupado ? 0.7 : 1 }}
              >
                {ocupado ? <Loader2 size={13} className="adm-giro" /> : <Package size={13} />}
                {ocupado ? "Preparando…" : "Preparar envío"}
              </button>
            </>
          ) : (
            <a
              href={`/api/etiqueta-envio?pedido_id=${pedido.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={btnPrimario}
            >
              <Truck size={13} /> Descargar etiqueta
            </a>
          )}

          {pedido.estado === "activa" && (
            <button type="button" disabled={ocupado} onClick={() => llamar({ accion: "enviado" })} style={{ ...btnSecundario, opacity: ocupado ? 0.7 : 1 }}>
              Marcar como enviado
            </button>
          )}
        </div>
      )}

      {pedido.sendcloud_id && pedido.estado === "activa" && (
        <span style={{ fontSize: T.micro, color: C.tenue, lineHeight: 1.6 }}>
          Imprime la etiqueta y deja el paquete. El estado se actualizará solo en cuanto lo recoja
          el transportista; el botón de la derecha está por si tarda.
        </span>
      )}
    </div>
  );
}

export default function AdminPedidosPage() {
  const [pedidos,  setPedidos]  = useState<PedidoAdmin[] | null>(null);
  const [error,    setError]    = useState("");
  const [abierto,  setAbierto]  = useState<number | null>(null);
  const [vista,    setVista]    = useState<Vista>("pedidos");
  const [filtro,   setFiltro]   = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");

  const devoluciones = useDevoluciones();

  const cargar = useCallback(() => {
    fetch("/api/admin-pedidos")
      .then(r => r.json())
      .then(d => {
        if (d.ok) setPedidos(d.data ?? []);
        else { setError(d.error ?? "No se pudieron cargar los pedidos"); setPedidos([]); }
      })
      .catch(() => { setError("No se pudieron cargar los pedidos"); setPedidos([]); });
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const lista       = useMemo(() => pedidos ?? [], [pedidos]);
  const pendientes  = lista.filter(p => p.estado === "activa");
  const enCurso     = lista.filter(p => p.estado === "enviada");
  const facturado   = lista
    .filter(p => p.estado !== "cancelada")
    .reduce((s, p) => s + Number(p.precio_total), 0);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return lista
      .filter(p =>
        filtro === "todos"      ? true :
        filtro === "pendientes" ? p.estado === "activa" : p.estado === "enviada"
      )
      .filter(p =>
        !texto ||
        String(p.id).includes(texto) ||
        p.comprador.toLowerCase().includes(texto) ||
        (p.comprador_email ?? "").toLowerCase().includes(texto) ||
        (p.seguimiento ?? "").toLowerCase().includes(texto)
      );
  }, [lista, filtro, busqueda]);

  const enPedidos = vista === "pedidos";

  return (
    <AdminShell
      titulo={enPedidos ? "Pedidos de la tienda" : "Devoluciones"}
      descripcion={
        enPedidos
          ? pendientes.length > 0
            ? <>Hay <strong style={{ color: C.aviso }}>{pendientes.length} pedido{pendientes.length !== 1 ? "s" : ""} pendiente{pendientes.length !== 1 ? "s" : ""} de enviar</strong>. Los de segunda mano los gestiona cada vendedor desde su panel.</>
            : "Nada pendiente de enviar. Los pedidos de segunda mano los gestiona cada vendedor desde su panel."
          : devoluciones.pendientes > 0
            ? <>Te esperan <strong style={{ color: C.aviso }}>{devoluciones.pendientes}</strong>{devoluciones.enCamino > 0 ? <>, y hay {devoluciones.enCamino} paquete{devoluciones.enCamino !== 1 ? "s" : ""} de camino de vuelta</> : null}. Al aceptar se manda una etiqueta pagada y el dinero sale cuando el paquete llega.</>
            : devoluciones.enCamino > 0
              ? <>Nada que resolver. Hay {devoluciones.enCamino} paquete{devoluciones.enCamino !== 1 ? "s" : ""} de camino de vuelta.</>
              : "Todas las devoluciones están resueltas."
      }
      acciones={
        <Segmentos<Vista>
          valor={vista}
          onCambio={setVista}
          opciones={[
            { valor: "pedidos",      texto: "Pedidos",      cuenta: lista.length },
            // La pestaña marca lo que espera a una persona, no el total: un
            // contador que solo crece deja de mirarse a la semana.
            { valor: "devoluciones", texto: "Devoluciones", cuenta: devoluciones.pendientes },
          ]}
        />
      }
      kpis={
        enPedidos
          ? [
              { etiqueta: "Por enviar",   valor: pendientes.length, tono: pendientes.length > 0 ? "aviso" : "ok" },
              { etiqueta: "En tránsito",  valor: enCurso.length, tono: "info" },
              {
                etiqueta: "Devoluciones",
                valor: devoluciones.pendientes,
                tono: devoluciones.pendientes > 0 ? "error" : "ok",
                pie: devoluciones.enCamino > 0 ? `${devoluciones.enCamino} de vuelta` : undefined,
              },
              { etiqueta: "Facturado",    valor: `${facturado.toFixed(0)} €`, tono: "marca", pie: "sin contar cancelados" },
            ]
          : undefined
      }
    >
      {error && <Aviso>{error}</Aviso>}

      {/* El aviso vive en la pantalla de pedidos a propósito: quien entra aquí
          viene a preparar envíos, y una devolución sin resolver es justo lo
          que no vería nunca si hubiera que acordarse de cambiar de pestaña. */}
      {enPedidos && devoluciones.pendientes > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          background: C.errorSuave, border: "1px solid #FBD5D5", borderRadius: R.medio,
          padding: "13px 15px", marginBottom: 16,
        }}>
          <RotateCcw size={16} color={C.error} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 200, fontSize: T.dato, color: C.error, lineHeight: 1.55 }}>
            {devoluciones.sinResolver > 0 && (
              <><strong>{devoluciones.sinResolver} devolución{devoluciones.sinResolver !== 1 ? "es" : ""} sin resolver</strong>
              {devoluciones.recibidas > 0 ? " y " : ". "}</>
            )}
            {devoluciones.recibidas > 0 && (
              <><strong>{devoluciones.recibidas} paquete{devoluciones.recibidas !== 1 ? "s" : ""} ya de vuelta</strong> esperando reembolso. </>
            )}
            {devoluciones.sinResolver > 0 && devoluciones.recibidas === 0 && "El comprador está esperando respuesta."}
          </span>
          <button type="button" onClick={() => setVista("devoluciones")} style={btnPrimario}>
            Resolverlas
          </button>
        </div>
      )}

      {!enPedidos ? (
        devoluciones.lista === null
          ? <Esqueleto filas={3} />
          : <ListaDevoluciones lista={devoluciones.lista} onCambio={devoluciones.cargar} />
      ) : pedidos === null ? (
        <Esqueleto filas={4} />
      ) : (
        <>
          {lista.length > 0 && (
            <Barra>
              <Buscador valor={busqueda} onCambio={setBusqueda} marcador="Buscar por nº, comprador o seguimiento…" />
              <Segmentos<Filtro>
                valor={filtro}
                onCambio={setFiltro}
                opciones={[
                  { valor: "todos",      texto: "Todos",      cuenta: lista.length },
                  { valor: "pendientes", texto: "Por enviar", cuenta: pendientes.length },
                  { valor: "curso",      texto: "En tránsito",cuenta: enCurso.length },
                ]}
              />
              <Recuento>{visibles.length} de {lista.length}</Recuento>
            </Barra>
          )}

          {visibles.length === 0 ? (
            <Vacio
              icono={<Package size={24} />}
              titulo={lista.length === 0 ? "Todavía no hay pedidos" : "Ningún pedido coincide"}
              texto={
                lista.length === 0
                  ? "Cuando alguien compre un producto de la tienda, aparecerá aquí."
                  : "Prueba con otro término o cambia el filtro."
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibles.map(pedido => {
                const est   = ESTADO[pedido.estado] ?? { texto: pedido.estado, tono: "neutro" as Tono };
                const items = pedido.items ?? [];
                const desplegado = abierto === pedido.id;

                return (
                  <Fila
                    key={pedido.id}
                    // Un pedido sin preparar tiene que distinguirse de un vistazo.
                    destacada={pedido.estado === "activa"}
                    desplegado={desplegado ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                          <p style={seccionTitulo}>Contenido</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {items.map((item, i) => (
                              <div key={`${pedido.id}-${i}`} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <Miniatura tamano={40}>
                                  <Image fill sizes="40px" src={primeraImagen(item.imagen)} alt={item.nombre} style={{ objectFit: "contain", padding: 3 }} unoptimized />
                                </Miniatura>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: T.dato, fontWeight: 600, color: C.texto }}>{item.nombre}</div>
                                  <div style={{ fontSize: T.micro, color: C.tenue }}>Cantidad: {item.cantidad}</div>
                                </div>
                                <span style={{ fontSize: T.dato, fontWeight: 700, color: C.texto, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                                  {importe(item.importe)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p style={seccionTitulo}>Comprador</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {pedido.direccion_envio && (
                              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: T.dato, color: C.texto }}>
                                <MapPin size={14} color={C.marca} style={{ flexShrink: 0, marginTop: 2 }} />
                                <span>{pedido.direccion_envio}</span>
                              </div>
                            )}
                            {pedido.comprador_email && (
                              <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: T.dato }}>
                                <Mail size={14} color={C.marca} style={{ flexShrink: 0 }} />
                                <a href={`mailto:${pedido.comprador_email}`} style={{ color: C.marca }}>
                                  {pedido.comprador_email}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <BloqueEnvio pedido={pedido} onCambio={cargar} />
                      </div>
                    ) : undefined}
                  >
                    <FilaPrincipal
                      titulo={`Pedido #${pedido.id}`}
                      meta={[fecha(pedido.creado_en), pedido.comprador].filter(Boolean).join(" · ")}
                    >
                      <span style={distintivo(est.tono)}>{est.texto}</span>
                      {pedido.devolucion_estado && (
                        <span style={distintivo((DEVOLUCION[pedido.devolucion_estado] ?? { tono: "error" as Tono }).tono)}>
                          <RotateCcw size={11} />
                          {DEVOLUCION[pedido.devolucion_estado]?.texto ?? "Devolución"}
                        </span>
                      )}
                      {pedido.seguimiento && (
                        <span style={distintivo("neutro")}><Truck size={11} /> {pedido.transportista ?? "En camino"}</span>
                      )}
                    </FilaPrincipal>

                    <FilaDato
                      valor={importe(pedido.precio_total)}
                      etiqueta={`${items.length} artículo${items.length !== 1 ? "s" : ""}`}
                      color={C.accion}
                    />

                    <FilaAcciones>
                      <BotonIcono
                        titulo={desplegado ? "Ocultar detalle" : "Ver detalle y envío"}
                        onClick={() => setAbierto(desplegado ? null : pedido.id)}
                      >
                        {desplegado ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </BotonIcono>
                    </FilaAcciones>
                  </Fila>
                );
              })}
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
