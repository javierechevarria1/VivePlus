"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Settings2, ShoppingBag, Package } from "lucide-react";
import { CatPanel } from "@/frontend/src/components/admin-cat-panel";
import { marketplaceService, type CatProductoDB } from "@/frontend/src/services/marketplaceService";
import { AdminShell } from "@/frontend/src/components/admin/AdminShell";
import {
  C, T, carta, campo, distintivo, rejillaCampos,
  btnPrimario, btnSecundario, btnMini, seccionTitulo,
} from "@/frontend/src/components/admin/ui";
import {
  Aviso, Barra, BotonIcono, Buscador, Campo, Confirmar, Esqueleto,
  Fila, FilaAcciones, FilaDato, FilaPrincipal, Miniatura, Modal,
  Recuento, Segmentos, Vacio, useConfirmacion,
} from "@/frontend/src/components/admin/primitives";

const LOCAL_DEMO = process.env.NEXT_PUBLIC_LOCAL_DEMO === "true";

type Spec = { label: string; value: string };

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  productos_categoria_id: number | null;
  categoria: string;
  imagen: string;
  stock: number;
  tamano_paquete: string | null;
  specs: Spec[];
  destacados: string[];
};

type FormData = {
  nombre: string;
  descripcion: string;
  precio: string;
  productos_categoria_id: number;
  imagen: string;
  stock: string;
  tamano_paquete: string;
  specs: Spec[];
  destacados: string[];
};

export type ProductoSegundaMano = {
  id: number;
  id_vendedor: number;
  nombre: string;
  descripcion: string;
  precio_final: string | number;
  stock: number;
  imagen: string | string[];
  estado: string;
  vendedor_nombre: string;
};

type Tab = "marketplace" | "segunda-mano";
type FiltroStock = "todos" | "disponibles" | "agotados";

const EMPTY_FORM: FormData = {
  nombre: "", descripcion: "", precio: "", productos_categoria_id: 0,
  imagen: "", stock: "0", tamano_paquete: "M", specs: [], destacados: [],
};

const TAMANOS = [
  { valor: "S", texto: "S · hasta 2 kg" },
  { valor: "M", texto: "M · hasta 5 kg" },
  { valor: "L", texto: "L · hasta 15 kg" },
];

function parsePrice(precio: string): number {
  return parseFloat(precio.replace("€", "").replace(",", ".")) || 0;
}

const bodyFromForm = (form: FormData) => ({
  nombre: form.nombre, descripcion: form.descripcion,
  precio: parsePrice(form.precio),
  productos_categoria_id: form.productos_categoria_id || null,
  imagen: form.imagen, stock: Number(form.stock),
  tamano_paquete: form.tamano_paquete,
  specs: form.specs, destacados: form.destacados,
});

const toFormData = (p: Producto): FormData => ({
  nombre:                  p.nombre,
  descripcion:             p.descripcion,
  precio:                  String(parsePrice(p.precio)),
  productos_categoria_id:  p.productos_categoria_id ?? 0,
  imagen:                  p.imagen,
  stock:                   String(p.stock),
  tamano_paquete:          p.tamano_paquete ?? "M",
  specs:                   p.specs,
  destacados:              p.destacados,
});

const primeraImagen = (imagen: string | string[]) =>
  (Array.isArray(imagen) ? imagen[0] : imagen) || "/img/placeholder.png";

