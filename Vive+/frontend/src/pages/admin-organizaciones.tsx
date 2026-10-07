"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Settings2, Building2, Globe, Mail, Phone, MapPin, UserPlus } from "lucide-react";
import { CatPanel } from "@/frontend/src/components/admin-cat-panel";
import { organizacionesService } from "@/frontend/src/services/organizacionesService";
import { AdminShell } from "@/frontend/src/components/admin/AdminShell";
import {
  C, T, R, carta, campo, distintivo, rejillaCampos,
  btnPrimario, btnSecundario, btnMini, seccionTitulo,
} from "@/frontend/src/components/admin/ui";
import {
  Aviso, Barra, BotonIcono, Buscador, Campo, Confirmar, Esqueleto,
  Fila, FilaAcciones, FilaPrincipal, Recuento, Vacio, useConfirmacion,
} from "@/frontend/src/components/admin/primitives";

type CatOrgDB = { id: number; key: string; label: string; color: string };

const TIPO_COLORS_FALLBACK: Record<string, string> = {
  ong: "#E74C3C", fundacion: "#2563EB", empresa: "#27AE60",
};

type Servicio = { nombre: string; descripcion: string };

type Organizacion = {
  id: number;
  usuario_organizacion_id: number | null;
  nombre: string;
  organizaciones_categoria_id: number | null;
  tipo: string;
  descripcion: string;
  web: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  estado: string | null;
  logo_url: string | null;
  servicios: Servicio[];
};

type FormData = {
  nombre: string;
  organizaciones_categoria_id: number;
  descripcion: string;
  web: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  estado: string;
  logo_url: string;
  servicios: Servicio[];
};

const EMPTY_FORM: FormData = {
  nombre: "", organizaciones_categoria_id: 0, descripcion: "", web: "", email: "",
  telefono: "", direccion: "", ciudad: "", estado: "", logo_url: "", servicios: [],
};

type UserOrgFormData = {
  nombre: string;
  password: string;
  photo_url: string;
  descripcion: string;
  organizaciones_categoria_id: number;
  web: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  estado: string;
};

const EMPTY_USER_ORG_FORM: UserOrgFormData = {
  nombre: "", password: "", photo_url: "", descripcion: "",
  organizaciones_categoria_id: 0, web: "", email: "",
  telefono: "", direccion: "", ciudad: "", estado: "",
};

const buildBody = (form: FormData, id?: number) => ({
  ...(id != null ? { id } : {}),
  nombre:                      form.nombre,
  organizaciones_categoria_id: form.organizaciones_categoria_id || null,
  descripcion:                 form.descripcion,
  web:                         form.web || null,
  email:                       form.email || null,
  telefono:                    form.telefono || null,
  direccion:                   form.direccion || null,
  ciudad:                      form.ciudad || null,
  estado:                      form.estado || null,
  logo_url:                    form.logo_url || null,
  servicios:                   form.servicios.filter(s => s.nombre.trim()),
});

async function uploadImagen(file: File): Promise<string | null> {
  const fd = new window.FormData();
  fd.append("imagen", file);
  const res = await fetch("/api/upload-imagen", { method: "POST", body: fd });
  const data = await res.json();
  return res.ok && data.url ? data.url : null;
}

const toFormData = (o: Organizacion): FormData => ({
  nombre:                      o.nombre,
  organizaciones_categoria_id: o.organizaciones_categoria_id ?? 0,
  descripcion:                 o.descripcion,
  web:                         o.web ?? "",
  email:                       o.email ?? "",
  telefono:                    o.telefono ?? "",
  direccion:                   o.direccion ?? "",
  ciudad:                      o.ciudad ?? "",
  estado:                      o.estado ?? "",
  logo_url:                    o.logo_url ?? "",
  servicios:                   o.servicios ?? [],
});

const formatTelefono = (bruto: string) =>
  bruto.replace(/\D/g, "").slice(0, 9).replace(/(\d{3})(\d{3})(\d{0,3})/, "$1 $2 $3").trim();

