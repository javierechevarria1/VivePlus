"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Package, ShieldCheck, RefreshCcw, Boxes } from "lucide-react";
import { marketplaceService } from "@/frontend/src/services/marketplaceService";
import { AdminShell, type Kpi } from "@/frontend/src/components/admin/AdminShell";
import { C, T, R, carta, type Tono } from "@/frontend/src/components/admin/ui";
import { Esqueleto } from "@/frontend/src/components/admin/primitives";

type Pedido = {
  id: number;
  precio_total: string | number;
  estado: string;
  creado_en: string | null;
  comprador: string;
  sendcloud_id: string | null;
  items: { nombre: string }[] | null;
};

type Cuidador = { id: number; nombre: string; especialidad: string; docs_estado: string };

type Devolucion = {
  id: number;
  orden_id: number | null;
  venta_id: number | null;
  estado: string;
  producto: string | null;
  solicitante: string | null;
  creado_en: string;
  importe_solicitado: string | number | null;
};

type Producto = { id: number; nombre: string; categoria: string; precio: string; stock: number };

// Una tarea es cualquier cosa que tiene a alguien esperando. Se construyen
// desde los mismos datos que ya sirven las secciones, para que el inicio no
// pueda contar una historia distinta a la de la página a la que lleva.
type Tarea = {
  clave: string;
  inicial: string;
  tono: Tono;
  titulo: string;
  detalle: string;
  desde: number;
  href: string;
  accion: string;
};

const DIA = 86_400_000;

const euros = (v: number) => `${v.toFixed(2).replace(".", ",")} €`;

