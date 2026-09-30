"use client";

import { useState, useEffect, useRef, useReducer } from "react";
import Image from "next/image";
import { X, CheckCircle, AlertCircle, ChevronDown, Upload, User, Heart, Shield } from "lucide-react";
import { perfilService } from "@/frontend/src/services/perfilService";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: { id?: number; foto?: string; username?: string; email?: string; rol?: string } | null;
}

const HAIR_COLORS = [
  { hex: "0e0e0e", label: "Negro" },
  { hex: "562306", label: "Marrón oscuro" },
  { hex: "6a4e35", label: "Marrón" },
  { hex: "796a45", label: "Marrón claro" },
  { hex: "cb6820", label: "Castaño" },
  { hex: "ac6511", label: "Ámbar" },
  { hex: "ab2a18", label: "Caoba" },
  { hex: "b9a05f", label: "Rubio oscuro" },
  { hex: "e5d7a3", label: "Rubio" },
  { hex: "afafaf", label: "Gris" },
  { hex: "dba3be", label: "Rosa" },
  { hex: "85c2c6", label: "Azul" },
  { hex: "3eac2c", label: "Verde" },
  { hex: "592454", label: "Morado" },
];

const SKIN_TONES = [
  { hex: "f2d3b1", label: "Muy claro" },
  { hex: "ecad80", label: "Claro" },
  { hex: "d08b5b", label: "Medio" },
  { hex: "9e5622", label: "Oscuro" },
  { hex: "763900", label: "Muy oscuro" },
];

const BG_COLORS = [
  { hex: "b6e3f4", label: "Azul" },
  { hex: "c0aede", label: "Lila" },
  { hex: "d1d4f9", label: "Lavanda" },
  { hex: "ffd5dc", label: "Rosa" },
  { hex: "ffdfbf", label: "Melocotón" },
  { hex: "c2e4d0", label: "Menta" },
  { hex: "f5f5f5", label: "Blanco" },
  { hex: "e8e8e8", label: "Gris" },
];

