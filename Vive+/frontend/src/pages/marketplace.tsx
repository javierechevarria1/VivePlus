"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart, Check, LayoutGrid, HeartPulse, Activity, ShieldCheck,
  Laptop, Sofa, Eye, MessageCircle, Dumbbell, Leaf, Palette, Landmark,
  Coffee, GraduationCap, Heart, Shield, Building2, Users, Tag, Star, Zap, Globe, Search,
} from "lucide-react";

type CatProductoDB = { id: number; nombre: string; color: string; gradiente: string; icono: string; orden: number };

const ICON_MAP_P: Record<string, React.ReactNode> = {
  HeartPulse: <HeartPulse size={14} />, Activity: <Activity size={14} />,
  ShieldCheck: <ShieldCheck size={14} />, Laptop: <Laptop size={14} />,
  Sofa: <Sofa size={14} />, Eye: <Eye size={14} />,
  MessageCircle: <MessageCircle size={14} />, Dumbbell: <Dumbbell size={14} />,
  Leaf: <Leaf size={14} />, Palette: <Palette size={14} />,
  Landmark: <Landmark size={14} />, Coffee: <Coffee size={14} />,
  GraduationCap: <GraduationCap size={14} />, Heart: <Heart size={14} />,
  Shield: <Shield size={14} />, Building2: <Building2 size={14} />,
  Users: <Users size={14} />, Tag: <Tag size={14} />,
  Star: <Star size={14} />, Zap: <Zap size={14} />,
  Globe: <Globe size={14} />, LayoutGrid: <LayoutGrid size={14} />,
};
import { useCart } from "@/frontend/src/components/useCart";
import { FilterBar } from "@/frontend/src/components/cards";
import { BannerPublicitario } from "@/frontend/src/components/BannerPublicitario";
import { FadeUp } from "@/frontend/src/components/fade-up";
import PusherClient from "pusher-js";
import { marketplaceService } from "@/frontend/src/services/marketplaceService";


type Producto = {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: string;
  categoria: string;
  imagen: string;
  stock?: number;
  specs: { label: string; value: string }[];
  destacados: string[];
};

const DEFAULT_CAT_COLOR = "var(--teal)";
const DEFAULT_CAT_BG    = "linear-gradient(135deg, #FFF0F8 0%, #FAF8FF 100%)";