// El logo se sube por fichero pero lo que se guarda es una URL: mostrar la
// miniatura junto al selector evita subir dos veces por no saber si prendió.
function SelectorLogo({ id, url, onSubir }: { id: string; url: string; onSubir: (url: string) => void }) {
  const [subiendo, setSubiendo] = useState(false);
  // El logo sale de usuarios.foto, donde hay de todo: subidas nuestras, enlaces
  // externos y algun data URI. Si el optimizador no puede con uno —un SVG
  // remoto sin extension, por ejemplo— se guarda cual fallo y queda el icono,
  // que es lo mismo que se ve cuando no hay logo.
  const [logoFallido, setLogoFallido] = useState<string | null>(null);

  const alElegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    const nueva = await uploadImagen(file);
    if (nueva) onSubir(nueva);
    setSubiendo(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 44, height: 44, flexShrink: 0, borderRadius: R.chico,
        border: `1px solid ${C.borde}`, background: C.lienzo,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", color: C.tenue,
      }}>
        {url && logoFallido !== url
          ? <Image
              src={url}
              alt=""
              width={44}
              height={44}
              onError={() => setLogoFallido(url)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          : <Building2 size={18} />}
      </div>
      <input id={id} aria-label="Logo" type="file" accept="image/*" onChange={alElegir} style={{ ...campo, padding: "7px 12px" }} />
      {subiendo && <span style={{ fontSize: T.micro, color: C.suave, whiteSpace: "nowrap" }}>Subiendo…</span>}
    </div>
  );
}

