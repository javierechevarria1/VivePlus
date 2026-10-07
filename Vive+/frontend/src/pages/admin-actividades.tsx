"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Check, ChevronDown, ChevronUp, Eye, EyeOff, Calendar, MapPin, Clock, Settings2 } from "lucide-react";
import { CatPanel } from "@/frontend/src/components/admin-cat-panel";
import { actividadesService, type ActividadAdmin, type CatActividadDB } from "@/frontend/src/services/actividadesService";
import { AdminShell } from "@/frontend/src/components/admin/AdminShell";
import {
  C, T, R, carta, campo, distintivo, rejillaCampos,
  btnPrimario, btnSecundario, seccionTitulo,
} from "@/frontend/src/components/admin/ui";
import {
  Aviso, Barra, BotonIcono, Buscador, Campo, Confirmar, Esqueleto,
  Fila, FilaAcciones, FilaDato, FilaPrincipal, Recuento, Segmentos, Vacio, useConfirmacion,
} from "@/frontend/src/components/admin/primitives";

type Actividad = {
  id: number;
  nombre: string;
  descripcion: string;
  actividades_categoria_id: number | null;
  categoria: string;
  fecha: string;
  lugar: string;
  plazas_max: number;
  inscritos: number;
  url: string | null;
  url_lugar: string | null;
  activa: boolean;
  duracion_min: number | null;
  creado_en: string | null;
  imagen: string | null;
};

type FormData = {
  nombre: string;
  descripcion: string;
  actividades_categoria_id: number;
  fecha: string;
  lugar: string;
  plazas_max: string;
  duracion_min: string;
  url_lugar: string;
  url: string;
  activa: boolean;
  imagen: string;
};

const EMPTY_FORM: FormData = {
  nombre: "", descripcion: "", actividades_categoria_id: 0, fecha: "", lugar: "",
  plazas_max: "0", duracion_min: "", url_lugar: "", url: "", activa: true, imagen: "",
};

type Filtro = "todas" | "proximas" | "activas" | "ocultas";

