"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";

import { useRouter } from "next/navigation";
import PusherClient from "pusher-js";
import { ShoppingCart, PlusCircle, Tag, ChevronLeft, ChevronRight, Search } from "lucide-react";
import PlanGate from "@/frontend/src/components/plan-gate";
import { usePlan } from "@/frontend/src/components/usePlan";
import { SelectorTamano, DireccionVendedorModal, AvisoEnvioVendedor, type ProductoPendiente } from "@/frontend/src/components/EnvioVendedor";
import type { TamanoPaquete } from "@/backend/services/tarifas-segunda-mano";

type ProductoSegundaMano = {
  id: number;
  id_vendedor: number;
  vendedor_nombre: string;
  nombre: string;
  descripcion: string;
  precio_final: string;
  stock: number;
  imagen: string | string[];
  estado: string;
  // null en los publicados antes de que existiera el tramo de envío.
  tamano_paquete: string | null;
  vendedor_puede_cobrar?: boolean;
};

const CLOSE_BUTTON_STYLE: React.CSSProperties = {
  position: "absolute", top: 20, right: 20, background: "none", border: "none",
  fontSize: 24, cursor: "pointer", color: "#94A3B8",
};

const SEARCH_INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "10px 16px 10px 38px",
  border: "1.5px solid #EDE9FE",
  borderRadius: 99,
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  color: "#9333EA",
  background: "white",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

const CONNECT_BANNER_WARN_STYLE: React.CSSProperties = {
  background: "#FFFBEB", border: "1.5px solid #F59E0B", borderRadius: 16, padding: "20px 24px",
  marginBottom: 24, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
};

const CONNECT_BANNER_OK_STYLE: React.CSSProperties = {
  background: "#F0FDF4", border: "1.5px solid #22C55E", borderRadius: 16, padding: "14px 24px",
  marginBottom: 24, display: "flex", alignItems: "center", gap: 12,
};

