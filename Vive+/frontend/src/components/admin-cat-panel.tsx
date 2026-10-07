"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, X, Check, AlertTriangle,
  HeartPulse, Dumbbell, Leaf, Palette, Landmark, Coffee, GraduationCap,
  Heart, Shield, Building2, Users, Laptop, ShieldCheck, Activity, Sofa,
  Eye, MessageCircle, Tag, Star, Zap, Globe, LayoutGrid,
} from "lucide-react";
import { adminCategoriasService, type CatTipo, type Categoria } from "@/frontend/src/services/adminCategoriasService";

const ICON_MAP: Record<string, React.ReactNode> = {
  HeartPulse: <HeartPulse size={14} />, Dumbbell: <Dumbbell size={14} />,
  Leaf: <Leaf size={14} />, Palette: <Palette size={14} />,
  Landmark: <Landmark size={14} />, Coffee: <Coffee size={14} />,
  GraduationCap: <GraduationCap size={14} />, Heart: <Heart size={14} />,
  Shield: <Shield size={14} />, Building2: <Building2 size={14} />,
  Users: <Users size={14} />, Laptop: <Laptop size={14} />,
  ShieldCheck: <ShieldCheck size={14} />, Activity: <Activity size={14} />,
  Sofa: <Sofa size={14} />, Eye: <Eye size={14} />,
  MessageCircle: <MessageCircle size={14} />, Tag: <Tag size={14} />,
  Star: <Star size={14} />, Zap: <Zap size={14} />,
  Globe: <Globe size={14} />, LayoutGrid: <LayoutGrid size={14} />,
};
const ICON_OPTIONS = Object.keys(ICON_MAP);

export type { CatTipo };

type CatBase      = { id: number; color: string; icono?: string; orden: number; activa: boolean };
type CatNombre    = CatBase & { nombre: string };
type CatProducto  = CatBase & { nombre: string; gradiente: string };
type CatOrg       = CatBase & { key: string; label: string; bg_color: string; text_color: string };

function getNombre(c: Categoria): string {
  return "key" in c ? c.label : (c as CatNombre).nombre;
}

type FormState = {
  nombre: string; key: string; label: string;
  color: string; gradiente: string; icono: string;
  bg_color: string; text_color: string; orden: string; activa: boolean;
};
const EMPTY: FormState = {
  nombre: "", key: "", label: "", color: "#EC4899",
  gradiente: "", icono: "Tag", bg_color: "#FDF2F8",
  text_color: "#EC4899", orden: "0", activa: true,
};

const inp: React.CSSProperties = {
  width: "100%", padding: "7px 10px", border: "1px solid #D8D3CC",
  borderRadius: 7, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
  outline: "none", background: "white", color: "#0F172A",
};
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "#64748B", fontFamily: "'DM Sans', sans-serif",
  marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.06em",
};
const btnP: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5, background: "#EC4899",
  color: "white", border: "none", borderRadius: 7, padding: "7px 13px",
  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
};
const btnS: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5, background: "#F5F0FF",
  color: "#475569", border: "none", borderRadius: 7, padding: "7px 13px",
  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
};
const btnI: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  background: "none", border: "1px solid #E9D8FD", borderRadius: 6,
  padding: "4px 7px", cursor: "pointer", color: "#64748B",
};
const formBox: React.CSSProperties = {
  background: "#FAF8FF", border: "1px solid #E9D8FD", borderRadius: 12,
  padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem",
  marginBottom: "0.75rem",
};
const toggleBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
  borderRadius: 7, border: "none", cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700,
};

function catToForm(c: Categoria): FormState {
  return {
    nombre:     "nombre"     in c ? c.nombre     : "",
    key:        "key"        in c ? c.key        : "",
    label:      "label"      in c ? c.label      : "",
    color:      c.color,
    gradiente:  "gradiente"  in c ? c.gradiente  : "",
    icono:      c.icono ?? "Tag",
    bg_color:   "bg_color"   in c ? c.bg_color   : "#FDF2F8",
    text_color: "text_color" in c ? c.text_color : "#EC4899",
    orden:      String(c.orden),
    activa:     c.activa,
  };
}