const HAIR_STYLES  = [
  ...Array.from({ length: 19 }, (_, i) => `short${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 26 }, (_, i) => `long${String(i + 1).padStart(2, "0")}`),
];
const EYE_STYLES   = Array.from({ length: 26 }, (_, i) => `variant${String(i + 1).padStart(2, "0")}`);
const BROW_STYLES  = Array.from({ length: 15 }, (_, i) => `variant${String(i + 1).padStart(2, "0")}`);
const MOUTH_STYLES = Array.from({ length: 30 }, (_, i) => `variant${String(i + 1).padStart(2, "0")}`);

// Valores neutros fijos para los thumbnails (URLs estables → cacheadas por el browser)
const T_SEED   = "Felix";
const T_HAIR   = "6a4e35";
const T_SKIN   = "ecad80";
const T_BG     = "b6e3f4";
const T_EYE    = "variant01";
const T_BROW   = "variant01";
const T_MOUTH  = "variant01";
const T_HSTYLE = "short01";

function buildUrl(
  seed: string, hairStyle: string, hairColor: string,
  skinColor: string, bgColor: string,
  eyes: string, brows: string, mouth: string, mustache: boolean,
) {
  const base =
    `https://api.dicebear.com/9.x/adventurer/svg` +
    `?seed=${encodeURIComponent(seed)}` +
    `&hair=${hairStyle}&hairColor=${hairColor}` +
    `&skinColor=${skinColor}&backgroundColor=${bgColor}` +
    `&eyes=${eyes}&eyebrows=${brows}&mouth=${mouth}`;
  return mustache
    ? `${base}&features%5B%5D=mustache&featuresProbability=100`
    : `${base}&featuresProbability=0`;
}

type AvatarState = {
  seed: string; hairStyle: string; hairColor: string;
  skinColor: string; bgColor: string;
  eyes: string; brows: string; mouth: string; mustache: boolean;
};

type AvatarAction =
  | { type: "set"; field: Exclude<keyof AvatarState, "mustache">; value: string }
  | { type: "set-mustache"; value: boolean };

const AVATAR_INITIAL: AvatarState = {
  seed: "Felix", hairStyle: "short01", hairColor: "6a4e35",
  skinColor: "f2d3b1", bgColor: "b6e3f4",
  eyes: "variant01", brows: "variant01", mouth: "variant01", mustache: false,
};

function avatarReducer(state: AvatarState, action: AvatarAction): AvatarState {
  switch (action.type) {
    case "set": return { ...state, [action.field]: action.value };
    case "set-mustache": return { ...state, mustache: action.value };
    default: return state;
  }
}

const HEX6 = /^[0-9a-fA-F]{6}$/;

const PM_SWATCH_BASE: React.CSSProperties = { width: 24, height: 24, borderRadius: "50%", flexShrink: 0, cursor: "pointer", padding: 0, transition: "background-color 0.15s, color 0.15s, border-color 0.15s" };
const PM_ACCORDION_BTN: React.CSSProperties = { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", background: "none", border: "none", cursor: "pointer" };
const PM_ACCORDION_THUMB: React.CSSProperties = { width: 26, height: 26, borderRadius: 6, overflow: "hidden", position: "relative", border: "1.5px solid var(--teal)", background: "#b6e3f4", flexShrink: 0 };
const PM_SCROLL_BTN_BASE: React.CSSProperties = { position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 2, width: 22, height: 22, borderRadius: "50%", background: "white", border: "1.5px solid var(--sand)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" };
const PM_OPT_BTN_BASE: React.CSSProperties = { flexShrink: 0, width: 46, height: 46, borderRadius: 10, overflow: "hidden", position: "relative", cursor: "pointer", padding: 0, background: "#b6e3f4", transition: "background-color 0.15s, color 0.15s, border-color 0.15s" };
const SITUACIONES = ["Vive solo/a", "Con familia", "Con cónyuge", "En residencia", "Con cuidador externo"];
const DISCAPACIDADES = [
  "Movilidad reducida", "Discapacidad visual", "Discapacidad auditiva",
  "Deterioro cognitivo / demencia", "Enfermedad crónica",
  "Problemas de comunicación", "Dependencia emocional / aislamiento",
];

const PM_BACKDROP: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(5px)" };
const PM_MODAL: React.CSSProperties = { position: "fixed", top: "50%", left: "50%", right: "auto", bottom: "auto", margin: 0, transform: "translate(-50%, -50%)", background: "white", border: "none", padding: 0, width: "100%", maxWidth: 460, borderRadius: 22, overflow: "hidden", boxShadow: "0 24px 48px rgba(0,0,0,0.25)", animation: "slideUp 0.28s cubic-bezier(0.22,1,0.36,1)", maxHeight: "92vh", display: "flex", flexDirection: "column" };
const PM_STATUS_BASE: React.CSSProperties = { padding: "7px 12px", borderRadius: 10, marginBottom: 12, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 7, fontFamily: "'DM Sans', sans-serif" };
const PM_PHOTO_PREVIEW: React.CSSProperties = { width: 110, height: 110, borderRadius: "50%", overflow: "hidden", position: "relative", border: "3px solid var(--teal)", background: "var(--cream)", boxShadow: "0 4px 18px rgba(236,72,153,0.18)", display: "flex", alignItems: "center", justifyContent: "center" };
const PM_UPLOAD_BTN: React.CSSProperties = { width: "100%", padding: "10px", borderRadius: 10, border: "2px dashed var(--sand)", background: "var(--cream)", color: "var(--slate)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "border-color 0.2s" };
const PM_SAVE_BTN_BASE: React.CSSProperties = { width: "100%", padding: "11px", borderRadius: 11, border: "none", color: "white", fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background 0.2s" };
const PM_AVATAR_PREVIEW_BASE: React.CSSProperties = { width: 96, height: 96, borderRadius: "50%", overflow: "hidden", position: "relative", border: "3px solid var(--teal)", boxShadow: "0 4px 18px rgba(236,72,153,0.18)" };
const PM_MUSTACHE_BTN_BASE: React.CSSProperties = { padding: "6px 16px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: "background-color 0.2s, color 0.2s, border-color 0.2s, transform 0.2s", display: "inline-flex", alignItems: "center", gap: 5 };
const PM_TAB_BTN_BASE: React.CSSProperties = { padding: "7px 16px", borderRadius: "10px 10px 0 0", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", transition: "background-color 0.15s, color 0.15s, border-color 0.15s" };
const PM_DATOS_MSG_BASE: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans',sans-serif" };
const PM_CANCEL_SUB_BTN_BASE: React.CSSProperties = { width: "100%", padding: "9px", borderRadius: 10, border: "none", background: "#E11D48", color: "white", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" };
const PM_CONFIRM_OVERLAY: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)", animation: "confirmFade 0.18s ease-out" };
const PM_CONFIRM_BACKDROP_BTN: React.CSSProperties = { position: "absolute", inset: 0, background: "transparent", border: "none", padding: 0, cursor: "default" };
const PM_CONFIRM_BOX: React.CSSProperties = { position: "relative", background: "white", borderRadius: 18, padding: "22px 20px 18px", width: "88%", maxWidth: 320, boxShadow: "0 24px 48px rgba(0,0,0,0.28)", animation: "confirmPop 0.22s cubic-bezier(0.22,1,0.36,1)", textAlign: "center", fontFamily: "'DM Sans',sans-serif" };
const PM_CONFIRM_ICON_WRAP: React.CSSProperties = { width: 46, height: 46, borderRadius: "50%", background: "#FFF1F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" };
const PM_CONFIRM_ACTIONS: React.CSSProperties = { display: "flex", gap: 8, marginTop: 18 };
const PM_CONFIRM_CANCEL_BTN: React.CSSProperties = { flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid var(--sand)", background: "white", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
const PM_CONFIRM_OK_BTN: React.CSSProperties = { flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#E11D48", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
const PM_ADD_PERSON_BTN: React.CSSProperties = { width: "100%", padding: "10px", borderRadius: 10, border: "2px dashed var(--sand)", background: "transparent", color: "var(--teal)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 };
const PM_NEW_PERSON_LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#9333EA", textTransform: "uppercase", letterSpacing: ".07em", fontFamily: "'DM Sans',sans-serif", display: "block", marginBottom: 10 };
const PM_CANCEL_NEWDEP_BTN: React.CSSProperties = { flex: 1, padding: "9px", borderRadius: 10, border: "1.5px solid var(--sand)", background: "white", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
const inputSt: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 10,
  border: "1.5px solid var(--sand)", fontSize: 13, boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color 0.2s",
};
const secLabel: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "var(--muted)",
  textTransform: "uppercase", letterSpacing: "0.07em",
  fontFamily: "'DM Sans', sans-serif",
  display: "block", marginBottom: 7,
};
const EMPTY_DEP = { nombre: "", edad: "", ciudad: "", situacion_convivencial: "", autonomia: "", discapacidades: [] as string[] };

type DepEntry = { usuario_dependiente_id: number; nombre: string; edad: string; ciudad: string; situacion_convivencial: string; autonomia: string; discapacidades: string[] };

function computeInitialAvatarState(user: ProfileModalProps["user"]): AvatarState {
  const isMedico = user?.rol === "medico" || user?.rol === "usuario_organizacion";
  if (!user || isMedico) return AVATAR_INITIAL;
  const p = user.foto ? parseUrl(user.foto) : null;
  return {
    seed:      p?.seed      ?? "Felix",
    hairStyle: p?.hairStyle ?? "short01",
    hairColor: p?.hairColor ?? "6a4e35",
    skinColor: p?.skinColor ?? "f2d3b1",
    bgColor:   p?.bgColor   ?? "b6e3f4",
    eyes:      p?.eyes      ?? "variant01",
    brows:     p?.brows     ?? "variant01",
    mouth:     p?.mouth     ?? "variant01",
    mustache:  p?.mustache  ?? false,
  };
}

function parseUrl(url: string) {
  if (!url?.includes("dicebear.com")) return null;
  try {
    const u = new URL(url);
    const hex = (key: string, def: string) => {
      const v = u.searchParams.get(key) || "";
      return HEX6.test(v) ? v : def;
    };
    const mustache =
      url.includes("features%5B%5D=mustache") ||
      url.includes("features[]=mustache");
    return {
      seed:      u.searchParams.get("seed")     || "Felix",
      hairStyle: u.searchParams.get("hair")     || "short01",
      hairColor: hex("hairColor",       "6a4e35"),
      skinColor: hex("skinColor",       "f2d3b1"),
      bgColor:   hex("backgroundColor", "b6e3f4"),
      eyes:      u.searchParams.get("eyes")     || "variant01",
      brows:     u.searchParams.get("eyebrows") || "variant01",
      mouth:     u.searchParams.get("mouth")    || "variant01",
      mustache,
    };
  } catch { return null; }
}

function Swatch({ hex, label, selected, onClick }: {
  hex: string; label?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label || hex}
      aria-label={label || hex}
      style={{ ...PM_SWATCH_BASE, background: `#${hex}`, border: selected ? "2.5px solid var(--teal)" : "2px solid rgba(0,0,0,0.1)", boxShadow: selected ? "0 0 0 2px white, 0 0 0 4px var(--teal)" : "none", transform: selected ? "scale(1.2)" : "scale(1)" }}
    />
  );
}

// Sección colapsable con scroll horizontal y flechas de navegación
function AccordionRow({ label, options, selected, onSelect, thumbFn }: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  thumbFn: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Al abrir, centra la opción seleccionada
  useEffect(() => {
    if (!open || !scrollRef.current) return;
    const idx = options.indexOf(selected);
    if (idx > 0) {
      scrollRef.current.scrollLeft = Math.max(0, idx * 52 - 104);
    }
  }, [open]);  // eslint-disable-line react-hooks/exhaustive-deps

  const scroll = (dir: "l" | "r") => {
    scrollRef.current?.scrollBy({ left: dir === "l" ? -220 : 220, behavior: "smooth" });
  };

  return (
    <div style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      {/* Cabecera del acordeón */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={PM_ACCORDION_BTN}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: "var(--muted)",
            textTransform: "uppercase", letterSpacing: "0.07em",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {label}
          </span>
          {/* Miniatura de la selección actual */}
          <div style={PM_ACCORDION_THUMB}>
            <Image fill sizes="100vw" src={thumbFn(selected)} alt="sel" style={{ objectFit: "cover" }} />
          </div>
        </div>
        <ChevronDown
          size={14}
          color="var(--muted)"
          style={{
            flexShrink: 0, transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {/* Contenido expandido */}
      {open && (
        <div style={{ position: "relative", marginBottom: 10 }}>
          {/* Flecha izquierda */}
          <button
            type="button"
            onClick={() => scroll("l")}
            aria-label="Desplazar a la izquierda"
            style={{ ...PM_SCROLL_BTN_BASE, left: 0 }}
          >
            <ChevronDown size={11} color="var(--slate)" style={{ transform: "rotate(90deg)" }} />
          </button>

          {/* Fila scrollable */}
          <div
            ref={scrollRef}
            className="pm-scroll"
            style={{
              display: "flex", gap: 6, overflowX: "auto",
              padding: "4px 28px",
            }}
          >
            {options.map(opt => {
              const sel = selected === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onSelect(opt)}
                  title={opt}
                  style={{ ...PM_OPT_BTN_BASE, border: sel ? "2.5px solid var(--teal)" : "2px solid rgba(0,0,0,0.07)", boxShadow: sel ? "0 0 0 2px white, 0 0 0 4px var(--teal)" : "none", transform: sel ? "scale(1.1)" : "scale(1)" }}
                >
                  <Image fill sizes="100vw" src={thumbFn(opt)} alt={opt} style={{ objectFit: "cover" }} />
                </button>
              );
            })}
          </div>

          {/* Flecha derecha */}
          <button
            type="button"
            onClick={() => scroll("r")}
            aria-label="Desplazar a la derecha"
            style={{ ...PM_SCROLL_BTN_BASE, right: 0 }}
          >
            <ChevronDown size={11} color="var(--slate)" style={{ transform: "rotate(-90deg)" }} />
          </button>
        </div>
      )}
    </div>
  );
}

// Cabecera del modal: título, cerrar y pestañas
function ProfileModalHeader({
  onClose,
  showDatosTab,
  activeTab,
  onSelectTab,
}: {
  onClose: () => void;
  showDatosTab: boolean;
  activeTab: "avatar" | "datos";
  onSelectTab: (tab: "avatar" | "datos") => void;
}) {
  return (
    <div style={{ borderBottom: "1px solid var(--sand)", background: "var(--cream)", flexShrink: 0 }}>
      <div style={{ padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 id="pm-title" style={{ margin: 0, fontSize: 17, fontFamily: "'Cormorant Garamond', serif", color: "var(--slate)", fontWeight: 600 }}>Mi Perfil</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: "50%", display: "flex" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--sand)")}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}
        >
          <X size={17} color="var(--slate)" />
        </button>
      </div>
      {showDatosTab && (
        <div style={{ display: "flex", padding: "0 18px", gap: 4 }}>
          {([["avatar", "Avatar"], ["datos", "Mis datos"]] as const).map(([tab, label]) => (
            <button key={tab} type="button" onClick={() => onSelectTab(tab)} style={{ ...PM_TAB_BTN_BASE, background: activeTab === tab ? "white" : "transparent", color: activeTab === tab ? "var(--teal)" : "var(--muted)", borderBottom: activeTab === tab ? "2px solid var(--teal)" : "2px solid transparent" }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Pestaña "Mis datos": contacto, suscripción y personas a cargo
function ProfileDatosTab({
  datosLoading,
  datosMsg,
  isIntermediario,
  user,
  telefono,
  setTelefono,
  datosSaving,
  handleSaveDatos,
  suscripcion,
  cancelingSub,
  setShowCancelConfirm,
  subCanceled,
  dependientes,
  savingDeps,
  updateDep,
  toggleDepDisc,
  handleSaveDep,
  addingNew,
  setAddingNew,
  newDep,
  setNewDep,
  savingNew,
  handleAddDep,
}: {
  datosLoading: boolean;
  datosMsg: { type: "success" | "error"; text: string } | null;
  isIntermediario: boolean;
  user: ProfileModalProps["user"];
  telefono: string;
  setTelefono: (v: string) => void;
  datosSaving: boolean;
  handleSaveDatos: (e: React.FormEvent) => void;
  suscripcion: { plan_nombre: string } | null;
  cancelingSub: boolean;
  setShowCancelConfirm: (v: boolean) => void;
  subCanceled: boolean;
  dependientes: DepEntry[];
  savingDeps: Set<number>;
  updateDep: (id: number, field: string, value: unknown) => void;
  toggleDepDisc: (id: number, disc: string) => void;
  handleSaveDep: (dep: DepEntry) => void;
  addingNew: boolean;
  setAddingNew: (v: boolean) => void;
  newDep: typeof EMPTY_DEP;
  setNewDep: React.Dispatch<React.SetStateAction<typeof EMPTY_DEP>>;
  savingNew: boolean;
  handleAddDep: () => void;
}) {
  return (
    <div>
      {datosLoading && <p style={{ textAlign: "center", color: "var(--muted)", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>Cargando…</p>}
      {!datosLoading && (<>
        <form onSubmit={handleSaveDatos} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {datosMsg && (
            <div style={{ ...PM_DATOS_MSG_BASE, background: datosMsg.type === "success" ? "#F0FDF4" : "#FFF1F2", color: datosMsg.type === "success" ? "#15803D" : "#E11D48" }}>
              {datosMsg.type === "success" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
              {datosMsg.text}
            </div>
          )}

          {/* ── Formulario usuario (solo datos de contacto) ── */}
          {!isIntermediario && (
            <div style={{ background: "var(--cream)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <User size={14} color="var(--teal)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em", fontFamily: "'DM Sans',sans-serif" }}>Mis datos de contacto</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input style={{ ...inputSt, background: "#F1F5F9", color: "var(--muted)", cursor: "default" }} value={user?.username ?? ""} aria-label="Nombre de usuario" readOnly />
                <input style={{ ...inputSt, background: "#F1F5F9", color: "var(--muted)", cursor: "default" }} type="email" value={user?.email ?? ""} aria-label="Correo electrónico" readOnly />
                <div>
                  <label htmlFor="pm-telefono" style={secLabel}>Teléfono móvil</label>
                  <input id="pm-telefono" style={inputSt} type="tel" placeholder="600 000 000" value={telefono} onChange={e => setTelefono(e.target.value)} onFocus={e => (e.target.style.borderColor = "var(--teal)")} onBlur={e => (e.target.style.borderColor = "var(--sand)")} />
                </div>
              </div>
            </div>
          )}

          {!isIntermediario && (
            <button type="submit" disabled={datosSaving} style={{ ...PM_SAVE_BTN_BASE, background: "var(--teal)", cursor: datosSaving ? "default" : "pointer", opacity: datosSaving ? 0.7 : 1 }}>
              {datosSaving ? "Guardando…" : "Guardar datos"}
            </button>
          )}

          {suscripcion && (
            <div style={{ background: "#FFF1F2", borderRadius: 12, padding: "12px 14px", border: "1.5px solid #FECDD3" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Shield size={14} color="#E11D48" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#E11D48", textTransform: "uppercase", letterSpacing: ".07em", fontFamily: "'DM Sans',sans-serif" }}>Tu suscripción</span>
              </div>
              <p style={{ fontSize: 13, color: "#475569", fontFamily: "'DM Sans',sans-serif", margin: "0 0 10px" }}>
                Plan activo: <strong>{suscripcion.plan_nombre}</strong>
              </p>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                disabled={cancelingSub}
                style={{ ...PM_CANCEL_SUB_BTN_BASE, cursor: cancelingSub ? "default" : "pointer", opacity: cancelingSub ? 0.7 : 1 }}
              >
                {cancelingSub ? "Cancelando…" : "Cancelar suscripción"}
              </button>
            </div>
          )}

          {!suscripcion && subCanceled && (
            <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "12px 14px", border: "1.5px solid #BBF7D0", display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={15} color="#15803D" />
              <p style={{ margin: 0, fontSize: 13, color: "#15803D", fontFamily: "'DM Sans',sans-serif" }}>
                Suscripción cancelada. Ya no tienes ningún plan activo.
              </p>
            </div>
          )}
        </form>

        {isIntermediario && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
            {dependientes.length === 0 && !datosLoading && (
              <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>No hay personas registradas a tu cargo.</p>
            )}
            {dependientes.map(dep => {
              const isSaving = savingDeps.has(dep.usuario_dependiente_id);
              return (
                <div key={dep.usuario_dependiente_id} style={{ background: "var(--cream)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <Heart size={13} color="#EC4899" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--slate)", fontFamily: "'DM Sans',sans-serif" }}>{dep.nombre || "Sin nombre"}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <div>
                      <label htmlFor={`pm-dep-nombre-${dep.usuario_dependiente_id}`} style={secLabel}>Nombre completo</label>
                      <input id={`pm-dep-nombre-${dep.usuario_dependiente_id}`} style={inputSt} placeholder="María García" value={dep.nombre} onChange={e => updateDep(dep.usuario_dependiente_id, "nombre", e.target.value)} onFocus={e => (e.target.style.borderColor = "var(--teal)")} onBlur={e => (e.target.style.borderColor = "var(--sand)")} />
                    </div>
                    <div>
                      <label htmlFor={`pm-dep-edad-${dep.usuario_dependiente_id}`} style={secLabel}>Edad</label>
                      <input id={`pm-dep-edad-${dep.usuario_dependiente_id}`} style={inputSt} type="number" min="0" max="120" placeholder="65" value={dep.edad} onChange={e => updateDep(dep.usuario_dependiente_id, "edad", e.target.value)} onFocus={e => (e.target.style.borderColor = "var(--teal)")} onBlur={e => (e.target.style.borderColor = "var(--sand)")} />
                    </div>
                    <div>
                      <label htmlFor={`pm-dep-ciudad-${dep.usuario_dependiente_id}`} style={secLabel}>Ciudad</label>
                      <input id={`pm-dep-ciudad-${dep.usuario_dependiente_id}`} style={inputSt} placeholder="Santander" value={dep.ciudad} onChange={e => updateDep(dep.usuario_dependiente_id, "ciudad", e.target.value)} onFocus={e => (e.target.style.borderColor = "var(--teal)")} onBlur={e => (e.target.style.borderColor = "var(--sand)")} />
                    </div>
                    <select style={{ ...inputSt, appearance: "none" as const, cursor: "pointer" }} value={dep.situacion_convivencial} aria-label="Situación de convivencia" onChange={e => updateDep(dep.usuario_dependiente_id, "situacion_convivencial", e.target.value)} onFocus={e => (e.target.style.borderColor = "var(--teal)")} onBlur={e => (e.target.style.borderColor = "var(--sand)")}>
                      <option value="">Situación de convivencia…</option>
                      {SITUACIONES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                      {[["autonomo", "Autónomo/a"], ["no_autonomo", "No autónomo/a"]].map(([val, label]) => (
                        <button key={val} type="button" onClick={() => updateDep(dep.usuario_dependiente_id, "autonomia", val)}
                          style={{ flex: 1, padding: "7px 6px", borderRadius: 8, border: `2px solid ${dep.autonomia === val ? "var(--teal)" : "var(--sand)"}`, background: dep.autonomia === val ? "#E8F5F4" : "white", color: dep.autonomia === val ? "var(--teal)" : "var(--muted)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {DISCAPACIDADES.map(d => (
                        <button key={d} type="button" onClick={() => toggleDepDisc(dep.usuario_dependiente_id, d)}
                          style={{ padding: "4px 9px", borderRadius: 99, border: `1.5px solid ${dep.discapacidades.includes(d) ? "var(--teal)" : "var(--sand)"}`, background: dep.discapacidades.includes(d) ? "#E8F5F4" : "white", color: dep.discapacidades.includes(d) ? "var(--teal)" : "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                          {d}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => handleSaveDep(dep)} disabled={isSaving}
                      style={{ ...PM_SAVE_BTN_BASE, background: "var(--teal)", cursor: isSaving ? "default" : "pointer", opacity: isSaving ? 0.7 : 1, marginTop: 4 }}>
                      {isSaving ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Añadir nueva persona */}
            {!addingNew ? (
              <button type="button" onClick={() => setAddingNew(true)}
                style={PM_ADD_PERSON_BTN}>
                + Añadir persona
              </button>
            ) : (
              <div style={{ background: "#F3E8FF", borderRadius: 12, padding: "12px 14px", border: "1.5px solid #DDD6FE" }}>
                <span style={PM_NEW_PERSON_LABEL}>Nueva persona</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div>
                    <label htmlFor="pm-newdep-nombre" style={secLabel}>Nombre completo *</label>
                    <input id="pm-newdep-nombre" style={inputSt} placeholder="María García" value={newDep.nombre} onChange={e => setNewDep(p => ({ ...p, nombre: e.target.value }))} onFocus={e => (e.target.style.borderColor = "var(--teal)")} onBlur={e => (e.target.style.borderColor = "var(--sand)")} />
                  </div>
                  <div>
                    <label htmlFor="pm-newdep-edad" style={secLabel}>Edad</label>
                    <input id="pm-newdep-edad" style={inputSt} type="number" min="0" max="120" placeholder="65" value={newDep.edad} onChange={e => setNewDep(p => ({ ...p, edad: e.target.value }))} onFocus={e => (e.target.style.borderColor = "var(--teal)")} onBlur={e => (e.target.style.borderColor = "var(--sand)")} />
                  </div>
                  <div>
                    <label htmlFor="pm-newdep-ciudad" style={secLabel}>Ciudad</label>
                    <input id="pm-newdep-ciudad" style={inputSt} placeholder="Santander" value={newDep.ciudad} onChange={e => setNewDep(p => ({ ...p, ciudad: e.target.value }))} onFocus={e => (e.target.style.borderColor = "var(--teal)")} onBlur={e => (e.target.style.borderColor = "var(--sand)")} />
                  </div>
                  <select style={{ ...inputSt, appearance: "none" as const, cursor: "pointer" }} value={newDep.situacion_convivencial} aria-label="Situación de convivencia" onChange={e => setNewDep(p => ({ ...p, situacion_convivencial: e.target.value }))} onFocus={e => (e.target.style.borderColor = "var(--teal)")} onBlur={e => (e.target.style.borderColor = "var(--sand)")}>
                    <option value="">Situación de convivencia…</option>
                    {SITUACIONES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[["autonomo", "Autónomo/a"], ["no_autonomo", "No autónomo/a"]].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setNewDep(p => ({ ...p, autonomia: val }))}
                        style={{ flex: 1, padding: "7px 6px", borderRadius: 8, border: `2px solid ${newDep.autonomia === val ? "var(--teal)" : "var(--sand)"}`, background: newDep.autonomia === val ? "#E8F5F4" : "white", color: newDep.autonomia === val ? "var(--teal)" : "var(--muted)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {DISCAPACIDADES.map(d => (
                      <button key={d} type="button" onClick={() => setNewDep(p => ({ ...p, discapacidades: p.discapacidades.includes(d) ? p.discapacidades.filter(x => x !== d) : [...p.discapacidades, d] }))}
                        style={{ padding: "4px 9px", borderRadius: 99, border: `1.5px solid ${newDep.discapacidades.includes(d) ? "var(--teal)" : "var(--sand)"}`, background: newDep.discapacidades.includes(d) ? "#E8F5F4" : "white", color: newDep.discapacidades.includes(d) ? "var(--teal)" : "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                        {d}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button type="button" onClick={() => { setAddingNew(false); setNewDep({ ...EMPTY_DEP }); }}
                      style={PM_CANCEL_NEWDEP_BTN}>
                      Cancelar
                    </button>
                    <button type="button" onClick={handleAddDep} disabled={savingNew || !newDep.nombre.trim()}
                      style={{ flex: 2, ...PM_SAVE_BTN_BASE, background: "#9333EA", cursor: (savingNew || !newDep.nombre.trim()) ? "default" : "pointer", opacity: (savingNew || !newDep.nombre.trim()) ? 0.6 : 1 }}>
                      {savingNew ? "Añadiendo…" : "Añadir persona"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </>)}
    </div>
  );
}

// Pestaña avatar para médicos/organizaciones: foto real
function ProfileMedicoPhotoTab({
  photoPreview,
  setPhotoPreview,
  setSaved,
  setStatus,
  fileInputRef,
  handleFileChange,
  handleSavePhoto,
  loading,
  saved,
}: {
  photoPreview: string;
  setPhotoPreview: (v: string) => void;
  setSaved: (v: boolean) => void;
  setStatus: (v: { type: "success" | "error" | ""; msg: string }) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSavePhoto: () => void;
  loading: boolean;
  saved: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Vista previa */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={PM_PHOTO_PREVIEW}>
          {photoPreview
            ? <Image fill sizes="100vw" src={photoPreview} alt="Foto de perfil" style={{ objectFit: "cover" }} onError={() => setPhotoPreview("")} />
            : <span style={{ fontSize: 38 }}>👤</span>
          }
        </div>
        <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}>Vista previa</span>
      </div>

      {/* Subir desde dispositivo */}
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={PM_UPLOAD_BTN}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--teal)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--sand)")}
        >
          <Upload size={15} strokeWidth={2} /> Subir desde dispositivo
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
      </div>

      {/* Separador */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: "var(--sand)" }} />
        <label htmlFor="pm-foto-url" style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}>o pega una URL</label>
        <div style={{ flex: 1, height: 1, background: "var(--sand)" }} />
      </div>

      {/* Input URL */}
      <input
        id="pm-foto-url"
        type="url"
        value={photoPreview.startsWith("data:") ? "" : photoPreview}
        onChange={e => { setPhotoPreview(e.target.value); setSaved(false); setStatus({ type: "", msg: "" }); }}
        placeholder="https://ejemplo.com/foto.jpg"
        style={inputSt}
        onFocus={e => (e.target.style.borderColor = "var(--teal)")}
        onBlur={e => (e.target.style.borderColor = "var(--sand)")}
      />

      {/* Guardar */}
      <button
        type="button"
        onClick={handleSavePhoto}
        disabled={!photoPreview || loading || saved}
        style={{ ...PM_SAVE_BTN_BASE, background: saved ? "#2e9e6e" : "var(--teal)", cursor: (!photoPreview || loading || saved) ? "default" : "pointer", opacity: !photoPreview && !saved ? 0.5 : 1 }}
      >
        {loading
          ? <><div style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Guardando…</>
          : saved
            ? <><CheckCircle size={15} /> ¡Foto guardada!</>
            : "Guardar foto"}
      </button>
    </div>
  );
}

// Pestaña avatar personalizable (usuarios finales)
function ProfileAvatarCustomTab({
  bgColor,
  currentUrl,
  hairStyle,
  eyes,
  brows,
  mouth,
  mustache,
  hairColor,
  skinColor,
  dispatchAvatar,
  handleSaveAvatar,
  loading,
  saved,
}: {
  bgColor: string;
  currentUrl: string;
  hairStyle: string;
  eyes: string;
  brows: string;
  mouth: string;
  mustache: boolean;
  hairColor: string;
  skinColor: string;
  dispatchAvatar: React.Dispatch<AvatarAction>;
  handleSaveAvatar: () => void;
  loading: boolean;
  saved: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Vista previa */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ ...PM_AVATAR_PREVIEW_BASE, background: `#${bgColor}` }}>
          <Image fill sizes="96px" src={currentUrl} alt="Tu avatar" style={{ objectFit: "cover" }} />
        </div>
        <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}>Vista previa</span>
      </div>

      {/* Acordeón de estilos */}
      <div style={{ background: "var(--cream)", borderRadius: 14, padding: "0 14px" }}>
        <AccordionRow
          label="Peinado"
          options={HAIR_STYLES}
          selected={hairStyle}
          onSelect={v => dispatchAvatar({ type: "set", field: "hairStyle", value: v })}
          thumbFn={v => buildUrl(T_SEED, v, T_HAIR, T_SKIN, T_BG, T_EYE, T_BROW, T_MOUTH, false)}
        />
        <AccordionRow
          label="Ojos"
          options={EYE_STYLES}
          selected={eyes}
          onSelect={v => dispatchAvatar({ type: "set", field: "eyes", value: v })}
          thumbFn={v => buildUrl(T_SEED, T_HSTYLE, T_HAIR, T_SKIN, T_BG, v, T_BROW, T_MOUTH, false)}
        />
        <AccordionRow
          label="Cejas"
          options={BROW_STYLES}
          selected={brows}
          onSelect={v => dispatchAvatar({ type: "set", field: "brows", value: v })}
          thumbFn={v => buildUrl(T_SEED, T_HSTYLE, T_HAIR, T_SKIN, T_BG, T_EYE, v, T_MOUTH, false)}
        />
        <AccordionRow
          label="Boca"
          options={MOUTH_STYLES}
          selected={mouth}
          onSelect={v => dispatchAvatar({ type: "set", field: "mouth", value: v })}
          thumbFn={v => buildUrl(T_SEED, T_HSTYLE, T_HAIR, T_SKIN, T_BG, T_EYE, T_BROW, v, false)}
        />

        {/* Bigote (toggle simple) */}
        <div style={{ padding: "9px 0" }}>
          <span style={secLabel}>Bigote</span>
          <button
            type="button"
            onClick={() => dispatchAvatar({ type: "set-mustache", value: !mustache })}
            style={{ ...PM_MUSTACHE_BTN_BASE, border: mustache ? "2px solid var(--teal)" : "2px solid rgba(0,0,0,0.12)", background: mustache ? "var(--teal)" : "white", color: mustache ? "white" : "var(--muted)" }}
          >
            {mustache && <CheckCircle size={12} />}
            {mustache ? "Con bigote" : "Sin bigote"}
          </button>
        </div>
      </div>

      {/* Colores */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "var(--cream)", borderRadius: 14, padding: "12px 14px" }}>
        <div>
          <span style={secLabel}>Color de pelo</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {HAIR_COLORS.map(h => (
              <Swatch key={h.hex} hex={h.hex} label={h.label} selected={hairColor === h.hex} onClick={() => dispatchAvatar({ type: "set", field: "hairColor", value: h.hex })} />
            ))}
          </div>
        </div>
        <div>
          <span style={secLabel}>Tono de piel</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SKIN_TONES.map(s => (
              <Swatch key={s.hex} hex={s.hex} label={s.label} selected={skinColor === s.hex} onClick={() => dispatchAvatar({ type: "set", field: "skinColor", value: s.hex })} />
            ))}
          </div>
        </div>
        <div>
          <span style={secLabel}>Fondo</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {BG_COLORS.map(b => (
              <Swatch key={b.hex} hex={b.hex} label={b.label} selected={bgColor === b.hex} onClick={() => dispatchAvatar({ type: "set", field: "bgColor", value: b.hex })} />
            ))}
          </div>
        </div>
      </div>

      {/* Guardar */}
      <button
        type="button"
        onClick={handleSaveAvatar}
        disabled={loading || saved}
        style={{ ...PM_SAVE_BTN_BASE, background: saved ? "#2e9e6e" : "var(--teal)", cursor: (loading || saved) ? "default" : "pointer" }}
      >
        {loading
          ? <><div style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Guardando…</>
          : saved
            ? <><CheckCircle size={15} /> ¡Avatar guardado!</>
            : "Guardar avatar"}
      </button>
    </div>
  );
}

// Diálogo de confirmación para cancelar la suscripción
function ProfileCancelSubscriptionDialog({
  cancelingSub,
  onDismiss,
  onConfirm,
}: {
  cancelingSub: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}) {
  return (
    <div style={PM_CONFIRM_OVERLAY}>
      {/* El fondo cierra al pulsarlo, así que es un botón de verdad: la caja
          va encima y se queda con sus propias pulsaciones. */}
      <button type="button" aria-label="Cerrar" disabled={cancelingSub} onClick={onDismiss} style={PM_CONFIRM_BACKDROP_BTN} />
      <div style={PM_CONFIRM_BOX}>
        <div style={PM_CONFIRM_ICON_WRAP}>
          <AlertCircle size={22} color="#E11D48" />
        </div>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontFamily: "'Cormorant Garamond', serif", color: "var(--slate)", fontWeight: 600 }}>
          Cancelar suscripción
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
          ¿Seguro que quieres cancelar la suscripción? No se te cobrará más.
        </p>
        <div style={PM_CONFIRM_ACTIONS}>
          <button type="button" onClick={onDismiss} disabled={cancelingSub} style={{ ...PM_CONFIRM_CANCEL_BTN, cursor: cancelingSub ? "default" : "pointer", opacity: cancelingSub ? 0.7 : 1 }}>
            Volver
          </button>
          <button type="button" onClick={onConfirm} disabled={cancelingSub} style={{ ...PM_CONFIRM_OK_BTN, cursor: cancelingSub ? "default" : "pointer", opacity: cancelingSub ? 0.7 : 1 }}>
            {cancelingSub ? "Cancelando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Estado y acciones de la pestaña "Mis datos" (contacto, suscripción, personas a cargo)
function useProfileDatosTab(user: ProfileModalProps["user"], isIntermediario: boolean) {
  const [telefono,     setTelefono]     = useState("");
  const [dependientes, setDependientes] = useState<DepEntry[]>([]);
  const [savingDeps,   setSavingDeps]   = useState<Set<number>>(new Set());
  const [addingNew,    setAddingNew]    = useState(false);
  const [newDep,       setNewDep]       = useState<typeof EMPTY_DEP>({ ...EMPTY_DEP });
  const [savingNew,    setSavingNew]    = useState(false);
  const [datosLoading, setDatosLoading] = useState(false);
  const [datosSaving,  setDatosSaving]  = useState(false);
  const [datosMsg,     setDatosMsg]     = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [suscripcion,  setSuscripcion]  = useState<{ plan_nombre: string } | null>(null);
  const [cancelingSub, setCancelingSub] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [subCanceled, setSubCanceled] = useState(false);

  const loadDatosTab = () => {
    if (!user?.id) return;
    setDatosLoading(true);
    setSuscripcion(null);
    setSubCanceled(false);
    let storedUser: Record<string, unknown> = {};
    try {
      storedUser = JSON.parse(sessionStorage.getItem("r65_user:v1") ?? "{}");
    } catch {}
    if (storedUser.plan_id) {
      fetch("/api/suscripciones", { credentials: "include" })
        .then(r => r.json())
        .then(d => { setSuscripcion(d.ok && d.data ? d.data : { plan_nombre: "Plan activo" }); })
        .catch(() => { setSuscripcion({ plan_nombre: "Plan activo" }); });
    }
    if (isIntermediario) {
      fetch(`/api/onboarding?userId=${user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d) return;
          setDependientes((d.dependientes ?? []).map((dep: Record<string, unknown>) => ({
            usuario_dependiente_id: Number(dep.usuario_dependiente_id),
            nombre: String(dep.nombre ?? ""),
            edad: String(dep.edad ?? ""),
            ciudad: String(dep.ciudad ?? ""),
            situacion_convivencial: String(dep.situacion_convivencial ?? ""),
            autonomia: String(dep.autonomia ?? ""),
            discapacidades: Array.isArray(dep.discapacidades) ? dep.discapacidades as string[] : [],
          })));
        })
        .catch(() => {})
        .finally(() => setDatosLoading(false));
    } else {
      setTelefono((storedUser.telefono as string) ?? "");
      setDatosLoading(false);
    }
  };

  const handleCancelSub = async () => {
    setShowCancelConfirm(false);
    setCancelingSub(true);
    try {
      const res = await fetch("/api/suscripciones", { method: "DELETE", credentials: "include" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSuscripcion(null);
      setSubCanceled(true);
      const saved = sessionStorage.getItem("r65_user:v1");
      if (saved) { const u = JSON.parse(saved); u.plan_id = null; sessionStorage.setItem("r65_user:v1", JSON.stringify(u)); }
      window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
      window.dispatchEvent(new CustomEvent("r65:authed"));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setCancelingSub(false);
    }
  };

  const handleSaveDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setDatosSaving(true); setDatosMsg(null);
    try {
      const res = await fetch("/api/perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action: "update_telefono", telefono }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const saved = sessionStorage.getItem("r65_user:v1");
      if (saved) { const u = JSON.parse(saved); u.telefono = telefono; sessionStorage.setItem("r65_user:v1", JSON.stringify(u)); }
      setDatosMsg({ type: "success", text: "Datos guardados correctamente." });
    } catch (err) {
      setDatosMsg({ type: "error", text: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setDatosSaving(false);
    }
  };

  const updateDep = (id: number, field: string, value: unknown) =>
    setDependientes(prev => prev.map(d => d.usuario_dependiente_id === id ? { ...d, [field]: value } : d));

  const toggleDepDisc = (id: number, disc: string) =>
    setDependientes(prev => prev.map(d => d.usuario_dependiente_id === id
      ? { ...d, discapacidades: d.discapacidades.includes(disc) ? d.discapacidades.filter(x => x !== disc) : [...d.discapacidades, disc] }
      : d));

  const handleSaveDep = async (dep: DepEntry) => {
    if (!user?.id) return;
    setSavingDeps(prev => new Set(prev).add(dep.usuario_dependiente_id));
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, step: "save_dependiente", data: { dependiente_id: dep.usuario_dependiente_id, nombre: dep.nombre, edad: Number(dep.edad) || null, ciudad: dep.ciudad, situacion_convivencial: dep.situacion_convivencial, autonomia: dep.autonomia, discapacidades: dep.discapacidades } }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
    } catch { /* silent */ }
    finally { setSavingDeps(prev => { const s = new Set(prev); s.delete(dep.usuario_dependiente_id); return s; }); }
  };

  const handleAddDep = async () => {
    if (!user?.id || !newDep.nombre.trim()) return;
    setSavingNew(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, step: "add_dependiente", data: { nombre: newDep.nombre, edad: Number(newDep.edad) || null, ciudad: newDep.ciudad, situacion_convivencial: newDep.situacion_convivencial, autonomia: newDep.autonomia, discapacidades: newDep.discapacidades } }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setDependientes(prev => [...prev, { ...newDep, usuario_dependiente_id: d.dependiente_id }]);
      setNewDep({ ...EMPTY_DEP });
      setAddingNew(false);
    } catch { /* silent */ }
    finally { setSavingNew(false); }
  };

  return {
    telefono, setTelefono,
    dependientes, savingDeps,
    addingNew, setAddingNew,
    newDep, setNewDep,
    savingNew,
    datosLoading, datosSaving, datosMsg,
    suscripcion, cancelingSub,
    showCancelConfirm, setShowCancelConfirm,
    subCanceled,
    loadDatosTab, handleCancelSub, handleSaveDatos,
    updateDep, toggleDepDisc, handleSaveDep, handleAddDep,
  };
}

export default function ProfileModal({ open, onClose, user }: ProfileModalProps) {
  const isMedico = user?.rol === "medico" || user?.rol === "usuario_organizacion";
  const showDatosTab = !isMedico && (user?.rol === "usuario" || user?.rol === "intermediario");
  const isIntermediario = user?.rol === "intermediario";

  const [activeTab, setActiveTab] = useState<"avatar" | "datos">("avatar");

  const datosTab = useProfileDatosTab(user, isIntermediario);
  const { loadDatosTab, showCancelConfirm, setShowCancelConfirm, cancelingSub, handleCancelSub } = datosTab;

  const [avatar, dispatchAvatar] = useReducer(avatarReducer, user, computeInitialAvatarState);
  const { seed, hairStyle, hairColor, skinColor, bgColor, eyes, brows, mouth, mustache } = avatar;
  const [photoPreview, setPhotoPreview] = useState<string>(() =>
    isMedico && user?.foto && !user.foto.includes("dicebear.com") ? user.foto : ""
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status,      setStatus]      = useState<{ type: "success" | "error" | ""; msg: string }>({ type: "", msg: "" });
  const [loading,     setLoading]     = useState(false);
  const [saved,       setSaved]       = useState(false);

  useEffect(() => {
    // El scroll vertical cuelga de <html> (globals.css fija overflow-x en html),
    // así que bloquear solo body deja la página moviéndose bajo el modal.
    if (open) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [open]);

  // El snap del hero escucha wheel/touch en window y mueve la página con
  // scrollTo, que es programático y se salta el overflow:hidden de arriba.
  // Cortando la propagación en captura nunca llega a esos listeners, y como
  // no se hace preventDefault el modal sigue scrolleando por dentro.
  useEffect(() => {
    if (!open) return;
    const frenar = (e: Event) => e.stopPropagation();
    const eventos = ["wheel", "touchstart", "touchend", "touchmove"] as const;
    for (const ev of eventos) {
      window.addEventListener(ev, frenar, { capture: true, passive: true });
    }
    return () => {
      for (const ev of eventos) {
        window.removeEventListener(ev, frenar, { capture: true });
      }
    };
  }, [open]);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaved(false);
    setStatus({ type: "", msg: "" });
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 400;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
        setPhotoPreview(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!photoPreview || loading || saved) return;
    setLoading(true);
    setStatus({ type: "", msg: "" });
    try {
      const savedUrl = await perfilService.updateFoto(user!.id!, photoPreview, user!.rol);
      sessionStorage.setItem("r65_user:v1", JSON.stringify({ ...user, foto: savedUrl }));
      window.dispatchEvent(new CustomEvent("r65:authed"));
      setSaved(true);
      setTimeout(onClose, 700);
    } catch (err) {
      setStatus({ type: "error", msg: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setLoading(false);
    }
  };

  if (!open || !user) return null;

  const currentUrl = buildUrl(seed, hairStyle, hairColor, skinColor, bgColor, eyes, brows, mouth, mustache);

  const handleSaveAvatar = async () => {
    if (loading || saved) return;
    setLoading(true);
    setStatus({ type: "", msg: "" });
    try {
      await perfilService.updateFoto(user.id!, currentUrl);
      sessionStorage.setItem("r65_user:v1", JSON.stringify({ ...user, foto: currentUrl }));
      window.dispatchEvent(new CustomEvent("r65:authed"));
      setSaved(true);
      setTimeout(onClose, 700);
    } catch (err) {
      setStatus({ type: "error", msg: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTab = (tab: "avatar" | "datos") => {
    setActiveTab(tab);
    if (tab === "datos" && activeTab !== "datos") loadDatosTab();
  };

  return (
    <>
      <dialog
        ref={dialogRef}
        className="pm-dialog"
        aria-labelledby="pm-title" style={PM_MODAL}
        onCancel={e => { e.preventDefault(); onClose(); }}
      >
        <ProfileModalHeader
          onClose={onClose}
          showDatosTab={showDatosTab}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
        />

        {/* Content */}
        <div style={{ padding: 18, overflowY: "auto", overscrollBehavior: "contain", flex: 1 }}>
          {/* ── Pestaña Mis datos ── */}
          {activeTab === "datos" && showDatosTab && (
            <ProfileDatosTab
              {...datosTab}
              isIntermediario={isIntermediario}
              user={user}
            />
          )}

          {status.msg && (
            <div style={{ ...PM_STATUS_BASE, background: status.type === "success" ? "#FDF2F8" : "#FFF5F5", color: status.type === "success" ? "var(--teal)" : "#E74C3C" }}>
              {status.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {status.msg}
            </div>
          )}

          {/* ── Pestaña avatar / foto ── */}
          {activeTab === "avatar" && isMedico && (
            <ProfileMedicoPhotoTab
              photoPreview={photoPreview}
              setPhotoPreview={setPhotoPreview}
              setSaved={setSaved}
              setStatus={setStatus}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              handleSavePhoto={handleSavePhoto}
              loading={loading}
              saved={saved}
            />
          )}

          {activeTab === "avatar" && !isMedico && (
            <ProfileAvatarCustomTab
              bgColor={bgColor}
              currentUrl={currentUrl}
              hairStyle={hairStyle}
              eyes={eyes}
              brows={brows}
              mouth={mouth}
              mustache={mustache}
              hairColor={hairColor}
              skinColor={skinColor}
              dispatchAvatar={dispatchAvatar}
              handleSaveAvatar={handleSaveAvatar}
              loading={loading}
              saved={saved}
            />
          )}

        </div>

        {/* Confirmación de cancelación de suscripción */}
        {showCancelConfirm && (
          <ProfileCancelSubscriptionDialog
            cancelingSub={cancelingSub}
            onDismiss={() => setShowCancelConfirm(false)}
            onConfirm={handleCancelSub}
          />
        )}
      </dialog>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -50%) translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) translateY(0)    scale(1);    }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes confirmFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes confirmPop {
          from { opacity: 0; transform: translateY(10px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .pm-scroll { scrollbar-width: none; }
        .pm-scroll::-webkit-scrollbar { display: none; }
        .pm-dialog::backdrop { background: rgba(0,0,0,0.45); backdrop-filter: blur(5px); }
      `}</style>
    </>
  );
}