const PRICE_BADGE_STYLE: React.CSSProperties = {
  position: "absolute", top: 12, right: 12, background: "white", padding: "6px 14px",
  borderRadius: 20, fontSize: 13, fontWeight: 700, color: "#EC4899", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const PRINCIPAL_BADGE_STYLE_SUBIR: React.CSSProperties = {
  position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(42, 122, 106, 0.8)",
  color: "white", fontSize: 12, textAlign: "center", padding: "2px 0", fontWeight: 700,
};

const PRINCIPAL_BADGE_STYLE_EDITAR: React.CSSProperties = {
  position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(236,72,153,0.8)",
  color: "white", fontSize: 12, textAlign: "center", padding: "2px 0", fontWeight: 700,
};

const ELIMINAR_TRIGGER_STYLE: React.CSSProperties = {
  width: "100%", padding: 14, borderRadius: 12, border: "1.5px solid #E74C3C", background: "white",
  color: "#E74C3C", fontWeight: 600, fontSize: 15, cursor: "pointer",
};

const CANCELAR_BTN_STYLE_SM: React.CSSProperties = {
  flex: 1, padding: 13, borderRadius: 12, border: "1.5px solid #EDE9FE", background: "white",
  color: "#6A9E8A", fontWeight: 600, cursor: "pointer",
};

const CANCELAR_BTN_STYLE: React.CSSProperties = {
  flex: 1, padding: 14, borderRadius: 12, border: "1.5px solid #EDE9FE", background: "white",
  color: "#6A9E8A", fontWeight: 600, cursor: "pointer",
};

const TAB_BTN_STYLE_BASE: React.CSSProperties = {
  padding: "10px 22px", border: "none", background: "none", cursor: "pointer", fontWeight: 600,
  fontSize: 14, marginBottom: -2, transition: "color 0.2s",
};

const CONNECT_BTN_STYLE_BASE: React.CSSProperties = {
  padding: "12px 24px", borderRadius: 12, border: "none", background: "#F59E0B", color: "white",
  fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
};

const DANGER_BTN_STYLE_SM: React.CSSProperties = {
  flex: 1, padding: 13, borderRadius: 12, border: "none", background: "#E74C3C",
  color: "white", fontWeight: 700, cursor: "pointer",
};

const DANGER_BTN_STYLE: React.CSSProperties = {
  flex: 1, padding: 14, borderRadius: 12, border: "none", background: "#E74C3C",
  color: "white", fontWeight: 700, cursor: "pointer",
};

async function uploadFiles(files: File[]): Promise<string[]> {
  const urls = await Promise.all(files.map(async (file) => {
    const fd = new FormData();
    fd.append("imagen", file);
    const res = await fetch("/api/upload-imagen", { method: "POST", body: fd });
    const data = await res.json();
    return res.ok && data.url ? data.url : null;
  }));
  return urls.filter((u): u is string => Boolean(u));
}

const SEGUNDA_MANO_STYLES = `
  .sn-hero{position:relative;height:100vh;min-height:640px;overflow:hidden;color:#fff;display:grid;place-items:center;isolation:isolate}
  .sn-hero__bg{position:absolute;inset:-8%;z-index:-2;will-change:transform;background-size:cover;background-position:center}
  .sn-hero__overlay{position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(29,78,216,.30) 0%,rgba(29,78,216,.10) 30%,rgba(147,51,234,.45) 78%,rgba(15,10,30,.88) 100%)}
  .sn-hero__inner{text-align:center;max-width:1100px;padding:0 24px;position:relative;z-index:1;will-change:transform,opacity}
  .sn-hero__title{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:clamp(72px,12vw,160px);line-height:.95;letter-spacing:-.03em;margin:28px 0 24px}
  .sn-word{display:inline-block;overflow:hidden;vertical-align:bottom;padding:0 .12em;margin:0 -.12em}
  .sn-word>span{display:inline-block;transform:translateY(110%);animation:snRise .9s cubic-bezier(.2,.7,.2,1) forwards;padding:0 .04em}
  .sn-word.delay>span{animation-delay:.18s}
  .sn-word.gold>span{color:#EC4899;font-style:italic}
  .sn-hero__sub{font-size:clamp(15px,1.4vw,19px);max-width:680px;margin:0 auto;font-weight:300;opacity:0;animation:snFade .9s ease .55s forwards}
  .sn-hero__scroll{position:absolute;bottom:36px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;color:rgba(255,255,255,.85);font-size:11px;letter-spacing:.3em;font-weight:500;opacity:0;animation:snFade .9s ease .9s forwards}
  .sn-hero__bar{width:1px;height:46px;background:linear-gradient(to bottom,transparent,#EC4899,transparent);position:relative;overflow:hidden}
  .sn-hero__bar::after{content:'';position:absolute;left:-1px;top:-20px;width:3px;height:20px;background:#EC4899;border-radius:2px;animation:snScrollDot 2s ease-in-out infinite}
  .sn-eyebrow-hero{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;backdrop-filter:blur(8px);font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase}
  .sn-eyebrow-hero::before{content:'';width:8px;height:8px;border-radius:50%;background:#EC4899;box-shadow:0 0 8px #EC4899;flex-shrink:0}
  @keyframes snRise{to{transform:translateY(0)}}
  @keyframes snFade{to{opacity:1}}
  @keyframes snScrollDot{0%{top:-20px;opacity:0}20%{opacity:1}80%{opacity:1}100%{top:46px;opacity:0}}
  @media(max-width:768px){.sn-hero__title{font-size:clamp(44px,10vw,72px)!important}.sn-hero{height:60vh;min-height:300px}.sn-hero__inner{padding:0 16px}}
  @media(max-width:480px){.sn-hero{height:55vh;min-height:260px}}
  @media(max-width:480px){.sn-hero__title{font-size:clamp(34px,9vw,48px)!important}.sn-hero{min-height:400px}.sn-hero__inner{padding:0 12px}.sn-hero__sub{font-size:14px!important}.sn-eyebrow-hero{font-size:10px;padding:6px 14px}}

  /* ── Botón principal ── */
  .sn-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:14px;border:none;background:#EC4899;color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .2s,transform .15s}
  .sn-btn-primary:hover{background:#9333EA;transform:translateY(-1px)}

  /* ── Vendor badge ── */
  .sn-vendor-badge{display:inline-block;font-size:11px;font-weight:700;color:#6A9E8A;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}

  /* ── Card buttons ── */
  .sn-card-btn{width:100%;margin-top:12px;padding:13px;border-radius:12px;border:1.5px solid #EDE9FE;background:white;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .2s,transform .15s;display:flex;align-items:center;justify-content:center;gap:6px}
  .sn-card-btn-edit{color:#EC4899;border-color:#FBCFE8}
  .sn-card-btn-del{color:#E74C3C;border-color:#FFCDD2}
  .sn-card-btn-cart{background:#EC4899;color:#fff;border-color:#EC4899;transition:background .2s,transform .15s}

  /* ── Gallery controls ── */
  .sn-galeria-btn{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.9);border:none;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;transition:background .2s}
  .sn-galeria-btn-prev{left:10px}
  .sn-galeria-btn-next{right:10px}

  /* ── Modal overlay & containers ── */
  .sn-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;backdrop-filter:blur(4px)}
  .sn-modal-inner{background:white;width:100%;border-radius:24px;padding:32px;position:relative;max-height:90vh;overflow-y:auto}
  .sn-modal-inner-sm{background:white;width:100%;border-radius:24px;padding:32px;position:relative}

  /* ── Form inputs ── */
  .sm-form-input{width:100%;padding:12px 16px;border:1.5px solid #EDE9FE;border-radius:12px;font-size:15px;font-family:'DM Sans',sans-serif;color:#9333EA;background:#FAF8FF;outline:none;transition:border-color .2s}
  .sm-form-input:focus{border-color:#EC4899;background:#fff}
  .sm-form-textarea{resize:vertical;min-height:80px}

  /* ── Submit button ── */
  .sn-submit-btn{width:100%;padding:15px;border-radius:14px;border:none;background:#EC4899;color:#fff;font-size:16px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .2s}
  .sn-submit-btn:hover{background:#9333EA}
  .sn-submit-btn:disabled{opacity:.6;cursor:not-allowed}

  /* ── Drop area ── */
  .sn-drop-area{padding:20px;border-radius:12px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;transition:all .2s;cursor:pointer}
  .sn-drop-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center}

  /* ── Image thumbnails ── */
  .sn-img-thumb{position:relative;width:80px;height:80px;border-radius:10px;overflow:hidden;border:1.5px solid #EDE9FE;flex-shrink:0}
  .sn-img-remove-btn{position:absolute;top:3px;right:3px;background:rgba(0,0,0,0.55);color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:14px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1}
`;


export default function SegundaManoPage({ initialConnectConnected = null }: { initialConnectConnected?: boolean | null }) {
  const { hasPlan, ready, isAuthed: planIsAuthed } = usePlan();
  const [productos, setProductos] = useState<ProductoSegundaMano[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductoSegundaMano | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<"todos" | "mis">("todos");
  const [busqueda, setBusqueda] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProductoSegundaMano | null>(null);
  const [ownerDeleteTarget, setOwnerDeleteTarget] = useState<ProductoSegundaMano | null>(null);
  const [connectConnected, setConnectConnected] = useState<boolean | null>(initialConnectConnected);
  const [connectLoading, setConnectLoading] = useState(false);
  const [recienConectado, setRecienConectado] = useState(false);
  const [faltaDireccion, setFaltaDireccion] = useState(false);
  const [sinTamano, setSinTamano] = useState<ProductoPendiente[]>([]);
  const [showDireccion, setShowDireccion] = useState(false);
  const heroBgRef      = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroRef        = useRef<HTMLElement>(null);
  const mainRef        = useRef<HTMLElement>(null);
  const mountedRef      = useRef(true);
  const { push } = useRouter();

  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    const leerSesion = () => {
      const isAuthed = sessionStorage.getItem("r65_authed") === "true";
      setAuthed(isAuthed);
      if (!isAuthed) return;
      try {
        const u = JSON.parse(sessionStorage.getItem("r65_user:v1") ?? "{}");
        if (u?.id) setCurrentUserId(Number(u.id));
        if (u?.rol === "admin") setIsAdmin(true);
      } catch {}

      const params = new URLSearchParams(window.location.search);
      if (params.get("connect") === "success" || params.get("connect") === "refresh") {
        setActiveTab("mis");
        // Confirmación de que la conexión salió bien, no un distintivo
        // permanente: se enseña al volver de Stripe y se va sola.
        setRecienConectado(true);
      }
    };

    leerSesion();
    window.addEventListener("relatia-auth-changed", leerSesion);
    window.addEventListener("r65:authed", leerSesion);
    return () => {
      window.removeEventListener("relatia-auth-changed", leerSesion);
      window.removeEventListener("r65:authed", leerSesion);
    };
  }, [push]);

  // El aviso de conexión correcta dura unos segundos y desaparece. Además se
  // quita el parámetro de la URL, para que no vuelva a salir al recargar.
  useEffect(() => {
    if (!recienConectado) return;

    const url = new URL(window.location.href);
    if (url.searchParams.has("connect")) {
      url.searchParams.delete("connect");
      window.history.replaceState({}, "", url.toString());
    }

    const t = setTimeout(() => setRecienConectado(false), 6000);
    return () => clearTimeout(t);
  }, [recienConectado]);

  useEffect(() => {
    if (!authed || !currentUserId || connectConnected !== null) return;
    let cancelled = false;
    fetch(`/api/connect-onboard?userId=${currentUserId}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setConnectConnected(d.connected ?? false); })
      .catch(() => { if (!cancelled) setConnectConnected(false); });
    return () => { cancelled = true; };
  }, [authed, currentUserId, connectConnected]);



  useEffect(() => {
    fetchProductos();
    const onStockUpdate = () => fetchProductos();
    window.addEventListener("stock-actualizado", onStockUpdate);

    const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const ch = pusherClient.subscribe("segunda-mano");
    ch.bind("producto-vendido", (data: { id: number }) => {
      setProductos(prev => prev.filter(p => p.id !== data.id));
    });

    return () => {
      window.removeEventListener("stock-actualizado", onStockUpdate);
      pusherClient.unsubscribe("segunda-mano");
      pusherClient.disconnect();
    };
  }, []);

  const fetchProductos = async () => {
    try {
      const res = await fetch("/api/segunda-mano");
      const json = await res.json();
      if (mountedRef.current && json.ok) {
        setProductos(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // Qué le falta al vendedor para poder enviar: la dirección de recogida y el
  // tramo de los productos que publicó antes de que ese campo existiera.
  const fetchDatosEnvio = useCallback(async () => {
    if (!authed) return;
    try {
      const res = await fetch("/api/direccion-vendedor");
      const json = await res.json();
      if (mountedRef.current && json.ok) {
        setFaltaDireccion(!json.completa);
        setSinTamano(json.productos_sin_tamano ?? []);
      }
    } catch {
      // Es un aviso: si falla, la validación del servidor sigue protegiendo.
    }
  }, [authed]);

  useEffect(() => { fetchDatosEnvio(); }, [fetchDatosEnvio]);

  const handleOpenModal = () => {
    if (!authed) {
      window.dispatchEvent(new CustomEvent("r65:open-auth"));
      return;
    }
    if (connectConnected === false) {
      setActiveTab("mis");
      return;
    }
    // Sin dirección el servidor rechazaría la publicación: mejor pedirla antes
    // de que rellene todo el formulario.
    if (faltaDireccion) {
      setShowDireccion(true);
      return;
    }
    setShowModal(true);
  };


  return (
    <div className="page-enter" style={{ minHeight: "100vh", background: "var(--cream)", paddingBottom: 80 }}>
      <style>{SEGUNDA_MANO_STYLES}</style>


      <header className="sn-hero" ref={heroRef}>
        <div
          ref={heroBgRef}
          className="sn-hero__bg"
          style={{ backgroundImage: "url('/img/marketplace.png')" }}
        />
        <div className="sn-hero__overlay" />
        <div className="sn-hero__inner" ref={heroContentRef}>
          <h1 className="sn-hero__title">
            <span className="sn-word"><span>Segunda</span></span>
            <br />
            <span className="sn-word delay gold"><span>Mano</span></span>
          </h1>
          <p className="sn-hero__sub">
            Compra y vende productos de apoyo de forma segura, con <strong>verificación y soporte</strong> técnico especializado.
          </p>
        </div>
        <div className="sn-hero__scroll">
          <div className="sn-hero__bar" />
          <span>SCROLL</span>
        </div>
      </header>

      {/* LISTADO */}
      <main id="anuncios" ref={mainRef} style={{ maxWidth: 1200, margin: "40px auto", padding: "0 20px" }}>
        {/* Cabecera con botón */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 28, color: "#9333EA", fontFamily: "'Cormorant Garamond', serif", margin: 0 }}>
              {activeTab === "todos" ? "Listado de productos" : "Mis productos en venta"}
            </h2>
            <p style={{ color: "#6A9E8A", marginTop: 4, fontSize: 15 }}>
              {activeTab === "todos" ? "Encuentra lo que necesitas o publica tu propio artículo." : "Gestiona los productos que tienes en venta."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="sn-btn-primary"
            title={authed && connectConnected === false ? "Conecta tu cuenta bancaria para poder vender" : undefined}
            style={authed && connectConnected === false ? { opacity: 0.6 } : undefined}
          >
            <PlusCircle size={18} /> Vender producto
          </button>
        </div>

        {/* Pestañas */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, borderBottom: "2px solid #EDE9FE", paddingBottom: 0 }}>
          {(["todos", "mis"] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                ...TAB_BTN_STYLE_BASE,
                borderBottom: activeTab === tab ? "2px solid #EC4899" : "2px solid transparent",
                color: activeTab === tab ? "#EC4899" : "#94A3B8",
              }}
            >
              {tab === "todos" ? "Todos los productos" : "Mis productos en venta"}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div style={{ position: "relative", width: "min(480px, 100%)", marginBottom: 28 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
          <input
            type="text"
            aria-label="Buscar productos"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            style={SEARCH_INPUT_STYLE}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#EC4899")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#EDE9FE")}
          />
        </div>

        {/* Contenido por pestaña */}
        {activeTab === "todos" && (() => {
          const q = busqueda.toLowerCase();
          const productosAjenos = productos.filter(p =>
            p.id_vendedor !== currentUserId && p.stock > 0 &&
            p.vendedor_puede_cobrar !== false &&
            (!q || p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q))
          );
          return loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#6A9E8A" }}>Cargando productos…</div>
          ) : productosAjenos.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#6A9E8A", background: "white", borderRadius: 24, border: "1px dashed #EDE9FE" }}>
              <Tag size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <h3>No hay productos disponibles</h3>
              <p>Sé el primero en poner algo a la venta.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
              {productosAjenos.map(p => (
                <ProductoCard key={p.id} p={p} isMine={false} onEdit={() => {}} isAdmin={isAdmin} onAdminDelete={() => setDeleteTarget(p)} authed={authed} />
              ))}
            </div>
          );
        })()}

        {activeTab === "mis" && (() => {
          const q = busqueda.toLowerCase();
          const misProductos = productos.filter(p =>
            p.id_vendedor === currentUserId &&
            (!q || p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q))
          );
          return (
            <>
              <AvisoEnvioVendedor
                faltaDireccion={faltaDireccion}
                productosSinTamano={sinTamano}
                onPonerDireccion={() => setShowDireccion(true)}
                onCompletarProducto={(id) => {
                  const objetivo = productos.find(p => p.id === id);
                  if (objetivo) setEditTarget(objetivo);
                }}
              />

              {connectConnected === false && (
                <div style={CONNECT_BANNER_WARN_STYLE}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#92400E", fontSize: 15 }}>Conecta tu cuenta bancaria para recibir pagos</p>
                  </div>
                  <button
                    type="button"
                    disabled={connectLoading}
                    onClick={async () => {
                      setConnectLoading(true);
                      try {
                        const res = await fetch("/api/connect-onboard", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: currentUserId }),
                        });
                        if (!res.ok) return;
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                      } finally {
                        setConnectLoading(false);
                      }
                    }}
                    style={{ ...CONNECT_BTN_STYLE_BASE, opacity: connectLoading ? 0.7 : 1 }}
                  >
                    {connectLoading ? "Redirigiendo…" : "Conectar cuenta"}
                  </button>
                </div>
              )}
              {connectConnected === true && recienConectado && (
                <div style={CONNECT_BANNER_OK_STYLE}>
                  <span style={{ color: "#15803D", fontWeight: 700, fontSize: 14 }}>✓ Cuenta bancaria conectada</span>
                </div>
              )}
              {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "#6A9E8A" }}>Cargando productos…</div>
              ) : misProductos.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "#6A9E8A", background: "white", borderRadius: 24, border: "1px dashed #EDE9FE" }}>
                  <Tag size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <h3>No tienes productos en venta</h3>
                  <p>Pulsa Vender producto para publicar el primero.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                  {misProductos.map(p => (
                    <ProductoCard key={p.id} p={p} isMine={true} onEdit={() => setEditTarget(p)} isAdmin={isAdmin} onAdminDelete={() => setDeleteTarget(p)} onOwnerDelete={() => setOwnerDeleteTarget(p)} authed={authed} />
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </main>

      {showModal && <SubirProductoModal onClose={() => setShowModal(false)} onRefresh={() => { fetchProductos(); fetchDatosEnvio(); setActiveTab("mis"); }} />}
      {editTarget && <EditarProductoModal producto={editTarget} onClose={() => setEditTarget(null)} onRefresh={() => { fetchProductos(); fetchDatosEnvio(); }} />}
      {showDireccion && (
        <DireccionVendedorModal
          onClose={() => setShowDireccion(false)}
          onGuardada={() => { setFaltaDireccion(false); fetchDatosEnvio(); }}
        />
      )}
      {deleteTarget && <EliminarProductoModal producto={deleteTarget} onClose={() => setDeleteTarget(null)} onRefresh={fetchProductos} />}
      {ownerDeleteTarget && <PropietarioEliminarModal producto={ownerDeleteTarget} onClose={() => setOwnerDeleteTarget(null)} onRefresh={fetchProductos} />}
    </div>
  );
}

function ProductoCard({ p, isMine, onEdit, isAdmin, onAdminDelete, onOwnerDelete, authed }: { p: ProductoSegundaMano, isMine: boolean, onEdit: () => void, isAdmin: boolean, onAdminDelete: () => void, onOwnerDelete?: () => void, authed: boolean }) {
  const imagenesArray = Array.isArray(p.imagen) ? p.imagen : [p.imagen];
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const imagenActual = imagenesArray[currentImgIdx] || "/img/placeholder.png";

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIdx(prev => (prev + 1) % imagenesArray.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIdx(prev => (prev - 1 + imagenesArray.length) % imagenesArray.length);
  };

  return (
    <article style={{ background: "white", borderRadius: 24, overflow: "hidden", border: "1px solid #EDE9FE", display: "flex", flexDirection: "column", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={e => Object.assign(e.currentTarget.style, { transform: "translateY(-4px)", boxShadow: "0 12px 24px rgba(0,0,0,0.06)" })} onMouseLeave={e => Object.assign(e.currentTarget.style, { transform: "none", boxShadow: "none" })}>
      <div style={{ height: 240, background: "#F5F5F5", position: "relative" }}>
        <Image src={imagenActual} alt={p.nombre} fill sizes="280px" style={{ objectFit: "contain", padding: 16 }} />


        <span style={PRICE_BADGE_STYLE}>
          €{Number(p.precio_final).toFixed(2)}
        </span>


        {imagenesArray.length > 1 && (
          <>
            <button type="button" aria-label="Imagen anterior" onClick={prevImg} className="sn-galeria-btn sn-galeria-btn-prev" onMouseEnter={e => e.currentTarget.style.background = "white"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.9)"}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" aria-label="Imagen siguiente" onClick={nextImg} className="sn-galeria-btn sn-galeria-btn-next" onMouseEnter={e => e.currentTarget.style.background = "white"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.9)"}>
              <ChevronRight size={18} />
            </button>
            
            
            <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
              {imagenesArray.map((img, idx) => (
                <div key={String(img) || String(idx)} style={{ width: 6, height: 6, borderRadius: "50%", background: currentImgIdx === idx ? "#EC4899" : "rgba(0,0,0,0.2)", transition: "background 0.2s" }} />
              ))}
            </div>
          </>
        )}
      </div>
      
      <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
        <span className="sn-vendor-badge">
          Vendedor: {p.vendedor_nombre}
        </span>
        <h3 style={{ fontSize: 20, color: "#9333EA", margin: "0 0 8px 0", fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, lineHeight: 1.2 }}>{p.nombre}</h3>
        <p style={{ fontSize: 14, color: "#6A9E8A", margin: 0, flex: 1, lineHeight: 1.6 }}>{p.descripcion}</p>
        
        {isMine ? (
          p.stock === 0 ? (
            <div style={{ marginTop: 24, padding: "14px", background: "#FFF0F8", borderRadius: 12, textAlign: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#EC4899" }}>Tu producto ha sido vendido</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="sn-card-btn sn-card-btn-edit"
                onMouseEnter={e => { e.currentTarget.style.background = "#FFF0F8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "white"; }}
              >
                Editar producto
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOwnerDelete?.(); }}
                className="sn-card-btn sn-card-btn-del"
                onMouseEnter={e => { e.currentTarget.style.background = "#FFF5F5"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "white"; }}
              >
                Eliminar producto
              </button>
            </>
          )
        ) : (
          <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!authed) {
                window.dispatchEvent(new CustomEvent("r65:open-auth"));
                return;
              }
              // Cada pieza de segunda mano se compra sola: tiene un vendedor, un
              // envío y un ciclo de retención propios que no se pueden mezclar
              // con los de otro artículo en un mismo cobro.
              window.dispatchEvent(new CustomEvent("r65:comprar-ahora", {
                detail: {
                  id: p.id,
                  nombre: p.nombre,
                  precio: `€${Number(p.precio_final).toFixed(2)}`,
                  imagen: imagenActual,
                  categoria: "Segunda Mano",
                  cantidad: 1,
                  id_vendedor: p.id_vendedor,
                },
              }));
            }}
            className="sn-card-btn sn-card-btn-cart"
            onMouseEnter={e => Object.assign(e.currentTarget.style, { background: "#9333EA", transform: "translateY(-1px)" })}
            onMouseLeave={e => Object.assign(e.currentTarget.style, { background: "#EC4899", transform: "none" })}
          >
            <ShoppingCart size={16} /> {authed ? "Comprar ahora" : "Inicia sesión para comprar"}
          </button>
          </>
        )}
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAdminDelete(); }}
            className="sn-card-btn sn-card-btn-del"
            onMouseEnter={e => { e.currentTarget.style.background = "#FFF5F5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "white"; }}
          >
            Eliminar producto
          </button>
        )}
      </div>
    </article>
  );
}

function SubirProductoModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const [nombre, setNombre] = useState("");
  const [desc, setDesc] = useState("");
  const [precio, setPrecio] = useState("");
  const [tamano, setTamano] = useState<TamanoPaquete | null>(null);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);

  const precioNum = Number(precio) || 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const filesArray = Array.from(files);
    e.target.value = "";
    setIsDragging(false);
    uploadFiles(filesArray).then(urls => setImagenes(prev => [...prev, ...urls]));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      
      const filesArray = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      
      if (filesArray.length === 0) return;

      uploadFiles(filesArray).then(urls => setImagenes(prev => [...prev, ...urls]));
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImagenes(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || precioNum <= 0) return setError("Rellena el nombre y un precio válido.");
    if (!tamano) return setError("Elige el tamaño del paquete.");

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/segunda-mano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, descripcion: desc, precio_original: precioNum, imagen: imagenes, tamano_paquete: tamano })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir producto. ¿Has iniciado sesión?");
      
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="sn-modal-overlay">
      <div className="sn-modal-inner" style={{ maxWidth: 500 }}>
        <button type="button" aria-label="Cerrar" onClick={onClose} style={CLOSE_BUTTON_STYLE}>×</button>
        <h2 style={{ margin: "0 0 24px 0", color: "#9333EA", fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}>Vender Producto</h2>
        
        {error && <div style={{ padding: 12, background: "#FFF5F5", color: "#E74C3C", borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#6A9E8A", marginBottom: 6 }} htmlFor="sm-s-nombre">QUÉ VENDES</label>
            <input id="sm-s-nombre" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Andador plegable aluminio" className="sm-form-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#6A9E8A", marginBottom: 6 }} htmlFor="sm-s-desc">DESCRIPCIÓN Y ESTADO</label>
            <textarea id="sm-s-desc" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Casi nuevo, usado solo 2 meses..." rows={3} className="sm-form-input sm-form-textarea" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#6A9E8A", marginBottom: 6 }} htmlFor="sm-s-precio">PRECIO DE VENTA (€)</label>
            <input id="sm-s-precio" type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" className="sm-form-input" style={{ fontSize: 18 }} />
          </div>

          <SelectorTamano valor={tamano} onChange={setTamano} />

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#6A9E8A", marginBottom: 6 }}>FOTOS DEL PRODUCTO</p>
              
              <div 
                style={{ position: "relative", width: "100%" }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  id="foto-upload"
                  aria-label="Subir fotos del producto"
                  style={{
                    position: "absolute", width: "100%", height: "100%", opacity: 0, cursor: "pointer", zIndex: 2
                  }}
                />
                <div className="sn-drop-area" style={{ border: `2px dashed ${isDragging ? "#EC4899" : "#FBCFE8"}`, background: isDragging ? "#FDF2F8" : "#F8FBF9", transform: isDragging ? "scale(1.02)" : "scale(1)" }}>
                  <div className="sn-drop-icon" style={{ background: isDragging ? "#EC4899" : "#FDF2F8", color: isDragging ? "white" : "#EC4899" }}>
                    <PlusCircle size={16} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#EC4899", fontFamily: "'DM Sans', sans-serif" }}>
                    {isDragging ? "Suelta las fotos aquí..." : "Haz clic o arrastra fotos aquí"}
                  </span>
                  <span style={{ fontSize: 12, color: "#6A9E8A" }}>Formatos soportados: JPG, PNG, WEBP</span>
                </div>
              </div>
              
              <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 6, margin: "6px 0 0 0", textAlign: "center" }}>
                Puedes subir varias fotos. La primera será la principal.
              </p>
            </div>
            
            {imagenes.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                {imagenes.map((img, idx) => (
                  <div key={img} className="sn-img-thumb">
                    <Image src={img} alt={`Preview ${idx}`} fill sizes="80px" style={{ objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="sn-img-remove-btn"
                      title="Eliminar imagen"
                    >
                      ×
                    </button>
                    {idx === 0 && (
                      <span style={PRINCIPAL_BADGE_STYLE_SUBIR}>
                        Princ.
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="sn-submit-btn" style={{ opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Publicando..." : "Publicar producto"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

function EditarProductoModal({ producto, onClose, onRefresh }: { producto: ProductoSegundaMano, onClose: () => void, onRefresh: () => void }) {
  const imagenesIniciales = Array.isArray(producto.imagen) ? producto.imagen : [producto.imagen].filter(Boolean);
  const [nombre, setNombre] = useState(producto.nombre);
  const [desc, setDesc] = useState(producto.descripcion);
  const [precio, setPrecio] = useState(String(Number(producto.precio_final)));
  // Los productos publicados antes del cambio llegan sin tramo: este modal es
  // la vía por la que el vendedor lo completa.
  const [tamano, setTamano] = useState<TamanoPaquete | null>(
    (producto.tamano_paquete as TamanoPaquete | null) ?? null
  );
  const [imagenes, setImagenes] = useState<string[]>(imagenesIniciales as string[]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const filesArray = Array.from(files);
    e.target.value = "";
    const uploadFiles = async () => {
      const urls = (await Promise.all(filesArray.map(async (file) => {
        const fd = new FormData();
        fd.append("imagen", file);
        const res = await fetch("/api/upload-imagen", { method: "POST", body: fd });
        const data = await res.json();
        return res.ok && data.url ? data.url : null;
      }))).filter((u): u is string => Boolean(u));
      setImagenes(prev => [...prev, ...urls]);
    };
    uploadFiles();
  };

  const removeImage = (idx: number) => setImagenes(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const precioNum = Number(precio);
    if (!nombre || precioNum <= 0) return setError("Rellena el nombre y un precio válido.");
    if (!tamano) return setError("Elige el tamaño del paquete.");
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/segunda-mano", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: producto.id, nombre, descripcion: desc, precio_original: precioNum, imagen: imagenes, tamano_paquete: tamano })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminar = async () => {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/segunda-mano", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: producto.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="sn-modal-overlay">
      <div className="sn-modal-inner" style={{ maxWidth: 500 }}>
        <button type="button" aria-label="Cerrar" onClick={onClose} style={CLOSE_BUTTON_STYLE}>×</button>
        <h2 style={{ margin: "0 0 24px 0", color: "#9333EA", fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}>Editar producto</h2>

        {error && <div style={{ padding: 12, background: "#FFF5F5", color: "#E74C3C", borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#6A9E8A", marginBottom: 6 }} htmlFor="sm-e-nombre">QUÉ VENDES</label>
            <input id="sm-e-nombre" value={nombre} onChange={e => setNombre(e.target.value)} className="sm-form-input" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#6A9E8A", marginBottom: 6 }} htmlFor="sm-e-desc">DESCRIPCIÓN Y ESTADO</label>
            <textarea id="sm-e-desc" value={desc} onChange={e => setDesc(e.target.value)} rows={3} className="sm-form-input sm-form-textarea" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#6A9E8A", marginBottom: 6 }} htmlFor="sm-e-precio">PRECIO DE VENTA (€)</label>
            <input id="sm-e-precio" type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} className="sm-form-input" style={{ fontSize: 18 }} />
          </div>

          <SelectorTamano valor={tamano} onChange={setTamano} />

          <div>
            <p style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#6A9E8A", marginBottom: 6 }}>FOTOS DEL PRODUCTO</p>
            <div style={{ position: "relative", width: "100%" }}>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} aria-label="Subir fotos del producto" style={{ position: "absolute", width: "100%", height: "100%", opacity: 0, cursor: "pointer", zIndex: 2 }} />
              <div className="sn-drop-area" style={{ border: "2px dashed #FBCFE8", background: "#F8FBF9", transform: "scale(1)" }}>
                <div className="sn-drop-icon" style={{ background: "#FDF2F8", color: "#EC4899" }}>
                  <PlusCircle size={16} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#EC4899" }}>Añadir más fotos</span>
              </div>
            </div>
            {imagenes.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {imagenes.map((img, idx) => (
                  <div key={img} className="sn-img-thumb">
                    <Image src={img} alt={`Preview ${idx}`} fill sizes="80px" style={{ objectFit: "cover" }} />
                    <button type="button" aria-label="Quitar imagen" onClick={() => removeImage(idx)} className="sn-img-remove-btn">×</button>
                    {idx === 0 && <span style={PRINCIPAL_BADGE_STYLE_EDITAR}>Princ.</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" disabled={submitting} className="sn-submit-btn" style={{ opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>

        <div style={{ marginTop: 16, borderTop: "1px solid #EDE9FE", paddingTop: 16 }}>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={ELIMINAR_TRIGGER_STYLE}
            >
              Eliminar producto
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontSize: 14, color: "#9333EA", textAlign: "center", fontWeight: 600 }}>
                ¿Seguro que quieres eliminar este producto?
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={CANCELAR_BTN_STYLE_SM}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEliminar}
                  disabled={deleting}
                  style={{ ...DANGER_BTN_STYLE_SM, opacity: deleting ? 0.7 : 1 }}
                >
                  {deleting ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function EliminarProductoModal({ producto, onClose, onRefresh }: { producto: ProductoSegundaMano, onClose: () => void, onRefresh: () => void }) {
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const handleEliminar = async () => {
    if (!motivo.trim()) return setError("Escribe el motivo de la eliminación.");
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/segunda-mano", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: producto.id, motivo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="sn-modal-overlay">
      <div className="sn-modal-inner-sm" style={{ maxWidth: 460 }}>
        <button type="button" aria-label="Cerrar" onClick={onClose} style={CLOSE_BUTTON_STYLE}>×</button>
        <h2 style={{ margin: "0 0 8px 0", color: "#9333EA", fontFamily: "'Cormorant Garamond', serif", fontSize: 26 }}>Eliminar producto</h2>
        <p style={{ fontSize: 14, color: "#6A9E8A", margin: "0 0 24px 0" }}>
          Vas a eliminar <strong style={{ color: "#9333EA" }}>{producto.nombre}</strong>. El vendedor recibirá un email con el motivo.
        </p>

        {error && <div style={{ padding: 12, background: "#FFF5F5", color: "#E74C3C", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#6A9E8A", marginBottom: 6 }} htmlFor="sm-d-motivo">MOTIVO DE LA ELIMINACIÓN</label>
        <textarea id="sm-d-motivo"
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          rows={4}
          placeholder="Ej. El producto incumple las normas de la plataforma..."
          className="sm-form-input sm-form-textarea" style={{ fontSize: 14 }}
        />

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button
            type="button"
            onClick={onClose}
            style={CANCELAR_BTN_STYLE}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleEliminar}
            disabled={submitting}
            style={{ ...DANGER_BTN_STYLE, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Eliminando..." : "Confirmar eliminación"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PropietarioEliminarModal({ producto, onClose, onRefresh }: { producto: ProductoSegundaMano, onClose: () => void, onRefresh: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const handleEliminar = async () => {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/segunda-mano", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: producto.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="sn-modal-overlay">
      <div className="sn-modal-inner-sm" style={{ maxWidth: 420 }}>
        <button type="button" aria-label="Cerrar" onClick={onClose} style={CLOSE_BUTTON_STYLE}>×</button>
        <h2 style={{ margin: "0 0 8px 0", color: "#9333EA", fontFamily: "'Cormorant Garamond', serif", fontSize: 26 }}>Eliminar producto</h2>
        <p style={{ fontSize: 14, color: "#6A9E8A", margin: "0 0 24px 0" }}>
          ¿Seguro que quieres eliminar <strong style={{ color: "#9333EA" }}>{producto.nombre}</strong>? Esta acción no se puede deshacer.
        </p>

        {error && <div style={{ padding: 12, background: "#FFF5F5", color: "#E74C3C", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={CANCELAR_BTN_STYLE}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleEliminar}
            disabled={deleting}
            style={{ ...DANGER_BTN_STYLE, opacity: deleting ? 0.7 : 1 }}
          >
            {deleting ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
