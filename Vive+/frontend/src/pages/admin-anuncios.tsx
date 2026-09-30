"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Check, ArrowUpRight, Eye, EyeOff, Megaphone } from "lucide-react";
import { anunciosService, type Anuncio } from "@/frontend/src/services/anunciosService";
import { AdminShell } from "@/frontend/src/components/admin/AdminShell";
import {
  C, T, R, carta, campo, distintivo, rejillaCampos,
  btnPrimario, btnSecundario,
} from "@/frontend/src/components/admin/ui";
import {
  Aviso, Barra, BotonIcono, Buscador, Campo, Confirmar, Esqueleto,
  Fila, FilaAcciones, FilaPrincipal, Recuento, Segmentos, Vacio, useConfirmacion,
} from "@/frontend/src/components/admin/primitives";

const UBICACIONES = [
  { value: "home",           label: "Página principal" },
  { value: "productos",      label: "Marketplace" },
  { value: "actividades",    label: "Actividades / Recursos" },
  { value: "organizaciones", label: "Organizaciones" },
];

const etiquetaUbicacion = (val: string) => UBICACIONES.find(u => u.value === val)?.label || val;

const ctr = (a: Anuncio) => (a.impresiones ? ((a.clics || 0) / a.impresiones) * 100 : 0);

type Filtro = "todos" | "activos" | "inactivos";

// Las tres cifras de un anuncio se leen juntas o no se leen: van en un bloque
// propio con la misma anchura en todas las filas para poder compararlas en
// vertical de un vistazo.
function Metricas({ a }: { a: Anuncio }) {
  const datos = [
    { valor: (a.impresiones || 0).toLocaleString("es-ES"), pie: "Vistas",  color: C.texto },
    { valor: (a.clics || 0).toLocaleString("es-ES"),       pie: "Clics",   color: C.accion },
    { valor: `${ctr(a).toFixed(1)}%`,                      pie: "CTR",     color: C.marca },
  ];
  return (
    <div className="adm-metricas" style={{ display: "flex", gap: 22, flexShrink: 0 }}>
      {datos.map(d => (
        <div key={d.pie} style={{ textAlign: "right", minWidth: 52 }}>
          <div style={{ fontSize: T.cuerpo, fontWeight: 700, color: d.color, fontVariantNumeric: "tabular-nums" }}>
            {d.valor}
          </div>
          <div style={{ fontSize: T.micro, color: C.tenue, marginTop: 1 }}>{d.pie}</div>
        </div>
      ))}
    </div>
  );
}