function ServiciosEditor({ items, onChange }: { items: Servicio[]; onChange: (s: Servicio[]) => void }) {
  const [keys, setKeys] = useState<string[]>(() => items.map(() => crypto.randomUUID()));
  // Al abrir otra organizacion los servicios llegan por props sin pasar por
  // add/remove: se reponen las claves que falten para no usar el indice como key.
  if (keys.length !== items.length) {
    setKeys(items.map((_, i) => keys[i] ?? crypto.randomUUID()));
  }
  const add    = () => { setKeys(k => [...k, crypto.randomUUID()]); onChange([...items, { nombre: "", descripcion: "" }]); };
  const remove = (i: number) => { setKeys(k => k.filter((_, idx) => idx !== i)); onChange(items.filter((_, idx) => idx !== i)); };
  const update = (i: number, key: keyof Servicio, val: string) =>
    onChange(items.map((s, idx) => idx === i ? { ...s, [key]: val } : s));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ ...seccionTitulo, margin: 0 }}>Servicios</span>
        <button type="button" onClick={add} style={btnMini}>
          <Plus size={12} /> Añadir servicio
        </button>
      </div>

      {items.length === 0 ? (
        <p style={{ fontSize: T.micro, color: C.tenue, margin: 0 }}>
          Sin servicios. Son las prestaciones que se listan en la ficha pública.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((s, i) => (
            <div key={keys[i]} style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
              <input
                aria-label={`Nombre del servicio ${i + 1}`}
                placeholder="Ej: Acompañamiento"
                value={s.nombre}
                onChange={e => update(i, "nombre", e.target.value)}
                style={{ ...campo, flex: "1 1 160px" }}
              />
              <input
                aria-label={`Descripción del servicio ${i + 1}`}
                placeholder="Descripción (opcional)"
                value={s.descripcion}
                onChange={e => update(i, "descripcion", e.target.value)}
                style={{ ...campo, flex: "2 1 220px" }}
              />
              <BotonIcono titulo="Eliminar servicio" onClick={() => remove(i)}>
                <X size={14} />
              </BotonIcono>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrgForm({ initial, onSave, onCancel, saving, tipos, onCatUpdate, titulo }: {
  initial: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  saving: boolean;
  tipos: CatOrgDB[];
  onCatUpdate: () => void;
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

      <div>
        <p style={seccionTitulo}>Identidad</p>
        <div style={rejillaCampos}>
          <Campo id="org-nombre" titulo="Nombre *">
            <input id="org-nombre" required value={form.nombre} onChange={e => set("nombre", e.target.value)} style={campo} placeholder="Nombre de la organización" />
          </Campo>

          <Campo id="org-tipo" titulo="Tipo">
            <div style={{ display: "flex", gap: 8 }}>
              <select id="org-tipo" aria-label="Tipo" value={String(form.organizaciones_categoria_id)} onChange={e => set("organizaciones_categoria_id", Number(e.target.value))} style={{ ...campo, flex: 1 }}>
                {tipos.map(t => <option key={t.key} value={String(t.id)}>{t.label}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setShowCats(s => !s)}
                style={{ ...btnSecundario, padding: "0 12px", fontSize: T.micro, ...(showCats ? { background: C.marcaSuave, color: C.marca, borderColor: C.marcaBorde } : null) }}
              >
                <Settings2 size={13} /> {showCats ? "Cerrar" : "Gestionar"}
              </button>
            </div>
            {showCats && <CatPanel tipo="organizaciones" onUpdate={onCatUpdate} />}
          </Campo>

          <Campo id="org-logo" titulo="Logo" ancho>
            <SelectorLogo id="org-logo" url={form.logo_url} onSubir={u => set("logo_url", u)} />
          </Campo>

          <Campo id="org-descripcion" titulo="Descripción" ancho>
            <textarea id="org-descripcion" value={form.descripcion} onChange={e => set("descripcion", e.target.value)} rows={3} style={{ ...campo, resize: "vertical" }} placeholder="Descripción de la organización" />
          </Campo>
        </div>
      </div>

      <div>
        <p style={seccionTitulo}>Contacto y ubicación</p>
        <div style={rejillaCampos}>
          <Campo id="org-web" titulo="Web">
            <input id="org-web" value={form.web} onChange={e => set("web", e.target.value)} style={campo} placeholder="https://…" />
          </Campo>
          <Campo id="org-email" titulo="Email">
            <input id="org-email" type="email" value={form.email} onChange={e => set("email", e.target.value)} style={campo} placeholder="info@ejemplo.es" />
          </Campo>
          <Campo id="org-telefono" titulo="Teléfono">
            <input id="org-telefono" value={form.telefono} onChange={e => set("telefono", formatTelefono(e.target.value))} style={campo} placeholder="600 123 456" />
          </Campo>
          <Campo id="org-ciudad" titulo="Ciudad">
            <input id="org-ciudad" value={form.ciudad} onChange={e => set("ciudad", e.target.value)} style={campo} placeholder="Santander" />
          </Campo>
          <Campo id="org-estado" titulo="Provincia">
            <input id="org-estado" value={form.estado} onChange={e => set("estado", e.target.value)} style={campo} placeholder="Cantabria" />
          </Campo>
          <Campo id="org-direccion" titulo="Dirección" ancho>
            <input id="org-direccion" value={form.direccion} onChange={e => set("direccion", e.target.value)} style={campo} placeholder="Calle Ejemplo 1" />
          </Campo>
        </div>
      </div>

      <ServiciosEditor items={form.servicios} onChange={s => set("servicios", s)} />

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${C.bordeTenue}`, paddingTop: 16 }}>
        <button type="button" onClick={onCancel} style={btnSecundario}>Cancelar</button>
        <button type="submit" disabled={saving} style={{ ...btnPrimario, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Guardando…" : <><Check size={14} /> Guardar</>}
        </button>
      </div>
    </form>
  );
}

function UserOrgFormPanel({ userOrgForm, setUserOrgForm, userOrgError, tipos, savingUserOrg, onCancel, onSubmit }: {
  userOrgForm: UserOrgFormData;
  setUserOrgForm: React.Dispatch<React.SetStateAction<UserOrgFormData>>;
  userOrgError: string | null;
  tipos: CatOrgDB[];
  savingUserOrg: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const set = (key: keyof UserOrgFormData, value: unknown) => setUserOrgForm(f => ({ ...f, [key]: value }));

  return (
    <div style={{ ...carta, padding: 20, marginBottom: 16, borderColor: C.marcaBorde }}>
      <h2 style={{ margin: 0, fontSize: T.seccion, fontWeight: 700, color: C.texto }}>Nueva cuenta de organización</h2>
      <p style={{ fontSize: T.dato, color: C.suave, margin: "5px 0 18px", lineHeight: 1.6 }}>
        Crea un usuario con rol organización. El nombre se usará como identificador de acceso, así que
        conviene que sea el que la organización va a escribir al entrar.
      </p>

      {userOrgError && <Aviso>{userOrgError}</Aviso>}

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <p style={seccionTitulo}>Acceso</p>
          <div style={rejillaCampos}>
            <Campo id="userorg-nombre" titulo="Nombre de la empresa *">
              <input id="userorg-nombre" required value={userOrgForm.nombre} onChange={e => set("nombre", e.target.value)} style={campo} placeholder="Cruz Roja Santander" />
            </Campo>
            <Campo id="userorg-password" titulo="Contraseña *" pista="Mínimo 6 caracteres.">
              <input id="userorg-password" required type="password" value={userOrgForm.password} onChange={e => set("password", e.target.value)} style={campo} placeholder="••••••" />
            </Campo>
            <Campo id="userorg-logo" titulo="Logo" ancho>
              <SelectorLogo id="userorg-logo" url={userOrgForm.photo_url} onSubir={u => set("photo_url", u)} />
            </Campo>
          </div>
        </div>

        <div>
          <p style={seccionTitulo}>Ficha pública</p>
          <div style={rejillaCampos}>
            <Campo id="userorg-tipo" titulo="Tipo">
              <select id="userorg-tipo" aria-label="Tipo" value={String(userOrgForm.organizaciones_categoria_id)} onChange={e => set("organizaciones_categoria_id", Number(e.target.value))} style={campo}>
                <option value="0">Sin tipo</option>
                {tipos.map(t => <option key={t.key} value={String(t.id)}>{t.label}</option>)}
              </select>
            </Campo>
            <Campo id="userorg-telefono" titulo="Teléfono">
              <input id="userorg-telefono" value={userOrgForm.telefono} onChange={e => set("telefono", formatTelefono(e.target.value))} style={campo} placeholder="600 123 456" />
            </Campo>
            <Campo id="userorg-web" titulo="Web">
              <input id="userorg-web" value={userOrgForm.web} onChange={e => set("web", e.target.value)} style={campo} placeholder="https://…" />
            </Campo>
            <Campo id="userorg-email" titulo="Email público">
              <input id="userorg-email" type="email" value={userOrgForm.email} onChange={e => set("email", e.target.value)} style={campo} placeholder="info@ejemplo.es" />
            </Campo>
            <Campo id="userorg-ciudad" titulo="Ciudad">
              <input id="userorg-ciudad" value={userOrgForm.ciudad} onChange={e => set("ciudad", e.target.value)} style={campo} placeholder="Santander" />
            </Campo>
            <Campo id="userorg-estado" titulo="Provincia">
              <input id="userorg-estado" value={userOrgForm.estado} onChange={e => set("estado", e.target.value)} style={campo} placeholder="Cantabria" />
            </Campo>
            <Campo id="userorg-direccion" titulo="Dirección" ancho>
              <input id="userorg-direccion" value={userOrgForm.direccion} onChange={e => set("direccion", e.target.value)} style={campo} placeholder="Calle Ejemplo 1" />
            </Campo>
            <Campo id="userorg-descripcion" titulo="Descripción" ancho>
              <textarea id="userorg-descripcion" value={userOrgForm.descripcion} onChange={e => set("descripcion", e.target.value)} rows={3} style={{ ...campo, resize: "vertical" }} placeholder="Descripción de la organización" />
            </Campo>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${C.bordeTenue}`, paddingTop: 16, marginTop: 18 }}>
        <button type="button" onClick={onCancel} style={btnSecundario}>Cancelar</button>
        <button type="button" onClick={onSubmit} disabled={savingUserOrg} style={{ ...btnPrimario, background: C.marca, opacity: savingUserOrg ? 0.7 : 1 }}>
          {savingUserOrg ? "Creando…" : <><UserPlus size={14} /> Crear cuenta</>}
        </button>
      </div>
    </div>
  );
}

function Contacto({ icono, children, href }: { icono: React.ReactNode; children: React.ReactNode; href?: string }) {
  const contenido = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: T.micro, color: href ? C.marca : C.suave }}>
      {icono} {children}
    </span>
  );
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{contenido}</a>
    : contenido;
}