function SpecsEditor({ specs, onChange }: { specs: Spec[]; onChange: (s: Spec[]) => void }) {
  const [keys, setKeys] = useState<string[]>(() => specs.map(() => crypto.randomUUID()));
  // Al abrir otro producto las specs llegan por props sin pasar por add/remove:
  // se reponen las claves que falten para no caer en el indice como key.
  if (keys.length !== specs.length) {
    setKeys(specs.map((_, i) => keys[i] ?? crypto.randomUUID()));
  }
  const add = () => {
    onChange([...specs, { label: "", value: "" }]);
    setKeys((k) => [...k, crypto.randomUUID()]);
  };
  const remove = (i: number) => {
    onChange(specs.filter((_, idx) => idx !== i));
    setKeys((k) => k.filter((_, idx) => idx !== i));
  };
  const update = (i: number, key: keyof Spec, val: string) => {
    onChange(specs.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ ...seccionTitulo, margin: 0 }}>Especificaciones</span>
        <button type="button" onClick={add} style={btnMini}><Plus size={12} /> Añadir</button>
      </div>

      {specs.length === 0 ? (
        <p style={{ fontSize: T.micro, color: C.tenue, margin: 0 }}>
          Sin especificaciones. Son la tabla de datos técnicos de la ficha del producto.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {specs.map((s, i) => (
            <div key={keys[i]} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                aria-label={`Etiqueta de la especificación ${i + 1}`}
                placeholder="Etiqueta (ej: Peso)"
                value={s.label}
                onChange={(e) => update(i, "label", e.target.value)}
                style={{ ...campo, flex: "1 1 150px" }}
              />
              <input
                aria-label={`Valor de la especificación ${i + 1}`}
                placeholder="Valor (ej: 1,2 kg)"
                value={s.value}
                onChange={(e) => update(i, "value", e.target.value)}
                style={{ ...campo, flex: "1 1 150px" }}
              />
              <BotonIcono titulo="Eliminar especificación" onClick={() => remove(i)}><X size={14} /></BotonIcono>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DestacadosEditor({ items, onChange }: { items: string[]; onChange: (d: string[]) => void }) {
  const [keys, setKeys] = useState<string[]>(() => items.map(() => crypto.randomUUID()));
  if (keys.length !== items.length) {
    setKeys(items.map((_, i) => keys[i] ?? crypto.randomUUID()));
  }
  const add = () => {
    onChange([...items, ""]);
    setKeys((k) => [...k, crypto.randomUUID()]);
  };
  const remove = (i: number) => {
    onChange(items.filter((_, idx) => idx !== i));
    setKeys((k) => k.filter((_, idx) => idx !== i));
  };
  const update = (i: number, val: string) => onChange(items.map((d, idx) => (idx === i ? val : d)));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ ...seccionTitulo, margin: 0 }}>Puntos destacados</span>
        <button type="button" onClick={add} style={btnMini}><Plus size={12} /> Añadir</button>
      </div>

      {items.length === 0 ? (
        <p style={{ fontSize: T.micro, color: C.tenue, margin: 0 }}>
          Sin destacados. Son las ventajas con tick que se ven junto al botón de comprar.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((d, i) => (
            <div key={keys[i]} style={{ display: "flex", gap: 8 }}>
              <input
                aria-label={`Destacado ${i + 1}`}
                placeholder="Ej: Envío gratuito"
                value={d}
                onChange={(e) => update(i, e.target.value)}
                style={{ ...campo, flex: 1 }}
              />
              <BotonIcono titulo="Eliminar destacado" onClick={() => remove(i)}><X size={14} /></BotonIcono>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductoForm({ initial, onSave, onCancel, saving, categorias, onCatUpdate, titulo }: {
  initial: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  saving: boolean;
  categorias: CatProductoDB[];
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
        <p style={seccionTitulo}>Producto</p>
        <div style={rejillaCampos}>
          <Campo id="producto-nombre" titulo="Nombre *">
            <input id="producto-nombre" required value={form.nombre} onChange={(e) => set("nombre", e.target.value)} style={campo} placeholder="Nombre del producto" />
          </Campo>

          <Campo id="producto-categoria" titulo="Categoría">
            <div style={{ display: "flex", gap: 8 }}>
              <select id="producto-categoria" aria-label="Categoría" value={form.productos_categoria_id} onChange={(e) => set("productos_categoria_id", Number(e.target.value))} style={{ ...campo, flex: 1 }}>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setShowCats(s => !s)}
                style={{ ...btnSecundario, padding: "0 12px", fontSize: T.micro, ...(showCats ? { background: C.marcaSuave, color: C.marca, borderColor: C.marcaBorde } : null) }}
              >
                <Settings2 size={13} /> {showCats ? "Cerrar" : "Gestionar"}
              </button>
            </div>
            {showCats && <CatPanel tipo="productos" onUpdate={onCatUpdate} />}
          </Campo>

          <Campo id="producto-descripcion" titulo="Descripción" ancho>
            <textarea id="producto-descripcion" value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} rows={3} style={{ ...campo, resize: "vertical" }} placeholder="Descripción breve del producto" />
          </Campo>

          <Campo id="producto-imagen" titulo="Imagen (URL o ruta)" ancho>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <input id="producto-imagen" value={form.imagen} onChange={(e) => set("imagen", e.target.value)} style={{ ...campo, flex: 1 }} placeholder="/img/producto.png" />
              {form.imagen && (
                <Miniatura tamano={56}>
                  <Image fill sizes="56px" src={form.imagen} alt="" style={{ objectFit: "contain", padding: 4 }} unoptimized />
                </Miniatura>
              )}
            </div>
          </Campo>
        </div>
      </div>

      <div>
        <p style={seccionTitulo}>Venta y envío</p>
        <div style={rejillaCampos}>
          <Campo id="producto-precio" titulo="Precio (€) *">
            <input id="producto-precio" required type="number" min="0" step="0.01" value={form.precio} onChange={(e) => set("precio", e.target.value)} style={campo} placeholder="0.00" />
          </Campo>

          <Campo id="producto-stock" titulo="Stock" pista="A 0 el producto sale como agotado.">
            <input id="producto-stock" type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} style={campo} placeholder="0" />
          </Campo>

          {/* Decide el porte que se le cobra al comprador. Sin esto una tablet
              pagaría lo mismo que un pastillero y la diferencia la pone la casa. */}
          <Campo id="producto-tamano" titulo="Tamaño de envío" pista="Determina el porte que se cobra al comprador.">
            <select id="producto-tamano" aria-label="Tamaño de envío" value={form.tamano_paquete} onChange={(e) => set("tamano_paquete", e.target.value)} style={campo}>
              {TAMANOS.map(t => <option key={t.valor} value={t.valor}>{t.texto}</option>)}
            </select>
          </Campo>
        </div>
      </div>

      <SpecsEditor specs={form.specs} onChange={(s) => set("specs", s)} />
      <DestacadosEditor items={form.destacados} onChange={(d) => set("destacados", d)} />

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${C.bordeTenue}`, paddingTop: 16 }}>
        <button type="button" onClick={onCancel} style={btnSecundario}>Cancelar</button>
        <button type="submit" disabled={saving} style={{ ...btnPrimario, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Guardando…" : <><Check size={14} /> Guardar</>}
        </button>
      </div>
    </form>
  );
}

// Retirar un producto de segunda mano manda un email al vendedor, así que el
// motivo es obligatorio: no es el mismo diálogo que borrar del catálogo propio.
function RetirarSegundaManoModal({ producto, motivo, setMotivo, ocupado, onCancel, onConfirm, demoLocal }: {
  producto: ProductoSegundaMano;
  motivo: string;
  setMotivo: (v: string) => void;
  ocupado: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  demoLocal: boolean;
}) {
  return (
    <Modal titulo="Retirar producto" subtitulo={producto.nombre} onCerrar={onCancel} ancho={460}>
      <p style={{ fontSize: T.dato, color: C.suave, margin: "0 0 16px", lineHeight: 1.6 }}>
        {demoLocal
          ? <>El producto se retirará solo de esta vista de demostración. No se enviará ningún email al vendedor.</>
          : <>Se enviará un email a <strong style={{ color: C.texto }}>{producto.vendedor_nombre}</strong> con
            el motivo que escribas. Esta acción no se puede deshacer.</>}
      </p>

      <label style={{ display: "block", fontSize: T.micro, fontWeight: 600, color: C.suave, marginBottom: 6 }} htmlFor="segunda-mano-motivo">
        Motivo del retiro *
      </label>
      <textarea
        id="segunda-mano-motivo"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        rows={4}
        placeholder="Indica el motivo por el que se retira este producto de la plataforma…"
        style={{ ...campo, resize: "vertical", marginBottom: 20 }}
        autoFocus
      />

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={btnSecundario}>Cancelar</button>
        <button
          type="button"
          disabled={!motivo.trim() || ocupado}
          onClick={onConfirm}
          style={{
            ...btnPrimario,
            background: !motivo.trim() || ocupado ? "#F0A9A9" : C.error,
            cursor: !motivo.trim() || ocupado ? "not-allowed" : "pointer",
          }}
        >
          <Trash2 size={14} /> {ocupado ? "Retirando…" : demoLocal ? "Retirar (solo demo)" : "Retirar y notificar"}
        </button>
      </div>
    </Modal>
  );
}

export default function AdminMarketplacePage({ initialSegundaMano }: { initialSegundaMano: ProductoSegundaMano[] }) {
  const [tab,          setTab]          = useState<Tab>("marketplace");
  const [productos,    setProductos]    = useState<Producto[]>([]);
  const [segundaMano,  setSegundaMano]  = useState<ProductoSegundaMano[]>(initialSegundaMano);
  const [categorias,   setCategorias]   = useState<CatProductoDB[]>([]);
  const [cargando,     setCargando]     = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [avisoDemo,    setAvisoDemo]    = useState<string | null>(null);
  const [creando,      setCreando]      = useState(false);
  const [editandoId,   setEditandoId]   = useState<number | null>(null);
  const [guardando,    setGuardando]    = useState(false);
  const [abiertoId,    setAbiertoId]    = useState<number | null>(null);
  const [retirar,      setRetirar]      = useState<ProductoSegundaMano | null>(null);
  const [motivo,       setMotivo]       = useState("");
  const [retirando,    setRetirando]    = useState(false);
  const [busqueda,     setBusqueda]     = useState("");
  const [filtroStock,  setFiltroStock]  = useState<FiltroStock>("todos");
  const montado = useRef(true);
  useEffect(() => () => { montado.current = false; }, []);

  const borrado = useConfirmacion<Producto>();

  const fetchCategorias = () => {
    marketplaceService.getCategoriasProductos()
      .then(cats => { if (montado.current && cats.length > 0) setCategorias(cats); })
      .catch(() => {});
  };

  useEffect(() => { fetchCategorias(); }, []);

  const fetchProductos = async () => {
    try {
      const data = await marketplaceService.getProductos();
      if (montado.current) setProductos(data);
    } catch {
      if (montado.current) setError("Error cargando productos");
    } finally {
      if (montado.current) setCargando(false);
    }
  };

  const fetchSegundaMano = async () => {
    try {
      const res = await fetch("/api/segunda-mano");
      const json = await res.json();
      if (montado.current && json.ok) setSegundaMano(json.data);
    } catch { /* silent */ }
  };

  useEffect(() => { void fetchProductos(); }, []);

  const handleCreate = async (form: FormData) => {
    if (LOCAL_DEMO) {
      const body = bodyFromForm(form);
      const categoria = categorias.find(c => c.id === body.productos_categoria_id)?.nombre ?? "";
      setProductos(prev => [...prev, {
        ...body,
        id: Math.max(0, ...prev.map(p => p.id)) + 1,
        precio: `€${body.precio.toFixed(2)}`,
        categoria,
        tamano_paquete: body.tamano_paquete,
      }]);
      setCreando(false);
      setError(null);
      setAvisoDemo("Producto añadido solo en esta sesión de demostración; no se ha guardado.");
      return;
    }
    setGuardando(true);
    try {
      await marketplaceService.crearProducto(bodyFromForm(form));
      setCreando(false);
      setError(null);
      await fetchProductos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear el producto");
    } finally {
      setGuardando(false);
    }
  };

  const handleEdit = async (form: FormData) => {
    if (editandoId == null) return;
    if (LOCAL_DEMO) {
      const body = bodyFromForm(form);
      const categoria = categorias.find(c => c.id === body.productos_categoria_id)?.nombre;
      setProductos(prev => prev.map(producto => producto.id === editandoId ? {
        ...producto,
        ...body,
        precio: `€${body.precio.toFixed(2)}`,
        categoria: categoria ?? producto.categoria,
      } : producto));
      setEditandoId(null);
      setError(null);
      setAvisoDemo("Cambios aplicados solo en esta sesión de demostración; no se han guardado.");
      return;
    }
    setGuardando(true);
    try {
      await marketplaceService.editarProducto(editandoId, bodyFromForm(form));
      setEditandoId(null);
      setError(null);
      await fetchProductos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al editar el producto");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarRetirada = async () => {
    if (!retirar || !motivo.trim()) return;
    if (LOCAL_DEMO) {
      setSegundaMano(prev => prev.filter(producto => producto.id !== retirar.id));
      setRetirar(null);
      setMotivo("");
      setAvisoDemo("Producto retirado solo de esta vista de demostración; no se ha enviado ninguna notificación.");
      return;
    }
    setRetirando(true);
    try {
      const res = await fetch("/api/segunda-mano", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: retirar.id, motivo }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setRetirar(null);
      setMotivo("");
      await fetchSegundaMano();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al retirar el producto");
    } finally {
      setRetirando(false);
    }
  };

  const agotados = productos.filter(p => p.stock <= 0);
  const valorStock = productos.reduce((s, p) => s + parsePrice(p.precio) * Math.max(0, p.stock), 0);

  const productosVisibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos
      .filter(p =>
        filtroStock === "todos" ? true :
        filtroStock === "agotados" ? p.stock <= 0 : p.stock > 0
      )
      .filter(p =>
        !texto ||
        p.nombre.toLowerCase().includes(texto) ||
        (p.categoria ?? "").toLowerCase().includes(texto)
      );
  }, [productos, filtroStock, busqueda]);

  const segundaManoVisibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return segundaMano.filter(p =>
      !texto ||
      p.nombre.toLowerCase().includes(texto) ||
      (p.vendedor_nombre ?? "").toLowerCase().includes(texto)
    );
  }, [segundaMano, busqueda]);

  const esMarketplace = tab === "marketplace";

  return (
    <AdminShell
      titulo={esMarketplace ? "Catálogo de la tienda" : "Segunda mano"}
      descripcion={
        esMarketplace
          ? "Productos propios: precio, stock y ficha que ve el comprador."
          : "Publicaciones de los vendedores. Aquí solo se moderan; el alta la hace cada vendedor."
      }
      acciones={
        <>
          <Segmentos<Tab>
            valor={tab}
            onCambio={(v) => { setTab(v); setCreando(false); setEditandoId(null); setBusqueda(""); if (v === "segunda-mano") void fetchSegundaMano(); }}
            opciones={[
              { valor: "marketplace",  texto: "Catálogo",    cuenta: productos.length },
              { valor: "segunda-mano", texto: "Segunda mano", cuenta: segundaMano.length },
            ]}
          />
          {esMarketplace && (
            <button type="button" onClick={() => { setCreando(true); setEditandoId(null); }} style={btnPrimario}>
              <Plus size={14} /> Nuevo producto
            </button>
          )}
        </>
      }
      enlacePublico={{ href: esMarketplace ? "/marketplace" : "/segunda-mano", texto: "Ver tienda" }}
      kpis={
        esMarketplace
          ? [
              { etiqueta: "Productos",   valor: productos.length },
              { etiqueta: "Agotados",    valor: agotados.length, tono: agotados.length > 0 ? "aviso" : "ok" },
              { etiqueta: "Categorías",  valor: categorias.length },
              // Lo que hay inmovilizado en almacén, a precio de venta.
              { etiqueta: "Valor stock", valor: `${valorStock.toFixed(0)} €`, tono: "marca" },
            ]
          : [
              { etiqueta: "Publicados", valor: segundaMano.length },
              { etiqueta: "Vendedores", valor: new Set(segundaMano.map(p => p.id_vendedor)).size },
            ]
      }
    >
      {borrado.pendiente && (
        <Confirmar
          titulo="Eliminar producto"
          mensaje={<>Se eliminará <strong style={{ color: C.texto }}>{borrado.pendiente.nombre}</strong> del catálogo. Esta acción no se puede deshacer.</>}
          ocupado={borrado.ocupado}
          onCancelar={borrado.cancelar}
          onConfirmar={() => borrado.ejecutar(async p => {
            if (LOCAL_DEMO) {
              setProductos(prev => prev.filter(producto => producto.id !== p.id));
              setAvisoDemo("Producto eliminado solo en esta sesión de demostración; no se ha modificado la base de datos.");
              return;
            }
            try {
              await marketplaceService.eliminarProducto(p.id);
              await fetchProductos();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Error al eliminar el producto");
            }
          })}
        />
      )}

      {retirar && (
        <RetirarSegundaManoModal
          producto={retirar}
          motivo={motivo}
          setMotivo={setMotivo}
          ocupado={retirando}
          onCancel={() => { setRetirar(null); setMotivo(""); }}
          onConfirm={confirmarRetirada}
          demoLocal={LOCAL_DEMO}
        />
      )}

      {LOCAL_DEMO && <Aviso tono="aviso">Modo demo: los cambios de productos solo se mantienen mientras esta página siga abierta. Se perderán al salir o recargar, y no se modifica la base de datos.</Aviso>}
      {avisoDemo && <Aviso tono="aviso">{avisoDemo}</Aviso>}
      {error && <Aviso>{error}</Aviso>}

      {esMarketplace && creando && (
        <ProductoForm
          titulo="Nuevo producto"
          initial={EMPTY_FORM}
          onSave={handleCreate}
          onCancel={() => setCreando(false)}
          saving={guardando}
          categorias={categorias}
          onCatUpdate={fetchCategorias}
        />
      )}

      {esMarketplace ? (
        cargando ? (
          <Esqueleto filas={5} />
        ) : (
          <>
            {productos.length > 0 && (
              <Barra>
                <Buscador valor={busqueda} onCambio={setBusqueda} marcador="Buscar por nombre o categoría…" />
                <Segmentos<FiltroStock>
                  valor={filtroStock}
                  onCambio={setFiltroStock}
                  opciones={[
                    { valor: "todos",       texto: "Todos",       cuenta: productos.length },
                    { valor: "disponibles", texto: "Con stock",   cuenta: productos.length - agotados.length },
                    { valor: "agotados",    texto: "Agotados",    cuenta: agotados.length },
                  ]}
                />
                <Recuento>{productosVisibles.length} de {productos.length}</Recuento>
              </Barra>
            )}

            {productosVisibles.length === 0 ? (
              <Vacio
                icono={<Package size={24} />}
                titulo={productos.length === 0 ? "El catálogo está vacío" : "Ningún producto coincide"}
                texto={productos.length === 0 ? "Añade el primer producto para empezar a vender." : "Prueba con otro término o cambia el filtro."}
                accion={productos.length === 0 ? (
                  <button type="button" onClick={() => setCreando(true)} style={btnPrimario}>
                    <Plus size={14} /> Añadir el primero
                  </button>
                ) : null}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {productosVisibles.map((p) => {
                  const editando = editandoId === p.id;
                  const abierto  = abiertoId === p.id && !editando;

                  return (
                    <Fila
                      key={p.id}
                      destacada={p.stock <= 0}
                      desplegado={
                        editando ? (
                          <ProductoForm
                            titulo="Editar producto"
                            initial={toFormData(p)}
                            onSave={handleEdit}
                            onCancel={() => setEditandoId(null)}
                            saving={guardando}
                            categorias={categorias}
                            onCatUpdate={fetchCategorias}
                          />
                        ) : abierto ? (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
                            <div>
                              <p style={seccionTitulo}>Especificaciones</p>
                              {p.specs.length === 0 ? (
                                <p style={{ fontSize: T.micro, color: C.tenue, margin: 0 }}>Sin especificaciones</p>
                              ) : (
                                p.specs.map((s) => (
                                  <div key={s.label} style={{
                                    display: "flex", justifyContent: "space-between", gap: 12,
                                    fontSize: T.dato, padding: "6px 0", borderBottom: `1px solid ${C.bordeTenue}`,
                                  }}>
                                    <span style={{ color: C.suave }}>{s.label}</span>
                                    <span style={{ fontWeight: 600, color: C.texto }}>{s.value}</span>
                                  </div>
                                ))
                              )}
                            </div>
                            <div>
                              <p style={seccionTitulo}>Destacados</p>
                              {p.destacados.length === 0 ? (
                                <p style={{ fontSize: T.micro, color: C.tenue, margin: 0 }}>Sin destacados</p>
                              ) : (
                                p.destacados.map((d) => (
                                  <div key={d} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: T.dato, color: C.texto, padding: "4px 0" }}>
                                    <Check size={12} color={C.ok} strokeWidth={3} style={{ flexShrink: 0 }} />
                                    {d}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ) : undefined
                      }
                    >
                      <Miniatura tamano={44}>
                        {p.imagen
                          ? <Image fill sizes="44px" src={p.imagen} alt={p.nombre} style={{ objectFit: "contain", padding: 4 }} unoptimized />
                          : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.tenue }}><Package size={18} /></div>}
                      </Miniatura>

                      <FilaPrincipal titulo={p.nombre} meta={p.descripcion}>
                        {p.categoria && <span style={distintivo("marca")}>{p.categoria}</span>}
                        {p.stock <= 0 && <span style={distintivo("error")}>Agotado</span>}
                        {p.tamano_paquete && <span style={distintivo("neutro")}>Envío {p.tamano_paquete}</span>}
                      </FilaPrincipal>

                      <FilaDato
                        valor={`${parsePrice(p.precio).toFixed(2)} €`}
                        etiqueta={p.stock > 0 ? `${p.stock} en stock` : "sin unidades"}
                        color={C.accion}
                      />

                      <FilaAcciones>
                        <BotonIcono titulo={abierto ? "Ocultar ficha" : "Ver ficha"} onClick={() => setAbiertoId(abierto ? null : p.id)}>
                          {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </BotonIcono>
                        <BotonIcono titulo="Editar producto" onClick={() => { setEditandoId(p.id); setCreando(false); setAbiertoId(null); }}>
                          <Pencil size={14} />
                        </BotonIcono>
                        <BotonIcono titulo="Eliminar producto" tono="peligro" onClick={() => borrado.pedir(p)}>
                          <Trash2 size={14} />
                        </BotonIcono>
                      </FilaAcciones>
                    </Fila>
                  );
                })}
              </div>
            )}
          </>
        )
      ) : (
        <>
          {segundaMano.length > 0 && (
            <Barra>
              <Buscador valor={busqueda} onCambio={setBusqueda} marcador="Buscar por producto o vendedor…" />
              <Recuento>{segundaManoVisibles.length} de {segundaMano.length}</Recuento>
            </Barra>
          )}

          {segundaManoVisibles.length === 0 ? (
            <Vacio
              icono={<ShoppingBag size={24} />}
              titulo={segundaMano.length === 0 ? "No hay productos de segunda mano" : "Ningún producto coincide"}
              texto={
                segundaMano.length === 0
                  ? "Cuando un usuario publique un artículo, aparecerá aquí para moderar."
                  : "Prueba con otro término."
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {segundaManoVisibles.map((p) => (
                <Fila key={p.id}>
                  <Miniatura tamano={44}>
                    <Image fill sizes="44px" src={primeraImagen(p.imagen)} alt={p.nombre} style={{ objectFit: "contain", padding: 4 }} unoptimized />
                  </Miniatura>

                  <FilaPrincipal titulo={p.nombre} meta={p.descripcion}>
                    <span style={distintivo("info")}>{p.vendedor_nombre}</span>
                    {p.estado && <span style={distintivo("neutro")}>{p.estado}</span>}
                  </FilaPrincipal>

                  <FilaDato valor={`${Number(p.precio_final).toFixed(2)} €`} etiqueta="precio final" color={C.accion} />

                  <FilaAcciones>
                    <BotonIcono titulo="Retirar y avisar al vendedor" tono="peligro" onClick={() => { setRetirar(p); setMotivo(""); }}>
                      <Trash2 size={14} />
                    </BotonIcono>
                  </FilaAcciones>
                </Fila>
              ))}
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