function AnuncioForm({ initial, onSave, onCancel, saving, titulo }: {
  initial?: Anuncio;
  onSave: (d: Omit<Anuncio, "id">) => void;
  onCancel: () => void;
  saving: boolean;
  titulo: string;
}) {
  const [data, setData] = useState({
    empresa:     initial?.empresa || "",
    imagen:      initial?.imagen || "",
    url_destino: initial?.url_destino || "",
    ubicacion:   initial?.ubicacion || "home",
    activo:      initial?.activo ?? true,
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(data as Omit<Anuncio, "id">); }}
      style={{ ...carta, padding: 20, display: "flex", flexDirection: "column", gap: 18, marginBottom: 16 }}
    >
      <h2 style={{ margin: 0, fontSize: T.seccion, fontWeight: 700, color: C.texto }}>{titulo}</h2>

      <div style={rejillaCampos}>
        <Campo id="aa-empresa" titulo="Empresa anunciante *">
          <input id="aa-empresa" required value={data.empresa} onChange={e => setData(p => ({ ...p, empresa: e.target.value }))} style={campo} placeholder="Nombre de la empresa" />
        </Campo>

        <Campo id="aa-ubicacion" titulo="Dónde se muestra *">
          <select id="aa-ubicacion" aria-label="Dónde se muestra" value={data.ubicacion} onChange={e => setData(p => ({ ...p, ubicacion: e.target.value }))} style={campo}>
            {UBICACIONES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </Campo>

        <Campo id="aa-imagen" titulo="URL del banner *" ancho pista="Imagen apaisada; se recorta a 3:2 en la tarjeta.">
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <input id="aa-imagen" type="url" required value={data.imagen} onChange={e => setData(p => ({ ...p, imagen: e.target.value }))} style={{ ...campo, flex: 1 }} placeholder="https://…" />
            {data.imagen && (
              <div style={{ width: 84, height: 56, borderRadius: R.chico, overflow: "hidden", border: `1px solid ${C.borde}`, flexShrink: 0, position: "relative", background: C.lienzo }}>
                <Image fill sizes="84px" src={data.imagen} alt="" style={{ objectFit: "cover" }} unoptimized />
              </div>
            )}
          </div>
        </Campo>

        <Campo id="aa-destino" titulo="Enlace de destino *" ancho>
          <input id="aa-destino" type="url" required value={data.url_destino} onChange={e => setData(p => ({ ...p, url_destino: e.target.value }))} style={campo} placeholder="https://…" />
        </Campo>
      </div>

      <label style={{
        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
        background: C.velo, border: `1px solid ${C.bordeTenue}`, borderRadius: R.chico, padding: "11px 14px",
      }}>
        <input
          type="checkbox"
          checked={data.activo}
          onChange={e => setData(p => ({ ...p, activo: e.target.checked }))}
          style={{ width: 17, height: 17, accentColor: C.marca }}
        />
        <span style={{ fontSize: T.dato, color: C.texto }}>
          <strong>Anuncio activo</strong>
          <span style={{ color: C.suave }}> — visible para los usuarios en {etiquetaUbicacion(data.ubicacion).toLowerCase()}</span>
        </span>
      </label>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${C.bordeTenue}`, paddingTop: 16 }}>
        <button type="button" onClick={onCancel} style={btnSecundario}>Cancelar</button>
        <button type="submit" disabled={saving} style={{ ...btnPrimario, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Guardando…" : <><Check size={14} /> Guardar anuncio</>}
        </button>
      </div>
    </form>
  );
}

export default function AdminAnunciosPage() {
  const [anuncios,   setAnuncios]   = useState<Anuncio[]>([]);
  const [cargando,   setCargando]   = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [creando,    setCreando]    = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [guardando,  setGuardando]  = useState(false);
  const [busqueda,   setBusqueda]   = useState("");
  const [filtro,     setFiltro]     = useState<Filtro>("todos");

  const borrado = useConfirmacion<Anuncio>();

  useEffect(() => { void fetchAnuncios(); }, []);

  const fetchAnuncios = async () => {
    try {
      const data = await anunciosService.getAnunciosAdmin();
      setAnuncios(data);
    } catch {
      setError("Error cargando los anuncios");
    } finally {
      setCargando(false);
    }
  };

  const handleCreate = async (data: Omit<Anuncio, "id">) => {
    setGuardando(true);
    try {
      await anunciosService.crearAnuncio(data);
      await fetchAnuncios();
      setCreando(false);
      setError(null);
    } catch {
      setError("Error al crear el anuncio");
    } finally {
      setGuardando(false);
    }
  };

  const handleUpdate = async (id: number, data: Partial<Anuncio>) => {
    setGuardando(true);
    try {
      await anunciosService.actualizarAnuncio(id, data);
      await fetchAnuncios();
      setEditandoId(null);
      setError(null);
    } catch {
      setError("Error al actualizar el anuncio");
    } finally {
      setGuardando(false);
    }
  };

  const activos     = anuncios.filter(a => a.activo);
  const impresiones = anuncios.reduce((s, a) => s + (a.impresiones || 0), 0);
  const clics       = anuncios.reduce((s, a) => s + (a.clics || 0), 0);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return anuncios
      .filter(a => filtro === "todos" || (filtro === "activos" ? a.activo : !a.activo))
      .filter(a =>
        !texto ||
        a.empresa.toLowerCase().includes(texto) ||
        etiquetaUbicacion(a.ubicacion).toLowerCase().includes(texto)
      );
  }, [anuncios, filtro, busqueda]);

  return (
    <AdminShell
      titulo="Anuncios"
      descripcion="Banners de patrocinadores, dónde se muestran y qué rendimiento tienen."
      acciones={
        !creando ? (
          <button type="button" onClick={() => { setCreando(true); setEditandoId(null); }} style={btnPrimario}>
            <Plus size={14} /> Nuevo anuncio
          </button>
        ) : null
      }
      enlacePublico={{ href: "/", texto: "Ver home" }}
      kpis={[
        { etiqueta: "Activos",     valor: activos.length, tono: activos.length > 0 ? "ok" : "aviso", pie: `de ${anuncios.length} en total` },
        { etiqueta: "Impresiones", valor: impresiones.toLocaleString("es-ES") },
        { etiqueta: "Clics",       valor: clics.toLocaleString("es-ES") },
        { etiqueta: "CTR medio",   valor: `${(impresiones ? (clics / impresiones) * 100 : 0).toFixed(1)}%`, tono: "marca" },
      ]}
    >
      {borrado.pendiente && (
        <Confirmar
          titulo="Eliminar anuncio"
          mensaje={<>Se eliminará el anuncio de <strong style={{ color: C.texto }}>{borrado.pendiente.empresa}</strong> y sus estadísticas. Esta acción no se puede deshacer.</>}
          ocupado={borrado.ocupado}
          onCancelar={borrado.cancelar}
          onConfirmar={() => borrado.ejecutar(async a => {
            try {
              await anunciosService.eliminarAnuncio(a.id!);
              await fetchAnuncios();
            } catch {
              setError("Error al eliminar el anuncio");
            }
          })}
        />
      )}

      {error && <Aviso>{error}</Aviso>}

      {creando && (
        <AnuncioForm
          titulo="Nuevo anuncio"
          onSave={handleCreate}
          onCancel={() => setCreando(false)}
          saving={guardando}
        />
      )}

      {cargando ? (
        <Esqueleto filas={3} />
      ) : (
        <>
          {anuncios.length > 0 && (
            <Barra>
              <Buscador valor={busqueda} onCambio={setBusqueda} marcador="Buscar por empresa o ubicación…" />
              <Segmentos<Filtro>
                valor={filtro}
                onCambio={setFiltro}
                opciones={[
                  { valor: "todos",     texto: "Todos",     cuenta: anuncios.length },
                  { valor: "activos",   texto: "Activos",   cuenta: activos.length },
                  { valor: "inactivos", texto: "Inactivos", cuenta: anuncios.length - activos.length },
                ]}
              />
              <Recuento>{visibles.length} de {anuncios.length}</Recuento>
            </Barra>
          )}

          {visibles.length === 0 ? (
            <Vacio
              icono={<Megaphone size={24} />}
              titulo={anuncios.length === 0 ? "Todavía no hay anuncios" : "Ningún anuncio coincide"}
              texto={anuncios.length === 0 ? "Crea el primer banner para empezar a mostrar publicidad." : "Prueba con otro término o cambia el filtro."}
              accion={anuncios.length === 0 ? (
                <button type="button" onClick={() => setCreando(true)} style={btnPrimario}>
                  <Plus size={14} /> Crear el primero
                </button>
              ) : null}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibles.map(anuncio => {
                const editando = editandoId === anuncio.id;
                return (
                  <Fila
                    key={anuncio.id}
                    atenuada={!anuncio.activo && !editando}
                    desplegado={editando ? (
                      <AnuncioForm
                        titulo="Editar anuncio"
                        initial={anuncio}
                        onSave={(data) => handleUpdate(anuncio.id!, data)}
                        onCancel={() => setEditandoId(null)}
                        saving={guardando}
                      />
                    ) : undefined}
                  >
                    <div style={{
                      width: 96, height: 60, borderRadius: R.chico, overflow: "hidden",
                      background: C.lienzo, border: `1px solid ${C.bordeTenue}`,
                      flexShrink: 0, position: "relative",
                    }}>
                      <Image fill sizes="96px" src={anuncio.imagen} alt={anuncio.empresa} style={{ objectFit: "cover" }} unoptimized />
                    </div>

                    <FilaPrincipal
                      titulo={anuncio.empresa}
                      meta={
                        <a href={anuncio.url_destino} target="_blank" rel="noreferrer" style={{ color: C.suave, textDecoration: "none" }}>
                          {anuncio.url_destino} <ArrowUpRight size={11} style={{ verticalAlign: "-1px" }} />
                        </a>
                      }
                    >
                      <span style={distintivo("marca")}>{etiquetaUbicacion(anuncio.ubicacion)}</span>
                      {!anuncio.activo && <span style={distintivo("neutro")}><EyeOff size={11} /> Inactivo</span>}
                    </FilaPrincipal>

                    <Metricas a={anuncio} />

                    <FilaAcciones>
                      <BotonIcono
                        titulo={anuncio.activo ? "Desactivar anuncio" : "Activar anuncio"}
                        onClick={() => handleUpdate(anuncio.id!, { ...anuncio, activo: !anuncio.activo })}
                      >
                        {anuncio.activo ? <Eye size={14} /> : <EyeOff size={14} />}
                      </BotonIcono>
                      <BotonIcono titulo="Editar anuncio" onClick={() => { setEditandoId(editando ? null : anuncio.id!); setCreando(false); }}>
                        <Pencil size={14} />
                      </BotonIcono>
                      <BotonIcono titulo="Eliminar anuncio" tono="peligro" onClick={() => borrado.pedir(anuncio)}>
                        <Trash2 size={14} />
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
