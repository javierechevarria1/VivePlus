"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Tag, Check } from "lucide-react";
import { useCart } from "@/frontend/src/components/useCart";

const DISCAPACIDADES = [
  { id: "vision",     label: "Problemas de visión",     icon: "👁️" },
  { id: "movilidad",  label: "Movilidad reducida",      icon: "🦽" },
  { id: "auditivo",   label: "Problemas auditivos",     icon: "👂" },
  { id: "memoria",    label: "Pérdida de memoria",      icon: "🧠" },
  { id: "soledad",    label: "Soledad / aislamiento",   icon: "🏠" },
  { id: "caidas",     label: "Riesgo de caídas",        icon: "⚠️" },
  { id: "medicacion", label: "Gestión de medicación",   icon: "💊" },
  { id: "autonomia",  label: "Pérdida de autonomía",    icon: "🤝" },
];

// Términos de búsqueda por necesidad
const TERMINOS: Record<string, string[]> = {
  vision:     ["tablet", "alexa", "echo", "luces", "pantalla"],
  movilidad:  ["robot", "domótica", "alexa", "echo", "asistente"],
  auditivo:   ["tablet", "alerta", "sensor", "pantalla"],
  memoria:    ["pastillero", "reloj", "alexa", "echo", "recordatorio"],
  soledad:    ["robot", "tablet", "alexa", "echo", "asistente"],
  caidas:     ["sensor", "reloj", "gps", "sos", "pulsera"],
  medicacion: ["pastillero", "alexa", "echo", "reloj"],
  autonomia:  ["robot", "domótica", "reloj", "asistente"],
};

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  imagen: string;
  categoria: string;
  fuente: "tecnologias" | "marketplace" | "segunda-mano";
  vendedor?: string;
};

const FUENTE_STYLE: Record<string, { label: string; color: string }> = {
  tecnologias:   { label: "Tecnología",   color: "#2A7A6A" },
  marketplace:   { label: "Marketplace",  color: "#1A5245" },
  "segunda-mano":{ label: "Segunda Mano", color: "#C9923A" },
};

function CotizadorPaso1({ descripcion, setDescripcion, onNext }: {
  descripcion: string; setDescripcion: (v: string) => void; onNext: () => void;
}) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 500, color: "#1B3A2D", margin: "0 0 8px", letterSpacing: "-.02em" }}>Paso 1 · <em style={{ fontStyle: "italic", color: "#9333EA" }}>Describe el hogar</em></h2>
      <p style={{ color: "#3d5049", fontSize: 16, marginBottom: 20, lineHeight: 1.7 }}>Tipo de vivienda, número de habitaciones, planta, si hay escaleras… cualquier detalle útil.</p>
      <textarea
        aria-label="Describe el hogar"
        value={descripcion}
        onChange={e => setDescripcion(e.target.value)}
        rows={5}
        placeholder="Ej: Piso de 80m² con 3 habitaciones, baño adaptado, cocina abierta. Vive solo en planta baja…"
        className="cot-textarea"
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button type="button" className="cot-btn-nav" onClick={onNext} disabled={!descripcion.trim()}
          style={{ background: descripcion.trim() ? "var(--teal)" : "#E5E0D8", color: descripcion.trim() ? "white" : "#aaa", cursor: descripcion.trim() ? "pointer" : "not-allowed" }}>
          Siguiente
        </button>
      </div>
    </div>
  );
}