function Confirm({ nombre, onConfirm, onCancel }: { nombre: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 14, padding: "1.5rem", maxWidth: 360, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.75rem" }}>
          <div style={{ background: "#FFE8E8", borderRadius: 8, padding: 8, flexShrink: 0 }}>
            <AlertTriangle size={18} color="#C0392B" />
          </div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Eliminar categoría</h2>
        </div>
        <p style={{ margin: "0 0 1.25rem", fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
          ¿Eliminar <strong>{nombre}</strong>? Los registros con esta categoría quedarán sin categoría activa.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} style={btnS}>Cancelar</button>
          <button type="button" onClick={onConfirm} style={{ ...btnP, background: "#C0392B" }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

function CatForm({ tipo, initial, onSave, onCancel, saving }: {
  tipo: CatTipo; initial: FormState;
  onSave: (f: FormState) => void; onCancel: () => void; saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={formBox}>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {tipo === "organizaciones" ? (
          <>
            <div>
              <label style={lbl}>Key *
                <input required value={form.key} onChange={e => set("key", e.target.value.toLowerCase().trim())} style={inp} placeholder="ej: cooperativa" />
              </label>
            </div>
            <div>
              <label style={lbl}>Label *
                <input required value={form.label} onChange={e => set("label", e.target.value)} style={inp} placeholder="ej: Cooperativa" />
              </label>
            </div>
            <div>
              <span style={lbl}>Color fondo badge</span>
              <div style={{ display: "flex", gap: 6 }}>
                <input type="color" aria-label="Selector de color de fondo del badge" value={form.bg_color} onChange={e => set("bg_color", e.target.value)} style={{ width: 34, height: 32, border: "1px solid #D8D3CC", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                <input aria-label="Color de fondo del badge (código hexadecimal)" value={form.bg_color} onChange={e => set("bg_color", e.target.value)} style={{ ...inp, flex: 1 }} />
              </div>
            </div>
            <div>
              <span style={lbl}>Color texto badge</span>
              <div style={{ display: "flex", gap: 6 }}>
                <input type="color" aria-label="Selector de color de texto del badge" value={form.text_color} onChange={e => set("text_color", e.target.value)} style={{ width: 34, height: 32, border: "1px solid #D8D3CC", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                <input aria-label="Color de texto del badge (código hexadecimal)" value={form.text_color} onChange={e => set("text_color", e.target.value)} style={{ ...inp, flex: 1 }} />
              </div>
            </div>
          </>
        ) : (
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>Nombre *
              <input required value={form.nombre} onChange={e => set("nombre", e.target.value)} style={inp} placeholder="Nombre de la categoría" />
            </label>
          </div>
        )}

        <div>
          <span style={lbl}>Color</span>
          <div style={{ display: "flex", gap: 6 }}>
            <input type="color" aria-label="Selector de color" value={form.color} onChange={e => set("color", e.target.value)} style={{ width: 34, height: 32, border: "1px solid #D8D3CC", borderRadius: 6, cursor: "pointer", padding: 2 }} />
            <input aria-label="Color (código hexadecimal)" value={form.color} onChange={e => set("color", e.target.value)} style={{ ...inp, flex: 1 }} />
          </div>
        </div>

        {tipo !== "salud" && (
          <div>
            <label style={lbl}>Icono
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: `${form.color}15`, borderRadius: 7, color: form.color, flexShrink: 0 }}>
                  {ICON_MAP[form.icono] ?? <Tag size={14} />}
                </div>
                <select value={form.icono} onChange={e => set("icono", e.target.value)} style={{ ...inp, flex: 1 }}>
                  {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                </select>
              </div>
            </label>
          </div>
        )}

        {tipo === "productos" && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>Gradiente CSS
              <input value={form.gradiente} onChange={e => set("gradiente", e.target.value)} style={inp} placeholder="linear-gradient(135deg, #fff0f0 0%, #fff5f5 100%)" />
            </label>
          </div>
        )}

        <div>
          <label style={lbl}>Orden
            <input type="number" value={form.orden} onChange={e => set("orden", e.target.value)} style={inp} />
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", paddingTop: 18 }}>
          <button type="button" onClick={() => set("activa", !form.activa)}
            style={{ ...toggleBtn, background: form.activa ? "#E8F5F2" : "#F5F0FF", color: form.activa ? "#EC4899" : "#64748B" }}>
            {form.activa ? <><Eye size={12} /> Activa</> : <><X size={12} /> Inactiva</>}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={btnS}>Cancelar</button>
        <button type="button" disabled={saving} onClick={() => onSave(form)} style={btnP}>
          {saving ? "Guardando…" : <><Check size={13} /> Guardar</>}
        </button>
      </div>
    </div>
  );
}

export function CatPanel({ tipo, onUpdate }: { tipo: CatTipo; onUpdate?: () => void }) {
  const [cats,       setCats]       = useState<Categoria[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [creating,   setCreating]   = useState(false);
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [confirming, setConfirming] = useState<Categoria | null>(null);

  const fetchCats = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setCats(await adminCategoriasService.getCategorias(tipo));
    } catch { setError("Error cargando categorías"); }
    finally { setLoading(false); }
  }, [tipo]);

  useEffect(() => { void fetchCats(); }, [fetchCats]);

  const toBody = (form: FormState) => {
    const base = { color: form.color, orden: Number(form.orden), activa: form.activa };
    if (tipo === "organizaciones") return { ...base, key: form.key, label: form.label, bg_color: form.bg_color, text_color: form.text_color, icono: form.icono };
    if (tipo === "productos")      return { ...base, nombre: form.nombre, gradiente: form.gradiente, icono: form.icono };
    if (tipo === "salud")          return { ...base, nombre: form.nombre };
    return { ...base, nombre: form.nombre, icono: form.icono };
  };

  const doCreate = async (form: FormState) => {
    setSaving(true);
    try {
      await adminCategoriasService.crearCategoria(tipo, toBody(form));
      setCreating(false); await fetchCats(); onUpdate?.();
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  };

  const doEdit = async (form: FormState) => {
    if (editingId == null) return;
    setSaving(true);
    try {
      await adminCategoriasService.editarCategoria(tipo, { id: editingId, ...toBody(form) });
      setEditingId(null); await fetchCats(); onUpdate?.();
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  };

  const doToggle = async (c: Categoria) => {
    try {
      await adminCategoriasService.editarCategoria(tipo, { id: c.id, activa: !c.activa });
      await fetchCats(); onUpdate?.();
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
  };

  const doDelete = async () => {
    if (!confirming) return;
    const id = confirming.id; setConfirming(null);
    try {
      await adminCategoriasService.eliminarCategoria(tipo, id);
      await fetchCats(); onUpdate?.();
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
  };

  return (
    <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#F5F0FF", borderRadius: 10, border: "1px solid #E9D8FD" }}>
      {confirming && <Confirm nombre={getNombre(confirming)} onConfirm={doDelete} onCancel={() => setConfirming(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: 12, color: "#64748B", fontFamily: "'DM Sans', sans-serif" }}>
          {cats.length} categoría{cats.length !== 1 ? "s" : ""}
        </span>
        <button type="button" onClick={() => { setCreating(true); setEditingId(null); }} style={btnP}>
          <Plus size={12} /> Nueva
        </button>
      </div>

      {creating && <CatForm tipo={tipo} initial={EMPTY} onSave={doCreate} onCancel={() => setCreating(false)} saving={saving} />}
      {loading && <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>Cargando…</p>}
      {error   && <p style={{ fontSize: 12, color: "#C0392B", margin: 0 }}>{error}</p>}

      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {cats.length === 0 && !creating && (
            <p style={{ fontSize: 12, color: "#64748B", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Sin categorías aún.</p>
          )}
          {cats.map(c => (
            <div key={c.id}>
              {editingId === c.id ? (
                <CatForm tipo={tipo} initial={catToForm(c)} onSave={doEdit} onCancel={() => setEditingId(null)} saving={saving} />
              ) : (
                <div style={{ background: "white", borderLeft: `3px solid ${c.color}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10, opacity: c.activa ? 1 : 0.55 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: `${c.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, flexShrink: 0 }}>
                    {ICON_MAP[c.icono ?? ""] ?? <Tag size={13} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", fontFamily: "'DM Sans', sans-serif" }}>{getNombre(c)}</span>
                    {"key" in c && <span style={{ fontSize: 12, color: "#64748B", marginLeft: 6, fontFamily: "'DM Sans', sans-serif" }}>key: {c.key}</span>}
                    {!c.activa && <span style={{ fontSize: 12, color: "#64748B", marginLeft: 6, fontFamily: "'DM Sans', sans-serif" }}>(inactiva)</span>}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button type="button" onClick={() => doToggle(c)} title={c.activa ? "Desactivar" : "Activar"} aria-label={c.activa ? "Desactivar" : "Activar"} style={{ ...btnI, color: c.activa ? "#9333EA" : "#EC4899" }}><Eye size={13} /></button>
                    <button type="button" onClick={() => { setEditingId(c.id); setCreating(false); }} title="Editar" aria-label="Editar" style={btnI}><Pencil size={13} /></button>
                    <button type="button" onClick={() => setConfirming(c)} title="Eliminar" aria-label="Eliminar" style={{ ...btnI, color: "#C0392B", borderColor: "#FFD5D5" }}><Trash2 size={13} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