export default function AdminOrganizacionesPage() {
  const [orgs,            setOrgs]            = useState<Organizacion[]>([]);
  const [tipos,           setTipos]           = useState<CatOrgDB[]>([]);
  const [cargando,        setCargando]        = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [creando,         setCreando]         = useState(false);
  const [editandoId,      setEditandoId]      = useState<number | null>(null);
  const [guardando,       setGuardando]       = useState(false);
  const [abiertoId,       setAbiertoId]       = useState<number | null>(null);
  const [creandoUserOrg,  setCreandoUserOrg]  = useState(false);
  const [savingUserOrg,   setSavingUserOrg]   = useState(false);
  const [userOrgForm,     setUserOrgForm]     = useState<UserOrgFormData>(EMPTY_USER_ORG_FORM);
  const [userOrgError,    setUserOrgError]    = useState<string | null>(null);
  const [busqueda,        setBusqueda]        = useState("");
  const [tipoFiltro,      setTipoFiltro]      = useState("");

  const borrado = useConfirmacion<Organizacion>();

  const fetchTipos = () => {
    organizacionesService.getCategoriasOrganizaciones()
      .then(cats => setTipos(cats))
      .catch(() => {});
  };

  useEffect(() => { fetchTipos(); }, []);

  const tipoColor = (key: string) => tipos.find(t => t.key === key)?.color ?? TIPO_COLORS_FALLBACK[key] ?? C.marca;
  const tipoLabel = (key: string) => tipos.find(t => t.key === key)?.label ?? key;

  const fetchOrgs = async () => {
    try {
      const data = await organizacionesService.getOrganizacionesAdmin();
      setOrgs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando organizaciones");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { void fetchOrgs(); }, []);

  const handleCreateUserOrg = async () => {
    if (!userOrgForm.nombre.trim() || !userOrgForm.password.trim()) {
      setUserOrgError("El nombre y la contraseña son obligatorios.");
      return;
    }
    setUserOrgError(null);
    setSavingUserOrg(true);
    try {
      await organizacionesService.crearUsuarioOrganizacion({
        nombre:                      userOrgForm.nombre.trim(),
        password:                    userOrgForm.password,
        photo_url:                   userOrgForm.photo_url.trim() || null,
        descripcion:                 userOrgForm.descripcion,
        organizaciones_categoria_id: userOrgForm.organizaciones_categoria_id || null,
        web:                         userOrgForm.web.trim() || null,
        email:                       userOrgForm.email.trim() || null,
        telefono:                    userOrgForm.telefono.trim() || null,
        direccion:                   userOrgForm.direccion.trim() || null,
        ciudad:                      userOrgForm.ciudad.trim() || null,
        estado:                      userOrgForm.estado.trim() || null,
      });
      setCreandoUserOrg(false);
      setUserOrgForm(EMPTY_USER_ORG_FORM);
      await fetchOrgs();
    } catch (e) {
      setUserOrgError(e instanceof Error ? e.message : "Error al crear la cuenta");
    } finally {
      setSavingUserOrg(false);
    }
  };

  const handleCreate = async (form: FormData) => {
    setGuardando(true);
    try {
      await organizacionesService.crearOrganizacion(buildBody(form));
      setCreando(false);
      setError(null);
      await fetchOrgs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear organización");
    } finally {
      setGuardando(false);
    }
  };

  const handleEdit = async (form: FormData) => {
    if (editandoId == null) return;
    setGuardando(true);
    try {
      await organizacionesService.editarOrganizacion(editandoId, buildBody(form));
      setEditandoId(null);
      setError(null);
      await fetchOrgs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al editar organización");
    } finally {
      setGuardando(false);
    }
  };

  const conCuenta   = orgs.filter(o => o.usuario_organizacion_id).length;
  const conServicio = orgs.filter(o => o.servicios?.length > 0).length;

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return orgs
      .filter(o => !tipoFiltro || o.tipo === tipoFiltro)
      .filter(o =>
        !texto ||
        o.nombre.toLowerCase().includes(texto) ||
        (o.ciudad ?? "").toLowerCase().includes(texto) ||
        (o.email ?? "").toLowerCase().includes(texto)
      );
  }, [orgs, tipoFiltro, busqueda]);

  return (
    <AdminShell
      titulo="Organizaciones"
      descripcion="Fichas del directorio, sus servicios y las cuentas de acceso."
      acciones={
        <>
          <button
            type="button"
            onClick={() => { setCreandoUserOrg(true); setCreando(false); setEditandoId(null); setUserOrgError(null); }}
            style={{ ...btnSecundario, color: C.marca, borderColor: C.marcaBorde }}
          >
            <UserPlus size={14} /> Nueva cuenta
          </button>
          <button type="button" onClick={() => { setCreando(true); setCreandoUserOrg(false); setEditandoId(null); }} style={btnPrimario}>
            <Plus size={14} /> Nueva organización
          </button>
        </>
      }
      enlacePublico={{ href: "/organizaciones", texto: "Ver directorio" }}
      kpis={[
        { etiqueta: "Organizaciones", valor: orgs.length },
        { etiqueta: "Con cuenta",     valor: conCuenta, tono: "marca", pie: "pueden entrar al panel" },
        { etiqueta: "Con servicios",  valor: conServicio, tono: conServicio < orgs.length ? "aviso" : "ok" },
        { etiqueta: "Tipos",          valor: tipos.length },
      ]}
    >
      {borrado.pendiente && (
        <Confirmar
          titulo="Eliminar organización"
          mensaje={<>Se eliminará <strong style={{ color: C.texto }}>{borrado.pendiente.nombre}</strong> del directorio. Esta acción no se puede deshacer.</>}
          ocupado={borrado.ocupado}
          onCancelar={borrado.cancelar}
          onConfirmar={() => borrado.ejecutar(async o => {
            try {
              await organizacionesService.eliminarOrganizacion(o.id);
              await fetchOrgs();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Error al eliminar organización");
            }
          })}
        />
      )}

      {error && <Aviso>{error}</Aviso>}

      {creandoUserOrg && (
        <UserOrgFormPanel
          userOrgForm={userOrgForm}
          setUserOrgForm={setUserOrgForm}
          userOrgError={userOrgError}
          tipos={tipos}
          savingUserOrg={savingUserOrg}
          onCancel={() => { setCreandoUserOrg(false); setUserOrgForm(EMPTY_USER_ORG_FORM); setUserOrgError(null); }}
          onSubmit={handleCreateUserOrg}
        />
      )}

      {creando && (
        <OrgForm
          titulo="Nueva organización"
          initial={EMPTY_FORM}
          onSave={handleCreate}
          onCancel={() => setCreando(false)}
          saving={guardando}
          tipos={tipos}
          onCatUpdate={fetchTipos}
        />
      )}

      {cargando ? (
        <Esqueleto filas={4} />
      ) : (
        <>
          {orgs.length > 0 && (
            <Barra>
              <Buscador valor={busqueda} onCambio={setBusqueda} marcador="Buscar por nombre, ciudad o email…" />
              <select
                value={tipoFiltro}
                onChange={e => setTipoFiltro(e.target.value)}
                aria-label="Filtrar por tipo"
                style={{ ...campo, width: "auto", minWidth: 150 }}
              >
                <option value="">Todos los tipos</option>
                {tipos.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
              <Recuento>{visibles.length} de {orgs.length}</Recuento>
            </Barra>
          )}

          {visibles.length === 0 ? (
            <Vacio
              icono={<Building2 size={24} />}
              titulo={orgs.length === 0 ? "Todavía no hay organizaciones" : "Ninguna organización coincide"}
              texto={orgs.length === 0 ? "Añade la primera ficha para que aparezca en el directorio." : "Prueba con otro término o cambia el tipo."}
              accion={orgs.length === 0 ? (
                <button type="button" onClick={() => setCreando(true)} style={btnPrimario}>
                  <Plus size={14} /> Añadir la primera
                </button>
              ) : null}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibles.map(o => {
                const editando = editandoId === o.id;
                const abierto  = abiertoId === o.id && !editando;
                const color    = tipoColor(o.tipo);

                return (
                  <Fila
                    key={o.id}
                    franja={color}
                    desplegado={
                      editando ? (
                        <OrgForm
                          titulo="Editar organización"
                          initial={toFormData(o)}
                          onSave={handleEdit}
                          onCancel={() => setEditandoId(null)}
                          saving={guardando}
                          tipos={tipos}
                          onCatUpdate={fetchTipos}
                        />
                      ) : abierto ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          <p style={{ margin: 0, fontSize: T.dato, color: C.texto, lineHeight: 1.6 }}>
                            {o.descripcion || <em style={{ color: C.tenue }}>Sin descripción</em>}
                          </p>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
                            {o.telefono  && <Contacto icono={<Phone size={12} />} href={`tel:${o.telefono.replace(/\s/g, "")}`}>{o.telefono}</Contacto>}
                            {o.email     && <Contacto icono={<Mail size={12} />} href={`mailto:${o.email}`}>{o.email}</Contacto>}
                            {o.web       && <Contacto icono={<Globe size={12} />} href={o.web}>{o.web}</Contacto>}
                            {o.direccion && <Contacto icono={<MapPin size={12} />}>{[o.direccion, o.ciudad, o.estado].filter(Boolean).join(", ")}</Contacto>}
                          </div>

                          {o.servicios?.length > 0 && (
                            <div>
                              <p style={seccionTitulo}>Servicios</p>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {o.servicios.map(s => (
                                  <div key={s.nombre} style={{
                                    background: C.superficie, border: `1px solid ${C.borde}`,
                                    borderRadius: R.chico, padding: "9px 12px",
                                  }}>
                                    <span style={{ fontSize: T.dato, fontWeight: 700, color: C.texto }}>{s.nombre}</span>
                                    {s.descripcion && (
                                      <span style={{ fontSize: T.micro, color: C.suave, marginLeft: 8 }}>{s.descripcion}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : undefined
                    }
                  >
                    <FilaPrincipal
                      titulo={o.nombre}
                      meta={
                        [
                          [o.ciudad, o.estado].filter(Boolean).join(", "),
                          o.servicios?.length ? `${o.servicios.length} servicio${o.servicios.length !== 1 ? "s" : ""}` : "sin servicios",
                        ].filter(Boolean).join(" · ")
                      }
                    >
                      <span style={{ ...distintivo("marca"), background: `${color}1A`, color }}>
                        {tipoLabel(o.tipo)}
                      </span>
                      {o.usuario_organizacion_id
                        ? <span style={distintivo("info")}>Con cuenta</span>
                        : <span style={distintivo("neutro")}>Sin cuenta</span>}
                    </FilaPrincipal>

                    <FilaAcciones>
                      <BotonIcono titulo={abierto ? "Ocultar detalles" : "Ver detalles"} onClick={() => setAbiertoId(abierto ? null : o.id)}>
                        {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </BotonIcono>
                      <BotonIcono titulo="Editar organización" onClick={() => { setEditandoId(o.id); setCreando(false); setAbiertoId(null); }}>
                        <Pencil size={14} />
                      </BotonIcono>
                      <BotonIcono titulo="Eliminar organización" tono="peligro" onClick={() => borrado.pedir(o)}>
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