function CotizadorPaso2({ seleccionadas, toggleDiscapacidad, onBack, onNext }: {
  seleccionadas: string[]; toggleDiscapacidad: (id: string) => void; onBack: () => void; onNext: () => void;
}) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 500, color: "#1B3A2D", margin: "0 0 8px", letterSpacing: "-.02em" }}>Paso 2 · <em style={{ fontStyle: "italic", color: "#9333EA" }}>Necesidades específicas</em></h2>
      <p style={{ color: "#3d5049", fontSize: 16, lineHeight: 1.7 }}>Selecciona todas las que apliquen.</p>
      <div className="cot-disc-grid">
        {DISCAPACIDADES.map(d => (
          <button type="button" key={d.id} className={`cot-disc-btn${seleccionadas.includes(d.id) ? " sel" : ""}`} onClick={() => toggleDiscapacidad(d.id)}>
            <span style={{ fontSize: 20 }}>{d.icon}</span><span>{d.label}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <button type="button" className="cot-btn-nav" onClick={onBack} style={{ background: "#F0EDE6", color: "var(--slate)" }}>Atrás</button>
        <button type="button" className="cot-btn-nav" onClick={onNext} disabled={seleccionadas.length === 0}
          style={{ background: seleccionadas.length > 0 ? "var(--teal)" : "#E5E0D8", color: seleccionadas.length > 0 ? "white" : "#aaa", cursor: seleccionadas.length > 0 ? "pointer" : "not-allowed" }}>
          Ver mi pack
        </button>
      </div>
    </div>
  );
}

function CotizadorPaso3({ loadingProd, productos, added, handleAdd, onBack, onReset }: {
  loadingProd: boolean; productos: Producto[]; added: Record<string, boolean>;
  handleAdd: (p: Producto) => void; onBack: () => void; onReset: () => void;
}) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 500, color: "#1B3A2D", margin: "0 0 8px", letterSpacing: "-.02em" }}>Paso 3 · <em style={{ fontStyle: "italic", color: "#9333EA" }}>Tu pack personalizado</em></h2>
      <p style={{ color: "#3d5049", fontSize: 16, marginBottom: 4, lineHeight: 1.7 }}>
        Añade al carrito los productos que te interesen. Incluye resultados de Tecnología, Marketplace y Segunda Mano.
      </p>

      {loadingProd ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ width: 28, height: 28, border: "3px solid #EDE8DF", borderTopColor: "var(--teal)", borderRadius: "50%", animation: "cotSpin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes cotSpin { to { transform:rotate(360deg); } }`}</style>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Buscando en todos los catálogos…</p>
        </div>
      ) : productos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ color: "var(--muted)", fontSize: 15 }}>No encontramos productos exactos para estas necesidades.</p>
          <Link href="/marketplace" className="cot-empty-link">Explorar tienda →</Link>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}><strong style={{ color: "var(--slate)" }}>{productos.length}</strong> productos encontrados</p>
          <div className="cot-prod-grid">
            {productos.map(p => {
              const key = `${p.fuente}-${p.id}`;
              const f = FUENTE_STYLE[p.fuente];
              return (
                <div key={key} className="cot-prod-card">
                  {/* Imagen */}
                  <div style={{ position: "relative", height: 200, background: "var(--cream)", flexShrink: 0 }}>
                    {p.imagen && (p.imagen.startsWith("/") || p.imagen.startsWith("http")) ? (
                      <Image fill src={p.imagen} alt={p.nombre} sizes="240px" style={{ objectFit: "contain", padding: 10 }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ShoppingCart size={36} color="var(--muted)" />
                      </div>
                    )}
                    <span className="cot-fuente-badge" style={{ background: f.color }}>{f.label}</span>
                    {p.fuente === "segunda-mano" && p.vendedor && (
                      <span className="cot-vendedor-badge">
                        <Tag size={9} />{p.vendedor}
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: "18px 18px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--slate)", margin: "0 0 8px", fontFamily: "'Fraunces',serif", lineHeight: 1.3 }}>{p.nombre}</h3>
                    <p style={{ fontSize: 15, color: "#3d5049", lineHeight: 1.65, flex: 1, margin: "0 0 16px" }}>{p.descripcion.slice(0, 100)}{p.descripcion.length > 100 ? "…" : ""}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <strong style={{ fontSize: 20, color: "var(--teal)", fontFamily: "'DM Sans',sans-serif" }}>{p.precio.startsWith("€") ? p.precio : `€${p.precio}`}</strong>
                      {p.fuente !== "segunda-mano" ? (
                        <button
                          type="button"
                          onClick={() => handleAdd(p)}
                          className="cot-btn-add"
                          style={{ background: added[key] ? "#2A7A6A" : "var(--teal)" }}
                        >
                          {added[key] ? <><Check size={15} /> Añadido</> : <><ShoppingCart size={15} /> Añadir</>}
                        </button>
                      ) : (
                        <Link href="/segunda-mano" style={{ background: "#C9923A", color: "white", borderRadius: 10, padding: "10px 18px", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>Ver</Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* CTA asesor */}
      {!loadingProd && (
        <div style={{ marginTop: 28, padding: "18px 22px", background: "#EAF5F2", borderRadius: 14, border: "1px solid #C5E8E1" }}>
          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#1B3A2D" }}>¿Quieres que un asesor lo revise?</p>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#3d5049" }}>Preparamos un presupuesto personalizado con instalación incluida.</p>
          <Link href="/contacto" className="cot-cta-link">
            Contactar con un asesor
          </Link>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button type="button" className="cot-btn-nav" onClick={onBack} style={{ background: "#F0EDE6", color: "var(--slate)", border: "none" }}>Modificar</button>
        <button type="button" className="cot-btn-nav" onClick={onReset} style={{ background: "#F0EDE6", color: "var(--slate)", border: "none" }}>Nueva consulta</button>
      </div>
    </div>
  );
}

export default function CotizadorPage() {
  const [step, setStep]               = useState<1 | 2 | 3>(1);
  const [descripcion, setDescripcion] = useState("");
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [productos, setProductos]     = useState<Producto[]>([]);
  const [loadingProd, setLoadingProd] = useState(false);
  const [added, setAdded]             = useState<Record<string, boolean>>({});
  const { addItem }                   = useCart();
  const { push }                      = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      if (!sessionStorage.getItem("r65_user:v1")) {
        window.dispatchEvent(new CustomEvent("r65:open-auth"));
        push("/");
      }
    };
    checkAuth();
    window.addEventListener("relatia-auth-changed", checkAuth);
    window.addEventListener("r65:authed", checkAuth);
    return () => {
      window.removeEventListener("relatia-auth-changed", checkAuth);
      window.removeEventListener("r65:authed", checkAuth);
    };
  }, [push]);

  const toggleDiscapacidad = (id: string) =>
    setSeleccionadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const irPaso3 = async () => {
    setStep(3);
    setLoadingProd(true);
    try {
      const terminos = [...new Set(seleccionadas.flatMap(s => TERMINOS[s] ?? []))];
      const [tec, market, sm] = await Promise.all([
        fetch("/api/tecnologias").then(r => r.json()).catch(() => []),
        fetch("/api/marketplace").then(r => r.json()).catch(() => []),
        fetch("/api/segunda-mano").then(r => r.json()).catch(() => ({ productos: [] })),
      ]);

      const coincide = (p: { nombre?: string; descripcion?: string }) =>
        terminos.some(t =>
          (p.nombre ?? "").toLowerCase().includes(t) ||
          (p.descripcion ?? "").toLowerCase().includes(t)
        );

      const toProducto = (p: Record<string, unknown>, fuente: Producto["fuente"]): Producto => ({
        id:          Number(p.id),
        nombre:      String(p.nombre ?? ""),
        descripcion: String(p.descripcion ?? ""),
        precio:      String(p.precio ?? ""),
        imagen:      String(p.imagen ?? (Array.isArray(p.fotos) ? (p.fotos as unknown[])[0] : undefined) ?? ""),
        categoria:   String(p.categoria ?? ""),
        fuente,
        vendedor:    fuente === "segunda-mano" ? String(p.username ?? "") : undefined,
      });

      const tecItems    = (Array.isArray(tec) ? tec : []).reduce<Producto[]>((acc, p: Record<string, unknown>) => {
        if (coincide(p)) acc.push(toProducto(p, "tecnologias"));
        return acc;
      }, []);
      const marketItems = (Array.isArray(market) ? market : []).reduce<Producto[]>((acc, p: Record<string, unknown>) => {
        if (coincide(p)) acc.push(toProducto(p, "marketplace"));
        return acc;
      }, []);
      const smRaw       = sm?.productos ?? sm ?? [];
      const smItems     = (Array.isArray(smRaw) ? smRaw : []).reduce<Producto[]>((acc, p: Record<string, unknown>) => {
        if (coincide(p)) acc.push(toProducto(p, "segunda-mano"));
        return acc;
      }, []);

      // Deduplicar por nombre
      const seen = new Set<string>();
      const todos = [...tecItems, ...marketItems, ...smItems].filter(p => {
        if (seen.has(p.nombre.toLowerCase())) return false;
        seen.add(p.nombre.toLowerCase());
        return true;
      });

      setProductos(todos);

      try {
        const saved = sessionStorage.getItem("r65_user:v1");
        const usuario_id = saved ? JSON.parse(saved)?.id : null;
        if (usuario_id) {
          fetch("/api/cotizador", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              usuario_id,
              descripcion,
              necesidades: seleccionadas,
              productos_sugeridos: todos.map(p => ({ id: p.id, nombre: p.nombre, fuente: p.fuente })),
            }),
          }).catch(() => {});
        }
      } catch { /* silent */ }
    } finally {
      setLoadingProd(false);
    }
  };

  const handleAdd = (p: Producto) => {
    addItem({ id: p.id, nombre: p.nombre, precio: p.precio, imagen: p.imagen, categoria: p.categoria });
    const key = `${p.fuente}-${p.id}`;
    setAdded(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [key]: false })), 1400);
  };

  return (
    <div className="page-enter" style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .cot-card { background: white; border-radius: 20px; border: 1px solid var(--sand); box-shadow: 0 4px 24px rgba(42,58,32,0.07); padding: 40px 48px; max-width: 860px; margin: 0 auto; }
        .cot-step-bar { display: flex; gap: 8px; margin-bottom: 40px; }
        .cot-step-dot { flex: 1; height: 4px; border-radius: 2px; transition: background .3s; }
        .cot-disc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-top: 20px; }
        .cot-disc-btn { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 12px; border: 2px solid var(--sand); background: white; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--slate); transition: all .2s; text-align: left; width: 100%; }
        .cot-disc-btn.sel { border-color: #2A7A6A; background: #EAF5F2; color: #1B3A2D; font-weight: 700; }
        .cot-disc-btn:hover { border-color: #2A7A6A; }
        .cot-prod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(280px,100%),1fr)); gap: 20px; margin-top: 20px; }
        .cot-prod-card { background: white; border-radius: 20px; border: 1px solid var(--sand); overflow: hidden; display: flex; flex-direction: column; transition: box-shadow .2s, transform .2s; }
        .cot-prod-card:hover { box-shadow: 0 12px 36px rgba(42,58,32,0.12); transform: translateY(-3px); }
        .cot-btn-nav { padding: 12px 28px; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'DM Sans',sans-serif; transition: background .2s; box-shadow: none; }
        .cot-btn-nav:focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; }
        .cot-textarea { width: 100%; padding: 12px 14px; border: 1.5px solid var(--sand); border-radius: 12px; font-size: 14px; font-family: 'DM Sans',sans-serif; resize: vertical; color: var(--slate); box-sizing: border-box; }
        .cot-textarea:focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; }
        .cot-empty-link { display: inline-block; margin-top: 16px; background: var(--teal); color: white; padding: 10px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; }
        .cot-fuente-badge { position: absolute; top: 8px; left: 8px; color: white; font-size: 12px; font-weight: 700; padding: 2px 7px; border-radius: 99px; }
        .cot-vendedor-badge { position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.9); color: var(--muted); font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 99px; display: flex; align-items: center; gap: 3px; }
        .cot-btn-add { display: flex; align-items: center; gap: 6px; color: white; border: none; border-radius: 10px; padding: 10px 18px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background .2s; }
        .cot-cta-link { display: inline-flex; align-items: center; gap: 8px; background: var(--teal); color: white; padding: 9px 22px; border-radius: 10px; font-size: 13px; font-weight: 700; text-decoration: none; }
        @media(max-width:600px){
          .cot-card { padding: 24px 18px; }
          .cot-disc-grid { grid-template-columns: 1fr 1fr; }
          .cot-prod-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ maxWidth: 940, margin: "0 auto", padding: "52px 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ display: "block", width: 36, height: 2, background: "#9333EA", borderRadius: 1 }} />
            <span style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "#9333EA" }}>Personalización del hogar</span>
            <span style={{ display: "block", width: 36, height: 2, background: "#9333EA", borderRadius: 1 }} />
          </div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 500, color: "#1B3A2D", margin: "0 0 10px", letterSpacing: "-.02em" }}>
            Cotizador Inteligente <em style={{ fontStyle: "italic", color: "#9333EA" }}>de Vivienda</em>
          </h1>
          <p style={{ color: "#3d5049", fontSize: 16, maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
            Describe el hogar, indica las necesidades y te mostramos el pack de productos recomendados para añadir al carrito.
          </p>
        </div>

        <div className="cot-card">

          {/* Progreso */}
          <div className="cot-step-bar">
            {[1,2,3].map(s => (
              <div key={s} className="cot-step-dot" style={{ background: step >= s ? "var(--teal)" : "#E5E0D8" }} />
            ))}
          </div>

          {step === 1 && (
            <CotizadorPaso1 descripcion={descripcion} setDescripcion={setDescripcion} onNext={() => setStep(2)} />
          )}

          {step === 2 && (
            <CotizadorPaso2
              seleccionadas={seleccionadas}
              toggleDiscapacidad={toggleDiscapacidad}
              onBack={() => setStep(1)}
              onNext={irPaso3}
            />
          )}

          {step === 3 && (
            <CotizadorPaso3
              loadingProd={loadingProd}
              productos={productos}
              added={added}
              handleAdd={handleAdd}
              onBack={() => setStep(2)}
              onReset={() => { setStep(1); setDescripcion(""); setSeleccionadas([]); setProductos([]); }}
            />
          )}

        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <Link href="/" style={{ color: "#7C3AED", textDecoration: "none", fontWeight: 500, fontSize: 15 }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