function toLocalDatetime(isoStr: string): string {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatFecha(isoStr: string): string {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleDateString("es-ES", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

const esFutura = (iso: string) => !!iso && new Date(iso).getTime() > Date.now();

const toActividadBody = (form: FormData) => ({
  nombre: form.nombre, descripcion: form.descripcion,
  actividades_categoria_id: form.actividades_categoria_id || null,
  fecha: form.fecha, lugar: form.lugar, plazas_max: Number(form.plazas_max),
  duracion_min: form.duracion_min ? Number(form.duracion_min) : null,
  url_lugar: form.url_lugar || null, url: form.url || null, activa: form.activa,
  imagen: form.imagen || null,
});

const toFormData = (a: Actividad): FormData => ({
  nombre:                   a.nombre,
  descripcion:              a.descripcion,
  actividades_categoria_id: a.actividades_categoria_id ?? 0,
  fecha:                    toLocalDatetime(a.fecha),
  lugar:                    a.lugar,
  plazas_max:               String(a.plazas_max),
  duracion_min:             a.duracion_min != null ? String(a.duracion_min) : "",
  url_lugar:                a.url_lugar ?? "",
  url:                      a.url ?? "",
  activa:                   a.activa,
  imagen:                   a.imagen ?? "",
});

// Cuánto de lleno está el aforo, que es el dato por el que se decide si hay que
// abrir plazas o promocionar. Antes solo se veía el número crudo de inscritos.
function Aforo({ inscritos, max }: { inscritos: number; max: number }) {
  if (max <= 0) {
    return <FilaDato valor={inscritos} etiqueta="inscritos · sin límite" />;
  }
  const pct = Math.min(100, Math.round((inscritos / max) * 100));
  const color = pct >= 100 ? C.error : pct >= 80 ? C.aviso : C.ok;
  return (
    <div style={{ flexShrink: 0, textAlign: "right", minWidth: 108 }}>
      <div style={{ fontSize: T.cuerpo, fontWeight: 700, color: C.texto, fontVariantNumeric: "tabular-nums" }}>
        {inscritos} <span style={{ color: C.tenue, fontWeight: 600 }}>/ {max}</span>
      </div>
      <div style={{ height: 4, borderRadius: R.pildora, background: C.bordeTenue, margin: "6px 0 4px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: R.pildora }} />
      </div>
      <div style={{ fontSize: T.micro, color: C.tenue }}>
        {pct >= 100 ? "Completa" : `${max - inscritos} libres`}
      </div>
    </div>
  );
}

function ActividadForm({ initial, onSave, onCancel, saving, categorias, onCatUpdate, titulo }: {
  initial: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  saving: boolean;
  categorias: CatActividadDB[];
  onCatUpdate: () => void;
  titulo: string;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const [showCats, setShowCats] = useState(false);
  const set = (key: keyof FormData, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      style={{ ...carta, padding: 20, display: "flex", flexDirection: "column", gap: 18, marginBottom: 16 }}
    >
      <h2 style={{ margin: 0, fontSize: T.seccion, fontWeight: 700, color: C.texto }}>{titulo}</h2>

      <div>
        <p style={seccionTitulo}>Qué y cuándo</p>
        <div style={rejillaCampos}>
          <Campo id="act-nombre" titulo="Nombre *" ancho>
            <input id="act-nombre" required value={form.nombre} onChange={e => set("nombre", e.target.value)} style={campo} placeholder="Nombre de la actividad" />
          </Campo>

          <Campo id="act-categoria" titulo="Categoría">
            <div style={{ display: "flex", gap: 8 }}>
              <select id="act-categoria" aria-label="Categoría" value={form.actividades_categoria_id} onChange={e => set("actividades_categoria_id", Number(e.target.value))} style={{ ...campo, flex: 1 }}>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setShowCats(s => !s)}
                style={{ ...btnSecundario, padding: "0 12px", fontSize: T.micro, ...(showCats ? { background: C.marcaSuave, color: C.marca, borderColor: C.marcaBorde } : null) }}
              >
                <Settings2 size={13} /> {showCats ? "Cerrar" : "Gestionar"}
              </button>
            </div>
            {showCats && <CatPanel tipo="actividades" onUpdate={onCatUpdate} />}
          </Campo>

          <Campo id="act-fecha" titulo="Fecha y hora *">
            <input id="act-fecha" required aria-label="Fecha y hora" type="datetime-local" value={form.fecha} onChange={e => set("fecha", e.target.value)} style={campo} />
          </Campo>

          <Campo id="act-duracion" titulo="Duración (min)">
            <input id="act-duracion" type="number" min="0" value={form.duracion_min} onChange={e => set("duracion_min", e.target.value)} style={campo} placeholder="Ej: 90" />
          </Campo>

          <Campo id="act-plazas" titulo="Plazas máximas" pista="0 deja el aforo sin límite.">
            <input id="act-plazas" type="number" min="0" value={form.plazas_max} onChange={e => set("plazas_max", e.target.value)} style={campo} placeholder="0" />
          </Campo>

          <Campo id="act-descripcion" titulo="Descripción" ancho>
            <textarea id="act-descripcion" value={form.descripcion} onChange={e => set("descripcion", e.target.value)} rows={3} style={{ ...campo, resize: "vertical" }} placeholder="Descripción de la actividad" />
          </Campo>
        </div>
      </div>

      <div>
        <p style={seccionTitulo}>Lugar y enlaces</p>
        <div style={rejillaCampos}>
          <Campo id="act-lugar" titulo="Lugar">
            <input id="act-lugar" value={form.lugar} onChange={e => set("lugar", e.target.value)} style={campo} placeholder="Ej: Centro Cívico Sardinero" />
          </Campo>

          <Campo id="act-maps" titulo="Enlace a Google Maps">
            <input id="act-maps" value={form.url_lugar} onChange={e => set("url_lugar", e.target.value)} style={campo} placeholder="https://maps.google.com/…" />
          </Campo>

          <Campo id="act-url" titulo="Página de la actividad">
            <input id="act-url" value={form.url} onChange={e => set("url", e.target.value)} style={campo} placeholder="https://…" />
          </Campo>

          <Campo id="act-imagen" titulo="Imagen de la tarjeta" ancho pista="Si lo dejas vacío se usa la imagen de la categoría.">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <input id="act-imagen" value={form.imagen} onChange={e => set("imagen", e.target.value)} style={{ ...campo, flex: 1 }} placeholder="https://images.unsplash.com/…" />
              {form.imagen && (
                <div style={{ flexShrink: 0, width: 84, height: 56, borderRadius: R.chico, overflow: "hidden", border: `1px solid ${C.borde}`, position: "relative", background: C.lienzo }}>
                  <Image
                    src={form.imagen}
                    alt=""
                    fill
                    sizes="84px"
                    unoptimized
                    style={{ objectFit: "cover" }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </div>
          </Campo>
        </div>
      </div>

      <label style={{
        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
        background: C.velo, border: `1px solid ${C.bordeTenue}`, borderRadius: R.chico, padding: "11px 14px",
      }}>
        <input type="checkbox" checked={form.activa} onChange={e => set("activa", e.target.checked)} style={{ width: 17, height: 17, accentColor: C.marca }} />
        <span style={{ fontSize: T.dato, color: C.texto }}>
          <strong>Actividad publicada</strong>
          <span style={{ color: C.suave }}> — {form.activa ? "visible en la web y abierta a inscripciones" : "oculta para los usuarios"}</span>
        </span>
      </label>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${C.bordeTenue}`, paddingTop: 16 }}>
        <button type="button" onClick={onCancel} style={btnSecundario}>Cancelar</button>
        <button type="submit" disabled={saving} style={{ ...btnPrimario, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Guardando…" : <><Check size={14} /> Guardar</>}
        </button>
      </div>
    </form>
  );
}

export default function AdminActividadesPage() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [categorias,  setCategorias]  = useState<CatActividadDB[]>([]);
  const [cargando,    setCargando]    = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [creando,     setCreando]     = useState(false);
  const [editandoId,  setEditandoId]  = useState<number | null>(null);
  const [guardando,   setGuardando]   = useState(false);
  const [abiertoId,   setAbiertoId]   = useState<number | null>(null);
  const [busqueda,    setBusqueda]    = useState("");
  const [filtro,      setFiltro]      = useState<Filtro>("todas");

  const borrado = useConfirmacion<Actividad>();

  const fetchCategorias = () => {
    actividadesService.getCategoriasActividades()
      .then(cats => { if (cats.length > 0) setCategorias(cats); })
      .catch(() => {});
  };

  useEffect(() => { fetchCategorias(); }, []);

  const fetchActividades = async () => {
    try {
      const data = await actividadesService.getActividadesAdmin();
      setActividades(data);
    } catch {
      setError("Error cargando actividades");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { void fetchActividades(); }, []);

  const handleCreate = async (form: FormData) => {
    setGuardando(true);
    try {
      await actividadesService.crearActividad(toActividadBody(form));
      setCreando(false);
      setError(null);
      await fetchActividades();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear actividad");
    } finally {
      setGuardando(false);
    }
  };

  const handleEdit = async (form: FormData) => {
    if (editandoId == null) return;
    setGuardando(true);
    try {
      await actividadesService.editarActividad(editandoId, toActividadBody(form));
      setEditandoId(null);
      setError(null);
      await fetchActividades();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al editar actividad");
    } finally {
      setGuardando(false);
    }
  };

  const toggleActiva = async (a: ActividadAdmin) => {
    try {
      await actividadesService.toggleActivaActividad(a);
      await fetchActividades();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cambiar la visibilidad");
    }
  };

  const activas   = actividades.filter(a => a.activa);
  const proximas  = actividades.filter(a => a.activa && esFutura(a.fecha));
  const inscritos = actividades.reduce((s, a) => s + a.inscritos, 0);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return actividades
      .filter(a =>
        filtro === "todas"    ? true :
        filtro === "proximas" ? a.activa && esFutura(a.fecha) :
        filtro === "activas"  ? a.activa : !a.activa
      )
      .filter(a =>
        !texto ||
        a.nombre.toLowerCase().includes(texto) ||
        (a.lugar ?? "").toLowerCase().includes(texto) ||
        (a.categoria ?? "").toLowerCase().includes(texto)
      );
  }, [actividades, filtro, busqueda]);

  return (
    <AdminShell
      titulo="Actividades"
      descripcion="Agenda, aforo e inscripciones de las actividades presenciales."
      acciones={
        <button type="button" onClick={() => { setCreando(true); setEditandoId(null); }} style={btnPrimario}>
          <Plus size={14} /> Nueva actividad
        </button>
      }
      enlacePublico={{ href: "/recursos", texto: "Ver actividades" }}
      kpis={[
        { etiqueta: "Próximas",  valor: proximas.length, tono: proximas.length > 0 ? "ok" : "aviso", pie: "publicadas y por celebrar" },
        { etiqueta: "Activas",   valor: activas.length },
        { etiqueta: "Ocultas",   valor: actividades.length - activas.length },
        { etiqueta: "Inscritos", valor: inscritos, tono: "marca" },
      ]}
    >
      {borrado.pendiente && (
        <Confirmar
          titulo="Eliminar actividad"
          mensaje={<>Se eliminará <strong style={{ color: C.texto }}>{borrado.pendiente.nombre}</strong> y sus {borrado.pendiente.inscritos} inscripción{borrado.pendiente.inscritos !== 1 ? "es" : ""}. Esta acción no se puede deshacer.</>}
          ocupado={borrado.ocupado}
          onCancelar={borrado.cancelar}
          onConfirmar={() => borrado.ejecutar(async a => {
            try {
              await actividadesService.eliminarActividad(a.id);
              await fetchActividades();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Error al eliminar actividad");
            }
          })}
        />
      )}

      {error && <Aviso>{error}</Aviso>}

      {creando && (
        <ActividadForm
          titulo="Nueva actividad"
          initial={EMPTY_FORM}
          onSave={handleCreate}
          onCancel={() => setCreando(false)}
          saving={guardando}
          categorias={categorias}
          onCatUpdate={fetchCategorias}
        />
      )}

      {cargando ? (
        <Esqueleto filas={4} />
      ) : (
        <>
          {actividades.length > 0 && (
            <Barra>
              <Buscador valor={busqueda} onCambio={setBusqueda} marcador="Buscar por nombre, lugar o categoría…" />
              <Segmentos<Filtro>
                valor={filtro}
                onCambio={setFiltro}
                opciones={[
                  { valor: "todas",    texto: "Todas",    cuenta: actividades.length },
                  { valor: "proximas", texto: "Próximas", cuenta: proximas.length },
                  { valor: "ocultas",  texto: "Ocultas",  cuenta: actividades.length - activas.length },
                ]}
              />
              <Recuento>{visibles.length} de {actividades.length}</Recuento>
            </Barra>
          )}

          {visibles.length === 0 ? (
            <Vacio
              icono={<Calendar size={24} />}
              titulo={actividades.length === 0 ? "Todavía no hay actividades" : "Ninguna actividad coincide"}
              texto={actividades.length === 0 ? "Crea la primera actividad para que aparezca en la agenda." : "Prueba con otro término o cambia el filtro."}
              accion={actividades.length === 0 ? (
                <button type="button" onClick={() => setCreando(true)} style={btnPrimario}>
                  <Plus size={14} /> Crear la primera
                </button>
              ) : null}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibles.map((a) => {
                const editando = editandoId === a.id;
                const abierto  = abiertoId === a.id && !editando;
                const pasada   = !esFutura(a.fecha);

                return (
                  <Fila
                    key={a.id}
                    franja={a.activa ? C.marca : C.borde}
                    atenuada={!a.activa && !editando}
                    desplegado={
                      editando ? (
                        <ActividadForm
                          titulo="Editar actividad"
                          initial={toFormData(a)}
                          onSave={handleEdit}
                          onCancel={() => setEditandoId(null)}
                          saving={guardando}
                          categorias={categorias}
                          onCatUpdate={fetchCategorias}
                        />
                      ) : abierto ? (
                        <>
                          <p style={{ margin: "0 0 12px", fontSize: T.dato, color: C.texto, lineHeight: 1.6 }}>
                            {a.descripcion || <em style={{ color: C.tenue }}>Sin descripción</em>}
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", fontSize: T.micro, color: C.suave }}>
                            {a.duracion_min != null && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                                <Clock size={12} /> {a.duracion_min} min
                              </span>
                            )}
                            {a.url_lugar && (
                              <a href={a.url_lugar} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.marca }}>
                                <MapPin size={12} /> Ver en el mapa
                              </a>
                            )}
                            {a.url && (
                              <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: C.marca }}>
                                Página de la actividad
                              </a>
                            )}
                            {a.creado_en && (
                              <span style={{ color: C.tenue }}>Creada el {new Date(a.creado_en).toLocaleDateString("es-ES")}</span>
                            )}
                          </div>
                        </>
                      ) : undefined
                    }
                  >
                    <FilaPrincipal
                      titulo={a.nombre}
                      meta={
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <Calendar size={11} /> {formatFecha(a.fecha)}
                          <span style={{ color: C.borde }}>·</span>
                          <MapPin size={11} /> {a.lugar || "Sin lugar"}
                        </span>
                      }
                    >
                      {a.categoria && <span style={distintivo("marca")}>{a.categoria}</span>}
                      {!a.activa && <span style={distintivo("neutro")}><EyeOff size={11} /> Oculta</span>}
                      {/* Una actividad publicada cuya fecha ya pasó sigue en la
                          agenda estorbando: conviene que salte a la vista. */}
                      {a.activa && pasada && <span style={distintivo("aviso")}>Ya celebrada</span>}
                    </FilaPrincipal>

                    <Aforo inscritos={a.inscritos} max={a.plazas_max} />

                    <FilaAcciones>
                      <BotonIcono titulo={abierto ? "Ocultar detalles" : "Ver detalles"} onClick={() => setAbiertoId(abierto ? null : a.id)}>
                        {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </BotonIcono>
                      <BotonIcono titulo={a.activa ? "Ocultar de la web" : "Publicar en la web"} onClick={() => toggleActiva(a as unknown as ActividadAdmin)}>
                        {a.activa ? <Eye size={14} /> : <EyeOff size={14} />}
                      </BotonIcono>
                      <BotonIcono titulo="Editar actividad" onClick={() => { setEditandoId(a.id); setCreando(false); setAbiertoId(null); }}>
                        <Pencil size={14} />
                      </BotonIcono>
                      <BotonIcono titulo="Eliminar actividad" tono="peligro" onClick={() => borrado.pedir(a)}>
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