const MOUSE_GLOW_BASE: React.CSSProperties = { position: "fixed", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 50, transition: "top 0.1s ease-out, left 0.1s ease-out" };
const ANIM_CAT_BADGE_BASE: React.CSSProperties = { position: "absolute", top: 12, left: 12, color: "white", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99, letterSpacing: "0.07em", textTransform: "uppercase" };
const ANIM_STOCK_BADGE_BASE: React.CSSProperties = { position: "absolute", top: 12, right: 12, fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };
const ANIM_EXPAND_BTN_BASE: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 10, padding: "8px 15px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", letterSpacing: "0.02em", transition: "background-color 0.25s ease, color 0.25s ease, transform 0.25s ease" };
const ANIM_ADD_BTN_BASE: React.CSSProperties = { width: "100%", padding: "10px", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background-color 0.3s cubic-bezier(0.22,1,0.36,1), color 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s cubic-bezier(0.22,1,0.36,1), transform 0.3s cubic-bezier(0.22,1,0.36,1)" };
const MARKETPLACE_MAIN_LAYOUT: React.CSSProperties = { maxWidth: 1520, margin: "0 auto", padding: "2.5rem 1.5rem 4rem", fontFamily: "'DM Sans', sans-serif", display: "flex", gap: "2rem", scrollMarginTop: "100px", alignItems: "flex-start" };
const SEARCH_INPUT_BASE: React.CSSProperties = { width: "100%", padding: "10px 16px 10px 38px", border: "1.5px solid #E9D8FD", borderRadius: 99, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#0F172A", background: "white", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" };


function MouseGlow() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
 
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
 
  return (
    <div
      style={{ ...MOUSE_GLOW_BASE, top: pos.y - 150, left: pos.x - 150 }}
    />
  );
}
 
function AnimatedCardDetails({ specs, destacados, catColor }: {
  specs: { label: string; value: string }[];
  destacados: string[];
  catColor: string;
}) {
  return (
    <div
      style={{
        marginTop: 14,
        animation: "expandIn 0.25s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <style>{`
        @keyframes expandIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>

      <div
        style={{
          height: 1,
          background: `${catColor}20`,
          marginBottom: 12,
        }}
      />

      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          color: catColor,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          margin: "0 0 6px",
        }}
      >
        Especificaciones
      </p>

      <div
        style={{
          background: "#FAF8FF",
          borderRadius: 10,
          padding: "2px 12px",
          marginBottom: 12,
        }}
      >
        {specs.map((s, i) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 8,
              padding: "7px 0",
              borderBottom:
                i < specs.length - 1 ? "1px solid #EDE9FE" : "none",
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: "#334155",
                fontWeight: 500,
              }}
            >
              {s.label}
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: "#0F172A",
                fontWeight: 600,
                textAlign: "right",
              }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          color: catColor,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          margin: "0 0 6px",
        }}
      >
        Puntos destacados
      </p>

      <div style={{ marginBottom: 4 }}>
        {destacados.map((d) => (
          <div
            key={d}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 0",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "#1E1B4B",
            }}
          >
            <div
              style={{
                width: 15,
                height: 15,
                borderRadius: 4,
                background: `${catColor}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Check size={8} color={catColor} strokeWidth={3} />
            </div>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedCard({ p, index, onStockChange, isAdmin, comprarDisabled, authed, catColorMap, catBgMap }: {
  p: Producto; index: number; onStockChange?: (id: number, delta: number) => void; isAdmin?: boolean; comprarDisabled?: boolean;
  authed: boolean;
  catColorMap: Record<string, string>; catBgMap: Record<string, string>;
}) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const { addItem } = useCart();

  const catColor = catColorMap[p.categoria] ?? DEFAULT_CAT_COLOR;
  const catBg    = catBgMap[p.categoria]    ?? DEFAULT_CAT_BG;
  const delay = index * 65;
  const sinStock = typeof p.stock === "number" && p.stock <= 0;
 
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
 
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 }
    );
 
    io.observe(el);
    return () => io.disconnect();
  }, []);
 
  const handleAdd = () => {
    if (sinStock) return;

    if (!authed) {
      window.dispatchEvent(new CustomEvent("r65:open-auth"));
      return;
    }

    addItem({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      imagen: p.imagen,
      categoria: p.categoria,
    });


    if (p.id) onStockChange?.(p.id, -1);

    setAdded(true);
    setTimeout(() => setAdded(false), 1100);
  };
 
  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? catColor + "40" : "#EDE9FE"}`,
        borderRadius: 24,
        background: "white",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: hovered
          ? `0 24px 54px ${catColor}18, 0 8px 24px rgba(0,0,0,0.06)`
          : "0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0) scale(1)"
          : "translateY(36px) scale(0.97)",
        transition: [
          `opacity 0.65s cubic-bezier(.4,0,.2,1) ${delay}ms`,
          `transform 0.65s cubic-bezier(.22,.68,0,1.1) ${delay}ms`,
          "box-shadow 0.4s ease",
          "border-color 0.3s ease",
        ].join(", "),

        position: "relative",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 210,
          flexShrink: 0,
          background: catBg,
          overflow: "hidden",
        }}
      >
        <Image
          fill sizes="100vw"
          src={p.imagen && (p.imagen.startsWith("/") || p.imagen.startsWith("http")) ? p.imagen : "/img/placeholder.png"}
          alt={p.nombre}
          style={{
            objectFit: "contain",
            objectPosition: "center",
            padding: "12px",
            boxSizing: "border-box",
            transform: hovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.6s cubic-bezier(.22,.68,0,1.1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 48,
            background:
              "linear-gradient(to top, rgba(255,255,255,0.5) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        <span
          style={{ ...ANIM_CAT_BADGE_BASE, background: catColor, boxShadow: `0 2px 8px ${catColor}55` }}
        >
          {p.categoria}
        </span>
 
        {/* Cuántas unidades quedan es dato interno: al comprador solo le
            importa si puede comprarlo o no. */}
        {typeof p.stock === "number" && p.stock <= 0 && (
          <span style={{ ...ANIM_STOCK_BADGE_BASE, background: "#FFE8E8", color: "#C0392B" }}>
            Sin stock
          </span>
        )}
      </div>
 
      <div
        style={{
          padding: "1.15rem 1.2rem 1.2rem",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <h2
          style={{
            margin: "0 0 0.45rem",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1.13rem",
            color: "#0F172A",
            fontWeight: 600,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
          }}
        >
          {p.nombre}
        </h2>
 
        <p
          style={{
            margin: "0 0 auto",
            color: "#334155",
            lineHeight: 1.75,
            fontSize: 15,
            fontWeight: 400,
          }}
        >
          {p.descripcion}
        </p>
 
        {expanded && (
          <AnimatedCardDetails specs={p.specs} destacados={p.destacados} catColor={catColor} />
        )}
 
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "0.85rem",
            borderTop: `1px solid ${catColor}18`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span
                style={{
                  fontSize: 12,
                  color: "#6b8278",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Precio
              </span>
              <strong
                style={{
                  fontSize: "1.1rem",
                  color: catColor,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {p.precio}
              </strong>
            </div>
 
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              style={{ ...ANIM_EXPAND_BTN_BASE, color: expanded ? "white" : catColor, background: expanded ? catColor : `${catColor}14` }}
            >
              {expanded ? "Ver menos ↑" : "Ver más ↓"}
            </button>
          </div>
 
          {!isAdmin && (
            <button
              type="button"
              onClick={handleAdd}
              disabled={sinStock || comprarDisabled}
              style={{
                ...ANIM_ADD_BTN_BASE,
                cursor: sinStock || comprarDisabled ? "not-allowed" : "pointer",
                background: sinStock || comprarDisabled
                  ? "#E9E5DE"
                  : added
                  ? "#EC4899"
                  : `${catColor}18`,
                color: sinStock || comprarDisabled ? "#9E9486" : added ? "white" : catColor,
                boxShadow: added ? `0 6px 18px ${catColor}40` : "none",
                transform: added ? "scale(0.98)" : "scale(1)",
                opacity: sinStock || comprarDisabled ? 0.85 : 1,
              }}
            >
              {sinStock ? (
                "Sin stock"
              ) : comprarDisabled ? (
                "No disponible"
              ) : !authed ? (
                <>
                  <ShoppingCart size={14} /> Inicia sesión para comprar
                </>
              ) : added ? (
                <>
                  <Check size={14} /> Añadido
                </>
              ) : (
                <>
                  <ShoppingCart size={14} /> Añadir al carrito
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

const MARKETPLACE_STYLES = `
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


  @keyframes prSlide { from { opacity:0; transform: translateY(22px); } to { opacity:1; transform: none; } }
  @keyframes prFade  { from { opacity:0; } to { opacity:1; } }
  @keyframes prBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }

  .pr-badge { animation: prFade 0.7s cubic-bezier(.22,1,.36,1) both; }
  .pr-h1 {
    animation: prSlide .9s .12s cubic-bezier(.22,1,.36,1) both;
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(3.2rem, 6vw, 4.5rem);
    font-weight: 600;
    color: white;
    line-height: 1.05;
    margin: 0 0 1.25rem;
    letter-spacing: -0.02em;
    text-align: center;
  }
  .pr-sub   { animation: prSlide .9s .26s cubic-bezier(.22,1,.36,1) both; }
  .pr-scroll { animation: prFade .8s .7s ease both; }

  .wave-divider svg { display: block; }

  .tab-pill {
    padding: 7px 16px;
    border-radius: 99px;
    border: 1.5px solid #E9D8FD;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    background: white;
    color: #64748B;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    white-space: nowrap;
    line-height: 1;
  }

  .tab-pill:hover {
    border-color: #EC4899;
    color: #EC4899;
  }

  .tab-pill.active {
    color: white;
    border-color: transparent;
  }

  @media (max-width: 900px) {
    .prod-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }

  @media (max-width: 640px) {
    .prod-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 560px) {
    .prod-grid {
      grid-template-columns: 1fr !important;
    }
    .pr-h1 {
      font-size: clamp(2.2rem, 9vw, 3rem) !important;
    }
    .prod-hero-content {
      padding: 0 16px !important;
    }
    .pr-badge {
      margin-bottom: 12px !important;
    }
  }
`;

// Sincroniza el stock entre pestañas (BroadcastChannel), eventos locales y Pusher
function useStockSync(setProductos: React.Dispatch<React.SetStateAction<Producto[]>>) {
  const stockChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as { producto_id: number; delta?: number; stock?: number };
      setProductos((prev) =>
        prev.map((p) => {
          if (p.id !== d.producto_id) return p;
          const nuevo = d.stock !== undefined ? d.stock : Math.max(0, (p.stock ?? 0) + (d.delta ?? 0));
          return { ...p, stock: nuevo };
        })
      );
    };
    window.addEventListener("relatia-stock-change", handler);
    return () => window.removeEventListener("relatia-stock-change", handler);
  }, [setProductos]);

  useEffect(() => {
    stockChannel.current = new BroadcastChannel("relatia-stock");
    stockChannel.current.onmessage = (e) => {
      const d = e.data ?? {};
      setProductos((prev) =>
        prev.map((p) => {
          if (p.id !== d.producto_id) return p;
          const nuevo = d.stock !== undefined ? d.stock : Math.max(0, (p.stock ?? 0) + (d.delta ?? 0));
          return { ...p, stock: nuevo };
        })
      );
    };
    return () => stockChannel.current?.close();
  }, [setProductos]);

  useEffect(() => {
    const pusherKey     = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!pusherKey || !pusherCluster) return;

    const client  = new PusherClient(pusherKey, { cluster: pusherCluster });
    const channel = client.subscribe("stock");

    channel.bind("actualizado", (data: { producto_id: number; stock: number }) => {
      setProductos((prev) =>
        prev.map((p) => p.id === data.producto_id ? { ...p, stock: data.stock } : p)
      );
      stockChannel.current?.postMessage({ producto_id: data.producto_id, stock: data.stock });
    });

    return () => {
      channel.unbind_all();
      client.unsubscribe("stock");
      client.disconnect();
    };
  }, [setProductos]);

  return stockChannel;
}


// Limpia el carrito y notifica éxito/cancelación tras volver de Stripe
function usePaymentReturnEvents(searchParams: ReturnType<typeof useSearchParams>) {
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      // Lo manda stripe-success con el importe real de la sesión de pago. Hay
      // que leerlo antes de limpiar la URL, y es más fiable que el carrito:
      // para cuando se muestra el resumen, el carrito ya está vacío.
      const totalPagado = parseFloat(searchParams.get("total") ?? "0");

      const canal = new BroadcastChannel("relatia-cart");
      canal.postMessage({ type: "cart-clear", usuarioId: null });
      canal.close();

      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      url.searchParams.delete("total");
      window.history.replaceState({}, "", url.toString());

      window.dispatchEvent(new Event("stock-actualizado"));
      window.dispatchEvent(new CustomEvent("pago-completado", { detail: { success: true, total: totalPagado } }));
    }

    if (searchParams.get("canceled") === "true") {
      const url = new URL(window.location.href);
      url.searchParams.delete("canceled");
      window.history.replaceState({}, "", url.toString());

      window.dispatchEvent(new CustomEvent("pago-completado", { detail: { success: false } }));
    }
  }, [searchParams]);
}

function MarketplaceInner() {
  const searchParams = useSearchParams();
  const [productos,       setProductos]       = useState<Producto[]>([]);
  const [catsDB,          setCatsDB]          = useState<CatProductoDB[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [tabsActivas, setTabsActivas] = useState<string[]>(["Tecnología"]);
  const [busqueda, setBusqueda] = useState("");
  const [filterKey, setFilterKey] = useState(0);
  const headerVisibleRef = useRef(false);
  const heroBgRef      = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const mainRef        = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrg, setIsOrg] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const leerUsuario = () => {
      setAuthed(sessionStorage.getItem("r65_authed") === "true");
      try {
        const saved = sessionStorage.getItem("r65_user:v1");
        if (saved) {
          const user = JSON.parse(saved);
          setIsAdmin(user?.rol === "admin");
          setIsOrg(user?.rol === "usuario_organizacion");
        }
      } catch {

      }
    };

    leerUsuario();
    window.addEventListener("relatia-auth-changed", leerUsuario);
    window.addEventListener("r65:authed", leerUsuario);
    return () => {
      window.removeEventListener("relatia-auth-changed", leerUsuario);
      window.removeEventListener("r65:authed", leerUsuario);
    };
  }, []);

  useEffect(() => {
    marketplaceService.getCategoriasProductos()
      .then(cats => setCatsDB(cats))
      .catch(() => {});
  }, []);

  const catColorMap: Record<string, string>      = Object.fromEntries(catsDB.map(c => [c.nombre, c.color]));
  const catBgMap:    Record<string, string>      = Object.fromEntries(catsDB.map(c => [c.nombre, c.gradiente || DEFAULT_CAT_BG]));
  const catIconMap:  Record<string, React.ReactNode> = { Todas: <LayoutGrid key="Todas" size={14} />, ...Object.fromEntries(catsDB.map(c => [c.nombre, ICON_MAP_P[c.icono] ?? <Tag key={c.nombre} size={14} />])) };
  const categorias = ["Todas", ...catsDB.map(c => c.nombre)];

  const stockChannel = useStockSync(setProductos);

  const handleStockChange = (id: number, delta: number) => {
    setProductos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stock: Math.max(0, (p.stock ?? 0) + delta) } : p
      )
    );
    stockChannel.current?.postMessage({ producto_id: id, delta });
  };

  useEffect(() => {
    const t = setTimeout(() => { headerVisibleRef.current = true; }, 60);
    return () => clearTimeout(t);
  }, []);


  usePaymentReturnEvents(searchParams);

  useEffect(() => {
    let cancelado = false;
 
    const cargarProductos = async () => {
      try {
        const [tecData, mktData] = await Promise.all([
          marketplaceService.getTecnologias(),
          marketplaceService.getProductos(),
        ]);
        if (!cancelado) setProductos([...tecData, ...mktData]);
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        if (!cancelado) setLoadingProductos(false);
      }
    };
 
    cargarProductos();


    const alVolverAlTab = () => {
      if (document.visibilityState === "visible") void cargarProductos();
    };
    document.addEventListener("visibilitychange", alVolverAlTab);
 

    const intervalo = setInterval(() => void cargarProductos(), 60_000);
 
    const refrescar = () => { void cargarProductos(); };
    window.addEventListener("stock-actualizado", refrescar);
 
    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", alVolverAlTab);
      clearInterval(intervalo);
      window.removeEventListener("stock-actualizado", refrescar);
    };
  }, []);
 
  
  useEffect(() => {
    const cats = searchParams.getAll("cat");
    if (cats.length === 0) {
      setTabsActivas(["Tecnología"]);
    } else if (cats.includes("Todas")) {
      setTabsActivas(["Todas"]);
    } else {
      setTabsActivas(cats);
    }
  }, [searchParams]);
 
  const handleTab = (cat: string) => {

    const next = (() => {
      if (cat === "Todas") return ["Todas"];
      const sinTodas = tabsActivas.filter((f) => f !== "Todas");
      if (tabsActivas.includes(cat)) {
        const removed = sinTodas.filter((f) => f !== cat);
        return removed.length === 0 ? ["Todas"] : removed;
      }
      return [...sinTodas, cat];
    })();
 
    setTabsActivas(next);
    setFilterKey((k) => k + 1);
 
    if (typeof window !== "undefined") {

      requestAnimationFrame(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("cat");
        if (next.includes("Todas")) {
          url.searchParams.append("cat", "Todas");
        } else {
          next.forEach(c => url.searchParams.append("cat", c));
        }
        window.history.replaceState({}, "", url.toString());
      });
    }
  };
 
  const productosFiltrados = (() => {
    const tabsActivasSet = new Set(tabsActivas);
    const porCategoria = tabsActivasSet.has("Todas")
      ? productos
      : [...productos]
          .filter((p) => tabsActivasSet.has(p.categoria))
          .sort((a, b) => tabsActivas.indexOf(a.categoria) - tabsActivas.indexOf(b.categoria));
    if (!busqueda.trim()) return porCategoria;
    const q = busqueda.toLowerCase();
    return porCategoria.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q)
    );
  })();
 
  return (
    <div className="page-enter" style={{ background: "#FFFFFF" }}>
      <MouseGlow />
      <style>{MARKETPLACE_STYLES}</style>
 

      <header className="sn-hero" ref={heroRef}>
        <div
          ref={heroBgRef}
          className="sn-hero__bg"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1758686253992-62c9c69dfe61?q=80&w=2200&auto=format&fit=crop')" }}
        />
        <div className="sn-hero__overlay" />
        <div className="sn-hero__inner" ref={heroContentRef}>
          <h1 className="sn-hero__title">
            <span className="sn-word"><span>Nuestros</span></span>
            <br />
            <span className="sn-word delay gold"><span>Marketplace</span></span>
          </h1>
          <p className="sn-hero__sub">
            Soluciones prácticas de movilidad, seguridad y salud, con envío gratuito a Santander
          </p>
        </div>
        <div className="sn-hero__scroll">
          <div className="sn-hero__bar" />
          <span>SCROLL</span>
        </div>
      </header>

      <main
        ref={mainRef}
        id="tienda"
        style={MARKETPLACE_MAIN_LAYOUT}
      >

        <div className="hidden-mobile">
          <BannerPublicitario ubicacion="productos" lateral={true} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <FadeUp>
              <FilterBar
                  key={filterKey}
                  options={categorias.map((cat) => ({
                    key: cat,
                    label: cat,
                    icon: catIconMap[cat],
                    color: cat === "Todas" ? "#EC4899" : (catColorMap[cat] ?? "#EC4899"),
                    count: cat === "Todas" ? productos.length : productos.filter((p) => p.categoria === cat).length,
                  }))}
                  active={tabsActivas}
                  onToggle={(key: string) => handleTab(key)}
              />
            </FadeUp>
   
            <FadeUp>
              <div style={{ position: "relative", width: "min(480px, 100%)", margin: "1rem 0 0" }}>
                <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#AAB8B2", pointerEvents: "none" }} />
                <input
                  type="text"
                  aria-label="Buscar productos"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar productos..."
                  style={SEARCH_INPUT_BASE}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#EC4899")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E9D8FD")}
                />
              </div>
            </FadeUp>

            <FadeUp>
              <div style={{ fontSize: 15, color: "#334155", fontWeight: 600, marginTop: "1rem", marginBottom: "2rem", textAlign: "center" }}>
                Mostrando <span style={{ color: "#EC4899" }}>{productosFiltrados.length}</span> productos
              </div>
            </FadeUp>
          </div>
   
          {loadingProductos && (
            <p style={{ margin: "0 0 1rem", color: "#334155", fontSize: 16, textAlign: "center" }}>
              Cargando productos desde la base de datos…
            </p>
          )}
   
          <div
            key={filterKey}
            className="prod-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.3rem",
              alignItems: "start",
            }}
          >
            {productosFiltrados.map((p, i) => (
              <AnimatedCard
                key={`${filterKey}-${p.id ?? p.nombre}`}
                p={p}
                index={i}
                onStockChange={handleStockChange}
                isAdmin={isAdmin}
                comprarDisabled={isOrg}
                authed={authed}
                catColorMap={catColorMap}
                catBgMap={catBgMap}
              />
            ))}
          </div>


          <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <BannerPublicitario ubicacion="productos" lateral={false} />
          </div>
   
          <div style={{ marginTop: "2.5rem" }}>
            <Link
              href="/"
              style={{
                color: "#EC4899",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 15,
                opacity: 0.9,
              }}
            >
              Volver al inicio
            </Link>
          </div>
        </div>


        <div className="hidden-mobile">
          <BannerPublicitario ubicacion="productos" lateral={true} />
        </div>
      </main>
    </div>
  );
}
export default function MarketplacePage() {
  return (
    <Suspense>
      <MarketplaceInner />
    </Suspense>
  );
}
