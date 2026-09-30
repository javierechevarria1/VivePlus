"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { AdminShell } from "@/frontend/src/components/admin/AdminShell";
import {
  C, T, carta, campo, distintivo, rejillaCampos,
  btnPrimario, btnSecundario, btnMini, seccionTitulo,
} from "@/frontend/src/components/admin/ui";
import {
  Aviso, Barra, BotonIcono, Buscador, Campo, Confirmar, Esqueleto,
  Fila, FilaAcciones, FilaDato, FilaPrincipal, Recuento, Vacio, useConfirmacion,
} from "@/frontend/src/components/admin/primitives";

export type Plan = {
  id: string;
  nombre: string;
  precio: string;
  intervalo: string;
  caracteristicas: string[] | string | null;
  stripe_price_id: string | null;
  creado_en: string;
};

type FormData = {
  nombre: string;
  precio: string;
  intervalo: string;
  caracteristicas: string[];
};

const EMPTY_FORM: FormData = {
  nombre: "",
  precio: "",
  intervalo: "mensual",
  caracteristicas: [],
};

function parseCaracteristicas(raw: string[] | string | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

function toFormData(p: Plan): FormData {
  return {
    nombre: p.nombre,
    precio: String(parseFloat(p.precio)),
    intervalo: p.intervalo,
    caracteristicas: parseCaracteristicas(p.caracteristicas),
  };
}

const euros = (v: string) => `${parseFloat(v).toFixed(2).replace(".", ",")} €`;

function CaracteristicasEditor({ items, onChange }: { items: string[]; onChange: (d: string[]) => void }) {
  const [ids, setIds] = useState<number[]>(() => items.map((_, i) => i));
  const nextIdRef = useRef(items.length);
  const add = () => {
    const newId = nextIdRef.current++;
    setIds((prev) => [...prev, newId]);
    onChange([...items, ""]);
  };
  const remove = (i: number) => {
    setIds((prev) => prev.filter((_, idx) => idx !== i));
    onChange(items.filter((_, idx) => idx !== i));
  };
  const update = (i: number, val: string) => onChange(items.map((d, idx) => (idx === i ? val : d)));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ ...seccionTitulo, margin: 0 }}>Características</span>
        <button type="button" onClick={add} style={btnMini}>
          <Plus size={12} /> Añadir
        </button>
      </div>

      {items.length === 0 ? (
        <p style={{ fontSize: T.micro, color: C.tenue, margin: 0 }}>
          Sin características. Son las líneas que ve el cliente en la tarjeta del plan.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {items.map((d, i) => (
            <div key={ids[i]} style={{ display: "flex", gap: 8 }}>
              <input
                aria-label={`Característica ${i + 1}`}
                placeholder="Ej: Consulta ilimitada"
                value={d}
                onChange={(e) => update(i, e.target.value)}
                style={{ ...campo, flex: 1 }}
              />
              <BotonIcono titulo="Eliminar característica" onClick={() => remove(i)}>
                <X size={14} />
              </BotonIcono>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlanForm({ initial, onSave, onCancel, saving, titulo }: {
  initial: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  saving: boolean;
  titulo: string;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const set = (key: keyof FormData, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      style={{ ...carta, padding: 20, display: "flex", flexDirection: "column", gap: 18, marginBottom: 16 }}
    >
      <h2 style={{ margin: 0, fontSize: T.seccion, fontWeight: 700, color: C.texto }}>{titulo}</h2>

      <div style={rejillaCampos}>
        <Campo id="plan-nombre" titulo="Nombre *">
          <input id="plan-nombre" required value={form.nombre} onChange={(e) => set("nombre", e.target.value)} style={campo} placeholder="Ej: Pro" />
        </Campo>
        <Campo id="plan-precio" titulo="Precio (€) *">
          <input id="plan-precio" required type="number" min="0" step="0.01" value={form.precio} onChange={(e) => set("precio", e.target.value)} style={campo} placeholder="0.00" />
        </Campo>
        <Campo id="plan-intervalo" titulo="Intervalo *">
          <select id="plan-intervalo" aria-label="Intervalo" value={form.intervalo} onChange={(e) => set("intervalo", e.target.value)} style={campo}>
            <option value="mensual">Mensual</option>
            <option value="anual">Anual</option>
          </select>
        </Campo>
      </div>

      <CaracteristicasEditor items={form.caracteristicas} onChange={(d) => set("caracteristicas", d)} />

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${C.bordeTenue}`, paddingTop: 16 }}>
        <button type="button" onClick={onCancel} style={btnSecundario}>Cancelar</button>
        <button type="submit" disabled={saving} style={{ ...btnPrimario, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Guardando…" : <><Check size={14} /> Guardar</>}
        </button>
      </div>
    </form>
  );
}

export default function AdminPlanesPage({ initialPlanes }: { initialPlanes: Plan[] }) {
  const [planes,     setPlanes]     = useState<Plan[]>(initialPlanes);
  const [cargando,   setCargando]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [creando,    setCreando]    = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando,  setGuardando]  = useState(false);
  const [abiertoId,  setAbiertoId]  = useState<string | null>(null);
  const [busqueda,   setBusqueda]   = useState("");
  const montado = useRef(true);
  useEffect(() => () => { montado.current = false; }, []);

  const borrado = useConfirmacion<Plan>();

  const fetchPlanes = async () => {
    try {
      const res = await fetch("/api/planes");
      if (!res.ok) { if (montado.current) setError("Error cargando planes"); return; }
      const data = await res.json();
      if (montado.current) setPlanes(Array.isArray(data) ? data : []);
    } catch {
      if (montado.current) setError("Error cargando planes");
    } finally {
      if (montado.current) setCargando(false);
    }
  };

  const handleCreate = async (form: FormData) => {
    setGuardando(true);
    try {
      const res = await fetch("/api/planes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          precio: Number(form.precio),
          intervalo: form.intervalo,
          caracteristicas: form.caracteristicas,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || d.message || "Error al crear plan");
      }
      setCreando(false);
      setError(null);
      await fetchPlanes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear plan");
    } finally {
      setGuardando(false);
    }
  };

  const handleEdit = async (form: FormData) => {
    if (editandoId == null) return;
    setGuardando(true);
    try {
      const res = await fetch("/api/planes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editandoId,
          nombre: form.nombre,
          precio: Number(form.precio),
          intervalo: form.intervalo,
          caracteristicas: form.caracteristicas,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || d.message || "Error al editar plan");
      }
      setEditandoId(null);
      setError(null);
      await fetchPlanes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al editar plan");
    } finally {
      setGuardando(false);
    }
  };

  const mensuales = planes.filter(p => p.intervalo === "mensual").length;
  const sinStripe = planes.filter(p => !p.stripe_price_id).length;

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return planes.filter(p => !texto || p.nombre.toLowerCase().includes(texto));
  }, [planes, busqueda]);

  return (
    <AdminShell
      titulo="Planes de suscripción"
      descripcion="Precios, periodicidad y lo que incluye cada plan."
      acciones={
        <button type="button" onClick={() => { setCreando(true); setEditandoId(null); }} style={btnPrimario}>
          <Plus size={14} /> Nuevo plan
        </button>
      }
      enlacePublico={{ href: "/planes", texto: "Ver planes" }}
      kpis={[
        { etiqueta: "Planes",     valor: planes.length },
        { etiqueta: "Mensuales",  valor: mensuales },
        { etiqueta: "Anuales",    valor: planes.length - mensuales },
        // Un plan sin price de Stripe no se puede cobrar: merece señal propia.
        { etiqueta: "Sin Stripe", valor: sinStripe, tono: sinStripe > 0 ? "aviso" : "ok" },
      ]}
    >
      {borrado.pendiente && (
        <Confirmar
          titulo="Eliminar plan"
          mensaje={<>Se eliminará el plan <strong style={{ color: C.texto }}>{borrado.pendiente.nombre}</strong>. Esta acción no se puede deshacer.</>}
          ocupado={borrado.ocupado}
          onCancelar={borrado.cancelar}
          onConfirmar={() => borrado.ejecutar(async p => {
            try {
              const res = await fetch(`/api/planes?id=${p.id}`, { method: "DELETE" });
              if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Error al eliminar plan");
              }
              await fetchPlanes();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Error al eliminar plan");
            }
          })}
        />
      )}

      {error && <Aviso>{error}</Aviso>}

      {creando && (
        <PlanForm
          titulo="Nuevo plan"
          initial={EMPTY_FORM}
          onSave={handleCreate}
          onCancel={() => setCreando(false)}
          saving={guardando}
        />
      )}

      {cargando ? (
        <Esqueleto filas={3} />
      ) : (
        <>
          {planes.length > 0 && (
            <Barra>
              <Buscador valor={busqueda} onCambio={setBusqueda} marcador="Buscar plan…" />
              <Recuento>{visibles.length} de {planes.length}</Recuento>
            </Barra>
          )}

          {visibles.length === 0 ? (
            <Vacio
              icono={<CreditCard size={24} />}
              titulo={planes.length === 0 ? "Todavía no hay planes" : "Ningún plan coincide"}
              texto={planes.length === 0 ? "Crea el primer plan para poder ofrecer suscripciones." : "Prueba con otro término."}
              accion={planes.length === 0 ? (
                <button type="button" onClick={() => setCreando(true)} style={btnPrimario}>
                  <Plus size={14} /> Crear el primero
                </button>
              ) : null}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibles.map((p) => {
                const caract = parseCaracteristicas(p.caracteristicas);
                const editando = editandoId === p.id;
                const abierto  = abiertoId === p.id && !editando;

                return (
                  <Fila
                    key={p.id}
                    desplegado={
                      editando ? (
                        <PlanForm
                          titulo="Editar plan"
                          initial={toFormData(p)}
                          onSave={handleEdit}
                          onCancel={() => setEditandoId(null)}
                          saving={guardando}
                        />
                      ) : abierto ? (
                        <>
                          <p style={seccionTitulo}>Características</p>
                          {caract.length === 0 ? (
                            <p style={{ fontSize: T.micro, color: C.tenue, margin: 0 }}>Sin características</p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                              {caract.map((c) => (
                                <div key={c} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: T.dato, color: C.texto }}>
                                  <Check size={12} color={C.ok} strokeWidth={3} style={{ flexShrink: 0 }} />
                                  {c}
                                </div>
                              ))}
                            </div>
                          )}
                          <p style={{ margin: "14px 0 0", fontSize: T.micro, color: C.tenue }}>
                            Stripe Price ID:{" "}
                            {p.stripe_price_id
                              ? <code style={{ color: C.suave }}>{p.stripe_price_id}</code>
                              : <span style={{ color: C.aviso, fontWeight: 600 }}>sin asignar — este plan no se puede cobrar</span>}
                          </p>
                        </>
                      ) : undefined
                    }
                  >
                    <FilaPrincipal
                      titulo={p.nombre}
                      meta={`${caract.length} característica${caract.length !== 1 ? "s" : ""}`}
                    >
                      <span style={distintivo("marca")}>{p.intervalo}</span>
                      {!p.stripe_price_id && <span style={distintivo("aviso")}>Sin Stripe</span>}
                    </FilaPrincipal>

                    <FilaDato valor={euros(p.precio)} etiqueta={`por ${p.intervalo === "anual" ? "año" : "mes"}`} color={C.accion} />

                    <FilaAcciones>
                      <BotonIcono
                        titulo={abierto ? "Ocultar características" : "Ver características"}
                        onClick={() => setAbiertoId(abierto ? null : p.id)}
                      >
                        {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </BotonIcono>
                      <BotonIcono titulo="Editar plan" onClick={() => { setEditandoId(p.id); setCreando(false); setAbiertoId(null); }}>
                        <Pencil size={14} />
                      </BotonIcono>
                      <BotonIcono titulo="Eliminar plan" tono="peligro" onClick={() => borrado.pedir(p)}>
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
