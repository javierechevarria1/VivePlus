"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Pencil, Trash2, Check, ChevronDown, ChevronUp, Settings2, Star, HeartPulse } from "lucide-react";
import { CatPanel } from "@/frontend/src/components/admin-cat-panel";
import { saludService, type Medico, type CatSaludDB } from "@/frontend/src/services/saludService";
import { AdminShell } from "@/frontend/src/components/admin/AdminShell";
import {
  C, T, carta, campo, distintivo, rejillaCampos,
  btnPrimario, btnSecundario, seccionTitulo,
} from "@/frontend/src/components/admin/ui";
import {
  Aviso, Barra, BotonIcono, Buscador, Campo, Confirmar, Esqueleto,
  Fila, FilaAcciones, FilaDato, FilaPrincipal, Miniatura, Recuento, Vacio, useConfirmacion,
} from "@/frontend/src/components/admin/primitives";

type FormData = {
  usuario_medico_id: string;
  especialidad: string;
  tag: string;
  horario: string;
  categorias_salud_id: number;
  photo_url: string;
};

const EMPTY_FORM: FormData = {
  usuario_medico_id: "",
  especialidad: "",
  tag: "",
  horario: "",
  categorias_salud_id: 0,
  photo_url: "",
};

const toFormData = (m: Medico): FormData => ({
  usuario_medico_id:   String(m.usuario_medico_id),
  especialidad:        m.especialidad,
  tag:                 m.tag,
  horario:             m.horario,
  categorias_salud_id: m.categorias_salud_id ?? 0,
  photo_url:           m.photo_url ?? "",
});

const avatarSrc = (m: Medico) =>
  m.photo_url && (m.photo_url.startsWith("/") || m.photo_url.startsWith("http"))
    ? m.photo_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=7C3AED&color=fff&size=200`;

function MedicoForm({ initial, onSave, onCancel, saving, categorias, onCatUpdate, isCreate, titulo }: {
  initial: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  saving: boolean;
  categorias: CatSaludDB[];
  onCatUpdate: () => void;
  isCreate: boolean;
  titulo: string;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const [showCats, setShowCats] = useState(false);
  const set = (key: keyof FormData, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave(form); }}
      style={{ ...carta, padding: 20, display: "flex", flexDirection: "column", gap: 18, marginBottom: 16 }}
    >
      <h2 style={{ margin: 0, fontSize: T.seccion, fontWeight: 700, color: C.texto }}>{titulo}</h2>

      <div style={rejillaCampos}>
        {isCreate && (
          <Campo id="usuario_medico_id" titulo="ID de usuario *" pista="El profesional debe tener ya una cuenta creada.">
            <input id="usuario_medico_id" required type="number" min="1" value={form.usuario_medico_id} onChange={e => set("usuario_medico_id", e.target.value)} style={campo} placeholder="ID del usuario a vincular" />
          </Campo>
        )}

        <Campo id="especialidad" titulo="Especialidad *">
          <input id="especialidad" required value={form.especialidad} onChange={e => set("especialidad", e.target.value)} style={campo} placeholder="Ej: Cardiología, Fisioterapia…" />
        </Campo>

        <Campo id="categorias_salud_id" titulo="Categoría">
          <div style={{ display: "flex", gap: 8 }}>
            <select id="categorias_salud_id" aria-label="Categoría" value={form.categorias_salud_id} onChange={e => set("categorias_salud_id", Number(e.target.value))} style={{ ...campo, flex: 1 }}>
              <option value={0}>Sin categoría</option>
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
          {showCats && <CatPanel tipo="salud" onUpdate={onCatUpdate} />}
        </Campo>

        <Campo id="tag" titulo="Tag / subtítulo">
          <input id="tag" value={form.tag} onChange={e => set("tag", e.target.value)} style={campo} placeholder="Ej: Urgencias, Citas online…" />
        </Campo>

        <Campo id="horario" titulo="Horario">
          <input id="horario" value={form.horario} onChange={e => set("horario", e.target.value)} style={campo} placeholder="Ej: L-V 9:00-18:00" />
        </Campo>

        <Campo id="photo_url" titulo="Foto (URL o ruta)" ancho pista="Si lo dejas vacío se genera un avatar con las iniciales.">
          <input id="photo_url" value={form.photo_url} onChange={e => set("photo_url", e.target.value)} style={campo} placeholder="/img/doctor.jpg o https://…" />
        </Campo>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${C.bordeTenue}`, paddingTop: 16 }}>
        <button type="button" onClick={onCancel} style={btnSecundario}>Cancelar</button>
        <button type="submit" disabled={saving} style={{ ...btnPrimario, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Guardando…" : <><Check size={14} /> Guardar</>}
        </button>
      </div>
    </form>
  );
}