function hace(ms: number): string {
  if (!Number.isFinite(ms)) return "";
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `hace ${Math.max(1, min)} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "ayer" : `hace ${dias} d`;
}

function saludo(reloj: number): string {
  const h = new Date(reloj).getHours();
  if (h < 6)  return "Buenas noches";
  if (h < 14) return "Buenos días";
  if (h < 21) return "Buenas tardes";
  return "Buenas noches";
}

const hoyLargo = (reloj: number) =>
  new Date(reloj).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

const TONO_FONDO: Record<Tono, { bg: string; fg: string }> = {
  neutro: { bg: "#F1F5F9", fg: C.suave },
  marca:  { bg: C.marcaSuave, fg: C.marca },
  ok:     { bg: C.okSuave, fg: C.ok },
  aviso:  { bg: C.avisoSuave, fg: C.aviso },
  error:  { bg: C.errorSuave, fg: C.error },
  info:   { bg: C.infoSuave, fg: C.info },
};

function Panel({ titulo, subtitulo, extra, children }: {
  titulo: string;
  subtitulo?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ ...carta, borderRadius: 18, overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        padding: "16px 18px 12px", borderBottom: `1px solid ${C.bordeTenue}`,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.texto }}>{titulo}</h2>
          {subtitulo && <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.tenue }}>{subtitulo}</p>}
        </div>
        {extra}
      </div>
      {children}
    </section>
  );
}

function VentasSemana({ pedidos }: { pedidos: Pedido[] }) {
  // Siete cubos, uno por día, contando desde hoy hacia atrás.
  const dias = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    // Una sola pasada por los pedidos: antes se recorría la lista entera una vez
    // por cada uno de los siete días, re-parseando la misma fecha en cada vuelta.
    const totalPorDia = new Map<number, number>();
    for (const p of pedidos) {
      if (p.estado === "cancelada" || !p.creado_en) continue;
      const f = new Date(p.creado_en as string);
      f.setHours(0, 0, 0, 0);
      totalPorDia.set(f.getTime(), (totalPorDia.get(f.getTime()) ?? 0) + Number(p.precio_total));
    }
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoy.getTime() - (6 - i) * DIA);
      return { fecha: d.getTime(), letra: d.toLocaleDateString("es-ES", { weekday: "narrow" }).toUpperCase(), total: totalPorDia.get(d.getTime()) ?? 0 };
    });
  }, [pedidos]);

  const techo = Math.max(...dias.map(d => d.total), 1);
  const suma  = dias.reduce((s, d) => s + d.total, 0);
  const conVenta = dias.filter(d => d.total > 0).length;

  return (
    <section style={{ ...carta, borderRadius: 18, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.texto }}>Ventas de la semana</h2>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.texto, fontVariantNumeric: "tabular-nums" }}>
          {euros(suma)}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 112 }}>
        {dias.map(d => (
          <div key={d.fecha} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
            <div
              title={`${d.letra}: ${euros(d.total)}`}
              style={{
                width: "100%",
                // Un día sin ventas deja un tocón visible: si la barra
                // desapareciera del todo parecería un fallo de carga.
                height: `${d.total > 0 ? Math.max(8, (d.total / techo) * 100) : 3}%`,
                borderRadius: "7px 7px 3px 3px",
                background: d.total > 0
                  ? "linear-gradient(180deg, #C4B5FD, #EDE9FE)"
                  : C.bordeTenue,
              }}
            />
            <span style={{ fontSize: 11, color: C.tenue }}>{d.letra}</span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 14, paddingTop: 13, borderTop: `1px solid ${C.bordeTenue}`,
        display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.suave,
      }}>
        <span>Ticket medio</span>
        <strong style={{ color: C.texto, fontVariantNumeric: "tabular-nums" }}>
          {conVenta > 0 ? euros(suma / Math.max(1, dias.filter(d => d.total > 0).length)) : "—"}
        </strong>
      </div>
    </section>
  );
}

export default function AdminInicioPage() {
  const [pedidos,      setPedidos]      = useState<Pedido[] | null>(null);
  const [cuidadores,   setCuidadores]   = useState<Cuidador[]>([]);
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [productos,    setProductos]    = useState<Producto[]>([]);
  // La hora se toma al llegar los datos, no durante el render: leer el reloj
  // mientras se pinta da resultados distintos en cada pasada y no coincide con
  // lo que renderizó el servidor.
  const [reloj,        setReloj]        = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin-pedidos")
      .then(r => r.json())
      .then(d => { setPedidos(d.ok ? (d.data ?? []) : []); setReloj(Date.now()); })
      .catch(() => { setPedidos([]); setReloj(Date.now()); });

    fetch("/api/admin-cuidadores")
      .then(r => r.json())
      .then(d => setCuidadores(d.cuidadores ?? []))
      .catch(() => {});

    fetch("/api/devoluciones")
      .then(r => r.json())
      .then(d => setDevoluciones(d.ok ? (d.data ?? []) : []))
      .catch(() => {});

    marketplaceService.getProductos()
      .then(d => setProductos(d as unknown as Producto[]))
      .catch(() => {});
  }, []);

  const lista       = pedidos ?? [];
  const porPreparar = lista.filter(p => p.estado === "activa");
  const enRevision  = cuidadores.filter(c => c.docs_estado === "en_revision");
  const sinResolver = devoluciones.filter(d => d.estado === "solicitada");
  const stockBajo   = productos.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock);

  const ahora = reloj ?? 0;

  const primeroDelMes = new Date(ahora);
  primeroDelMes.setDate(1);
  primeroDelMes.setHours(0, 0, 0, 0);
  const inicioMes = primeroDelMes.getTime();

  const ingresosMes = lista
    .filter(p => p.estado !== "cancelada" && p.creado_en && new Date(p.creado_en).getTime() >= inicioMes)
    .reduce((s, p) => s + Number(p.precio_total), 0);

  // Un pedido que lleva más de un día pagado y sin etiqueta ya es un problema.
  const atrasados = porPreparar.filter(
    p => p.creado_en && ahora - new Date(p.creado_en).getTime() > DIA && !p.sendcloud_id
  ).length;

  // Sin useMemo a propósito: el compilador de React memoiza esto por su cuenta
  // y hacerlo a mano sobre listas que se recalculan en cada render le impedía
  // optimizar el componente entero.
  const tareas: Tarea[] = (() => {
    const t: Tarea[] = [];

    porPreparar.forEach(p => t.push({
      clave: `p-${p.id}`,
      inicial: "P",
      tono: "aviso",
      titulo: `Pedido #${p.id} sin preparar`,
      detalle: [p.comprador, p.sendcloud_id ? "con etiqueta" : "sin etiqueta"].filter(Boolean).join(" · "),
      desde: p.creado_en ? new Date(p.creado_en).getTime() : ahora,
      href: "/admin-pedidos",
      accion: "Preparar",
    }));

    enRevision.forEach(c => t.push({
      clave: `c-${c.id}`,
      inicial: "C",
      tono: "info",
      titulo: `${c.nombre} espera verificación`,
      detalle: c.especialidad || "Documentación enviada",
      desde: ahora,
      href: "/admin-cuidadores",
      accion: "Revisar",
    }));

    sinResolver.forEach(d => t.push({
      clave: `d-${d.id}`,
      inicial: "D",
      tono: "error",
      titulo: `Devolución de ${d.orden_id ? `pedido #${d.orden_id}` : `venta #${d.venta_id}`}`,
      detalle: [d.producto, d.solicitante].filter(Boolean).join(" · ") || "Pendiente de resolver",
      desde: new Date(d.creado_en).getTime(),
      href: "/admin-pedidos",
      accion: "Resolver",
    }));

    productos.filter(p => p.stock <= 0).forEach(p => t.push({
      clave: `s-${p.id}`,
      inicial: "S",
      tono: "neutro",
      titulo: `${p.nombre} está agotado`,
      detalle: "Sigue publicado en la tienda pero no se puede comprar",
      desde: ahora,
      href: "/admin-marketplace",
      accion: "Reponer",
    }));

    // Lo más antiguo primero: es lo que lleva más tiempo bloqueando a alguien.
    return t.sort((a, b) => a.desde - b.desde);
  })();

  const kpis: Kpi[] = [
    {
      etiqueta: "Pedidos por preparar",
      valor: porPreparar.length,
      tono: porPreparar.length > 0 ? "aviso" : "ok",
      marca: atrasados > 0 ? { texto: "Urgente", tono: "aviso" } : undefined,
      pie: atrasados > 0 ? `${atrasados} llevan más de 24 h` : "Nada atrasado",
    },
    {
      etiqueta: "Cuidadores en revisión",
      valor: enRevision.length,
      tono: enRevision.length > 0 ? "info" : undefined,
      pie: `${cuidadores.length} registrados en total`,
    },
    {
      etiqueta: "Devoluciones abiertas",
      valor: sinResolver.length,
      tono: sinResolver.length > 0 ? "error" : "ok",
      pie: sinResolver.length === 0 ? "Todas resueltas" : "Esperan tu respuesta",
    },
    {
      etiqueta: "Ingresos del mes",
      valor: euros(ingresosMes),
      tono: "marca",
      pie: "Tienda, sin contar cancelados",
    },
  ];

  const resumen = [
    porPreparar.length > 0 ? `${porPreparar.length} pedido${porPreparar.length !== 1 ? "s" : ""} por preparar` : null,
    enRevision.length > 0 ? `${enRevision.length} cuidador${enRevision.length !== 1 ? "es" : ""} esperando revisión` : null,
    sinResolver.length > 0 ? `${sinResolver.length} devolución${sinResolver.length !== 1 ? "es" : ""} abierta${sinResolver.length !== 1 ? "s" : ""}` : null,
  ].filter(Boolean);

  return (
    <AdminShell
      serif
      titulo={reloj === null ? "Panel de administración" : saludo(reloj)}
      descripcion={
        reloj === null ? null : (
          <>
            {hoyLargo(reloj).replace(/^\w/, c => c.toUpperCase())}
            {resumen.length > 0 ? ` · ${resumen.join(" y ")}.` : " · no hay nada pendiente."}
          </>
        )
      }
      acciones={
        porPreparar.length > 0 ? (
          <Link
            href="/admin-pedidos"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: `linear-gradient(135deg, ${C.marca}, ${C.accion})`,
              color: "#fff", border: "none", borderRadius: 11,
              padding: "11px 17px", fontSize: 13.5, fontWeight: 700,
              textDecoration: "none", boxShadow: "0 6px 18px rgba(124,58,237,0.22)",
            }}
          >
            Preparar envíos de hoy <ArrowRight size={15} />
          </Link>
        ) : null
      }
      kpis={kpis}
      enlacePublico={{ href: "/", texto: "Ver el sitio" }}
    >
      {pedidos === null ? (
        <Esqueleto filas={4} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "start" }}>

          <Panel
            titulo="Requiere tu atención"
            subtitulo="Ordenado por lo que lleva más tiempo bloqueando a alguien"
            extra={
              tareas.length > 0 ? (
                <span style={{
                  fontSize: 11.5, fontWeight: 700, color: C.aviso,
                  background: C.avisoSuave, borderRadius: R.pildora, padding: "3px 10px", whiteSpace: "nowrap",
                }}>
                  {tareas.length} abierta{tareas.length !== 1 ? "s" : ""}
                </span>
              ) : null
            }
          >
            {tareas.length === 0 ? (
              <div style={{ padding: "36px 18px", textAlign: "center" }}>
                <div style={{
                  width: 46, height: 46, borderRadius: R.pildora, background: C.okSuave, color: C.ok,
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
                }}>
                  <ShieldCheck size={21} />
                </div>
                <p style={{ margin: 0, fontSize: T.dato, fontWeight: 700, color: C.texto }}>Todo al día</p>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, color: C.tenue }}>
                  No hay pedidos, verificaciones ni devoluciones esperando.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", maxHeight: 420, overflowY: "auto" }}>
                {tareas.slice(0, 12).map(t => {
                  const c = TONO_FONDO[t.tono];
                  return (
                    <div key={t.clave} style={{
                      display: "flex", gap: 12, alignItems: "flex-start",
                      padding: "14px 18px", borderBottom: `1px solid ${C.bordeTenue}`,
                    }}>
                      <span style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, background: c.bg, color: c.fg,
                      }}>
                        {t.inicial}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.texto, marginBottom: 2 }}>{t.titulo}</div>
                        <div style={{ fontSize: 12.5, color: C.suave, lineHeight: 1.45 }}>{t.detalle}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 11.5, color: C.tenue, whiteSpace: "nowrap" }}>
                          {hace(ahora - t.desde)}
                        </span>
                        <Link href={t.href} style={{
                          background: C.marcaSuave, border: `1px solid ${C.borde}`, borderRadius: 9,
                          padding: "6px 11px", fontSize: 12.5, fontWeight: 700,
                          color: C.marca, textDecoration: "none", whiteSpace: "nowrap",
                        }}>
                          {t.accion}
                        </Link>
                      </div>
                    </div>
                  );
                })}
                {tareas.length > 12 && (
                  <div style={{ padding: "12px 18px", fontSize: 12.5, color: C.tenue }}>
                    y {tareas.length - 12} más.
                  </div>
                )}
              </div>
            )}
          </Panel>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <VentasSemana pedidos={lista} />

            <section style={{ ...carta, borderRadius: 18, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.texto }}>Stock bajo</h2>
                <Link href="/admin-marketplace" style={{ fontSize: 12.5, fontWeight: 600, color: C.marca, textDecoration: "none" }}>
                  Ver catálogo
                </Link>
              </div>

              {stockBajo.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12.5, color: C.tenue, display: "flex", alignItems: "center", gap: 7 }}>
                  <Boxes size={14} /> Ningún producto por debajo de 5 unidades.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {stockBajo.slice(0, 5).map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <span style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: C.lienzo, border: `1px solid ${C.bordeTenue}`,
                        display: "flex", alignItems: "center", justifyContent: "center", color: C.tenue,
                      }}>
                        <Package size={15} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.texto, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.nombre}
                        </div>
                        <div style={{ fontSize: 11.5, color: C.tenue }}>{p.categoria || "Sin categoría"}</div>
                      </div>
                      <span style={{
                        fontSize: 11.5, fontWeight: 700, borderRadius: R.pildora, padding: "2px 9px", whiteSpace: "nowrap",
                        background: p.stock <= 0 ? C.errorSuave : C.avisoSuave,
                        color:      p.stock <= 0 ? C.error      : C.aviso,
                      }}>
                        {p.stock <= 0 ? "Sin stock" : `${p.stock} uds`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {sinResolver.length > 0 && (
              <Link href="/admin-pedidos" style={{ textDecoration: "none" }}>
                <section style={{ ...carta, borderRadius: 18, padding: "16px 18px", borderColor: "#FBD5D5" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <span style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: C.errorSuave, color: C.error,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <RefreshCcw size={16} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.texto }}>
                        {sinResolver.length} devolución{sinResolver.length !== 1 ? "es" : ""} sin resolver
                      </div>
                      <div style={{ fontSize: 12, color: C.suave }}>
                        Cada día que pasa es dinero retenido al comprador
                      </div>
                    </div>
                    <ArrowRight size={15} color={C.tenue} />
                  </div>
                </section>
              </Link>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