export default function AdminSaludPage() {
  const [medicos,    setMedicos]    = useState<Medico[]>([]);
  const [categorias, setCategorias] = useState<CatSaludDB[]>([]);
  const [cargando,   setCargando]   = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [creando,    setCreando]    = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [guardando,  setGuardando]  = useState(false);
  const [abiertoId,  setAbiertoId]  = useState<number | null>(null);
  const [busqueda,   setBusqueda]   = useState("");
  const [categoria,  setCategoria]  = useState("");

  const borrado = useConfirmacion<Medico>();

  const fetchCategorias = () => {
    saludService.getCategorias()
      .then(cats => setCategorias(cats))
      .catch(() => {});
  };

  useEffect(() => { fetchCategorias(); }, []);

  const fetchMedicos = async () => {
    try {
      const data = await saludService.getMedicos();
      setMedicos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando profesionales");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { void fetchMedicos(); }, []);

  const handleCreate = async (form: FormData) => {
    setGuardando(true);
    try {
      await saludService.crearMedico({
        usuario_medico_id:   Number(form.usuario_medico_id),
        especialidad:        form.especialidad,
        tag:                 form.tag || null,
        horario:             form.horario || null,
        categorias_salud_id: form.categorias_salud_id || null,
        photo_url:           form.photo_url || null,
      });
      setCreando(false);
      setError(null);
      await fetchMedicos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear profesional");
    } finally {
      setGuardando(false);
    }
  };

  const handleEdit = async (form: FormData) => {
    if (editandoId == null) return;
    setGuardando(true);
    try {
      await saludService.editarMedico(editandoId, {
        especialidad:        form.especialidad,
        tag:                 form.tag || null,
        horario:             form.horario || null,
        categorias_salud_id: form.categorias_salud_id || null,
        photo_url:           form.photo_url || null,
      });
      setEditandoId(null);
      setError(null);
      await fetchMedicos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al editar profesional");
    } finally {
      setGuardando(false);
    }
  };

  const valoraciones = medicos.reduce((s, m) => s + m.reviews, 0);
  const sinCategoria = medicos.filter(m => !m.categorias_salud_id).length;
  const conNota      = medicos.filter(m => m.reviews > 0);
  const notaMedia    = conNota.length
    ? conNota.reduce((s, m) => s + m.rating, 0) / conNota.length
    : 0;

  const visibles = useMemo(() => {
    // El término se normaliza una vez, no una por médico.
    const texto = busqueda.trim().toLowerCase();
    return medicos.filter(m =>
      (!categoria || String(m.categorias_salud_id ?? "") === categoria) &&
      (!texto ||
        m.name.toLowerCase().includes(texto) ||
        (m.especialidad ?? "").toLowerCase().includes(texto) ||
        (m.tipo ?? "").toLowerCase().includes(texto))
    );
  }, [medicos, categoria, busqueda]);

  return (
    <AdminShell
      titulo="Profesionales de salud"
      descripcion="Fichas del directorio médico: especialidad, categoría y valoraciones. La verificación de documentos se resuelve en Cuidadores."
      acciones={
        <button type="button" onClick={() => { setCreando(true); setEditandoId(null); }} style={btnPrimario}>
          <Plus size={14} /> Nuevo profesional
        </button>
      }
      enlacePublico={{ href: "/salud", texto: "Ver directorio" }}
      kpis={[
        { etiqueta: "Profesionales",  valor: medicos.length },
        { etiqueta: "Sin categoría",  valor: sinCategoria, tono: sinCategoria > 0 ? "aviso" : "ok", pie: sinCategoria > 0 ? "no se agrupan en el directorio" : "todos clasificados" },
        { etiqueta: "Valoraciones",   valor: valoraciones, tono: "marca" },
        { etiqueta: "Nota media",     valor: notaMedia > 0 ? notaMedia.toFixed(1) : "—", pie: `${conNota.length} con valoraciones` },
      ]}
    >
      {borrado.pendiente && (
        <Confirmar
          titulo="Eliminar profesional"
          mensaje={<>Se eliminará a <strong style={{ color: C.texto }}>{borrado.pendiente.name}</strong>, su cuenta de usuario y todas sus valoraciones. Esta acción no se puede deshacer.</>}
          ocupado={borrado.ocupado}
          onCancelar={borrado.cancelar}
          onConfirmar={() => borrado.ejecutar(async m => {
            try {
              await saludService.eliminarMedico(m.id);
              await fetchMedicos();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Error al eliminar profesional");
            }
          })}
        />
      )}

      {error && <Aviso>{error}</Aviso>}

      {creando && (
        <MedicoForm
          titulo="Nuevo profesional"
          initial={EMPTY_FORM}
          onSave={handleCreate}
          onCancel={() => setCreando(false)}
          saving={guardando}
          categorias={categorias}
          onCatUpdate={fetchCategorias}
          isCreate
        />
      )}

      {cargando ? (
        <Esqueleto filas={4} />
      ) : (
        <>
          {medicos.length > 0 && (
            <Barra>
              <Buscador valor={busqueda} onCambio={setBusqueda} marcador="Buscar por nombre o especialidad…" />
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                aria-label="Filtrar por categoría"
                style={{ ...campo, width: "auto", minWidth: 160 }}
              >
                <option value="">Todas las categorías</option>
                {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
              </select>
              <Recuento>{visibles.length} de {medicos.length}</Recuento>
            </Barra>
          )}

          {visibles.length === 0 ? (
            <Vacio
              icono={<HeartPulse size={24} />}
              titulo={medicos.length === 0 ? "Todavía no hay profesionales" : "Ningún profesional coincide"}
              texto={medicos.length === 0 ? "Vincula la primera ficha a un usuario ya registrado." : "Prueba con otro término o cambia el filtro."}
              accion={medicos.length === 0 ? (
                <button type="button" onClick={() => setCreando(true)} style={btnPrimario}>
                  <Plus size={14} /> Añadir el primero
                </button>
              ) : null}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibles.map(m => {
                const editando = editandoId === m.id;
                const abierto  = abiertoId === m.id && !editando;

                return (
                  <Fila
                    key={m.id}
                    desplegado={
                      editando ? (
                        <MedicoForm
                          titulo="Editar profesional"
                          initial={toFormData(m)}
                          onSave={handleEdit}
                          onCancel={() => setEditandoId(null)}
                          saving={guardando}
                          categorias={categorias}
                          onCatUpdate={fetchCategorias}
                          isCreate={false}
                        />
                      ) : abierto ? (
                        <div>
                          <p style={seccionTitulo}>Ficha</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {[
                              { texto: "Especialidad", valor: m.especialidad },
                              { texto: "Tag",          valor: m.tag },
                              { texto: "Horario",      valor: m.horario },
                              { texto: "Categoría",    valor: m.tipo },
                              { texto: "Usuario ID",   valor: String(m.usuario_medico_id) },
                            ].filter(d => d.valor).map(({ texto, valor }) => (
                              <div key={texto} style={{
                                display: "flex", justifyContent: "space-between", gap: 12,
                                fontSize: T.dato, padding: "6px 0", borderBottom: `1px solid ${C.bordeTenue}`,
                              }}>
                                <span style={{ color: C.suave }}>{texto}</span>
                                <span style={{ fontWeight: 600, color: C.texto }}>{valor}</span>
                              </div>
                            ))}
                          </div>

                          {/* La verificación de documentos vive en Cuidadores:
                              tener dos sitios donde tocarla llevaba a que esta
                              pantalla contase una cosa y aquella otra. */}
                          <p style={{ margin: "14px 0 0", fontSize: T.micro, color: C.tenue }}>
                            ¿Documentación y verificación?{" "}
                            <Link href="/admin-cuidadores" style={{ color: C.marca, fontWeight: 600 }}>
                              Se gestiona en Cuidadores
                            </Link>
                          </p>
                        </div>
                      ) : undefined
                    }
                  >
                    <Miniatura tamano={44}>
                      <Image fill sizes="44px" src={avatarSrc(m)} alt={m.name} style={{ objectFit: "cover" }} unoptimized />
                    </Miniatura>

                    <FilaPrincipal
                      titulo={m.name}
                      meta={[m.especialidad, m.horario].filter(Boolean).join(" · ") || "Sin datos de ficha"}
                    >
                      {m.tipo && (
                        <span style={{
                          ...distintivo("marca"),
                          ...(m.categoria_color ? { background: `${m.categoria_color}1A`, color: m.categoria_color } : null),
                        }}>
                          {m.tipo}
                        </span>
                      )}
                    </FilaPrincipal>

                    <FilaDato
                      valor={
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Star size={12} color="#F59E0B" fill="#F59E0B" />
                          {m.rating.toFixed(1)}
                        </span>
                      }
                      etiqueta={`${m.reviews} valoración${m.reviews !== 1 ? "es" : ""}`}
                    />

                    <FilaAcciones>
                      <BotonIcono titulo={abierto ? "Ocultar ficha" : "Ver ficha"} onClick={() => setAbiertoId(abierto ? null : m.id)}>
                        {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </BotonIcono>
                      <BotonIcono titulo="Editar profesional" onClick={() => { setEditandoId(m.id); setCreando(false); setAbiertoId(null); }}>
                        <Pencil size={14} />
                      </BotonIcono>
                      <BotonIcono titulo="Eliminar profesional" tono="peligro" onClick={() => borrado.pedir(m)}>
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
