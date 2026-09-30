"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingCart, Tag } from "lucide-react";
import { useCart } from "@/frontend/src/components/useCart";
import { FadeUp } from "@/frontend/src/components/fade-up";

type Resultado = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  imagen: string;
  categoria: string;
  fuente: "tecnologias" | "marketplace" | "segunda-mano";
  vendedor?: string;
};

const BUSCAR_SEARCH_BAR: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, background: "white", border: "2px solid var(--sand)", borderRadius: 16, padding: "4px 4px 4px 20px", boxShadow: "0 4px 20px rgba(42,58,32,0.08)", transition: "border-color .2s" };
const BUSCAR_INPUT: React.CSSProperties = { flex: 1, border: "none", outline: "none", fontSize: 16, fontFamily: "'DM Sans',sans-serif", color: "var(--slate)", background: "transparent", padding: "10px 0" };
const BUSCAR_SUBMIT_BTN: React.CSSProperties = { background: "var(--teal)", color: "white", border: "none", borderRadius: 12, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const BUSCAR_FUENTE_BADGE_BASE: React.CSSProperties = { position: "absolute", top: 10, left: 10, color: "white", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99, letterSpacing: "0.05em" };
const BUSCAR_SEGUNDA_MANO_BADGE: React.CSSProperties = { position: "absolute", top: 10, right: 10, background: "white", color: "var(--muted)", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 99, border: "1px solid var(--sand)", display: "flex", alignItems: "center", gap: 4 };
const BUSCAR_ADD_BTN_BASE: React.CSSProperties = { color: "white", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background .2s" };

const fuenteLabel: Record<string, { label: string; color: string; href: string }> = {
  "tecnologias":  { label: "Tecnología",   color: "#EC4899", href: "/marketplace" },
  "marketplace":  { label: "Marketplace",  color: "#2A7A6A", href: "/marketplace" },
  "segunda-mano": { label: "Segunda Mano", color: "#C9923A", href: "/segunda-mano" },
};

export default function BuscarPage() {
  const [query, setQuery]         = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading]     = useState(false);
  const { addItem }               = useCart();
  const [added, setAdded]         = useState<Record<string, boolean>>({});
  const inputRef                  = useRef<HTMLInputElement>(null);
  const searchIdRef               = useRef(0);

  // Lee ?q= de la URL
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") ?? "";
    setQuery(q);
    if (q) buscar(q);
    const tid = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(tid);
  }, []);

  const buscar = async (q: string) => {
    if (!q.trim()) { setResultados([]); return; }
    const requestId = ++searchIdRef.current;
    setLoading(true);
    try {
      const [tec, market, sm] = await Promise.all([
        fetch("/api/tecnologias").then(r => r.json()).catch(() => []),
        fetch("/api/marketplace").then(r => r.json()).catch(() => []),
        fetch("/api/segunda-mano").then(r => r.json()).catch(() => ({ productos: [] })),
      ]);
      if (requestId !== searchIdRef.current) return;

      const qq = q.toLowerCase();
      const coincide = (p: { nombre?: string; descripcion?: string }) =>
        (p.nombre ?? "").toLowerCase().includes(qq) ||
        (p.descripcion ?? "").toLowerCase().includes(qq);

      const tecItems: Resultado[] = (Array.isArray(tec) ? tec : []).reduce<Resultado[]>((acc, p: Record<string, unknown>) => {
        if (coincide(p)) acc.push({ id: Number(p.id), nombre: String(p.nombre ?? ""), descripcion: String(p.descripcion ?? ""), precio: String(p.precio ?? ""), imagen: String(p.imagen ?? ""), categoria: String(p.categoria ?? ""), fuente: "tecnologias" as const });
        return acc;
      }, []);

      const marketItems: Resultado[] = (Array.isArray(market) ? market : []).reduce<Resultado[]>((acc, p: Record<string, unknown>) => {
        if (coincide(p)) acc.push({ id: Number(p.id), nombre: String(p.nombre ?? ""), descripcion: String(p.descripcion ?? ""), precio: String(p.precio ?? ""), imagen: String(p.imagen ?? ""), categoria: String(p.categoria ?? ""), fuente: "marketplace" as const });
        return acc;
      }, []);

      const smRaw = sm?.productos ?? sm ?? [];
      const smItems: Resultado[] = (Array.isArray(smRaw) ? smRaw : []).reduce<Resultado[]>((acc, p: Record<string, unknown>) => {
        if (coincide(p)) acc.push({ id: Number(p.id), nombre: String(p.nombre ?? ""), descripcion: String(p.descripcion ?? ""), precio: String(p.precio ?? ""), imagen: String(p.imagen ?? (Array.isArray(p.fotos) ? (p.fotos as unknown[])[0] : undefined) ?? ""), categoria: "Segunda Mano", fuente: "segunda-mano" as const, vendedor: String(p.username ?? "") });
        return acc;
      }, []);

      setResultados([...tecItems, ...marketItems, ...smItems]);
    } finally {
      if (requestId === searchIdRef.current) setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set("q", query);
    window.history.replaceState({}, "", url.toString());
    buscar(query);
  };

  return (
    <div className="page-enter" style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>

        {/* Buscador */}
        <form onSubmit={handleSearch} style={{ marginBottom: 40 }}>
          <div style={BUSCAR_SEARCH_BAR}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--teal)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--sand)")}>
            <Search size={18} color="var(--muted)" />
            <input
              ref={inputRef}
              aria-labelledby="buscar-submit-btn"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar en toda la tienda… (tablet, robot, reloj...)"
              style={BUSCAR_INPUT}
            />
            <button id="buscar-submit-btn" type="submit" style={BUSCAR_SUBMIT_BTN}>
              Buscar
            </button>
          </div>
        </form>

        {/* Resultados */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 24, height: 24, border: "2px solid #EDE8DF", borderTopColor: "var(--teal)", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ color: "var(--muted)", fontSize: 15 }}>Buscando en todos los catálogos…</p>
            <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && query && resultados.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 18, color: "var(--slate)", fontWeight: 600, marginBottom: 8 }}>Sin resultados para "{query}"</p>
            <p style={{ color: "var(--muted)", fontSize: 15 }}>Prueba con otro término o explora nuestros catálogos</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
              {Object.entries(fuenteLabel).map(([k, v]) => (
                <Link key={k} href={v.href} style={{ padding: "10px 20px", borderRadius: 10, background: "white", border: `1.5px solid ${v.color}30`, color: v.color, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>{v.label}</Link>
              ))}
            </div>
          </div>
        )}

        {!loading && resultados.length > 0 && (
          <>
            <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 28 }}>
              <strong style={{ color: "var(--slate)" }}>{resultados.length}</strong> resultados para "<strong style={{ color: "var(--slate)" }}>{query}</strong>" en todos los catálogos
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px,100%),1fr))", gap: 20 }}>
              {resultados.map((r, i) => {
                const f = fuenteLabel[r.fuente];
                const key = `${r.fuente}-${r.id}`;
                return (
                  <FadeUp key={key} delay={i * 0.04}>
                    <div style={{ background: "white", borderRadius: 18, border: "1px solid var(--sand)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                      {/* Imagen */}
                      <div style={{ position: "relative", width: "100%", height: 180, background: "var(--cream)", flexShrink: 0 }}>
                        {r.imagen && (r.imagen.startsWith("/") || r.imagen.startsWith("http")) ? (
                          <Image fill src={r.imagen} alt={r.nombre} sizes="280px" style={{ objectFit: "contain", padding: 8 }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ShoppingCart size={40} color="var(--muted)" />
                          </div>
                        )}
                        {/* Badge fuente */}
                        <span style={{ ...BUSCAR_FUENTE_BADGE_BASE, background: f.color }}>
                          {f.label}
                        </span>
                        {r.fuente === "segunda-mano" && (
                          <span style={BUSCAR_SEGUNDA_MANO_BADGE}>
                            <Tag size={10} /> {r.vendedor}
                          </span>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ padding: "16px 16px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--slate)", margin: "0 0 6px", fontFamily: "'Fraunces',serif" }}>{r.nombre}</h3>
                        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, flex: 1, margin: "0 0 14px" }}>{r.descripcion.slice(0, 90)}{r.descripcion.length > 90 ? "…" : ""}</p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <strong style={{ fontSize: 17, color: "var(--teal)" }}>{r.precio ? `€${r.precio}` : ""}</strong>
                          {r.fuente !== "segunda-mano" ? (
                            <button
                              type="button"
                              onClick={() => {
                                addItem({ id: r.id, nombre: r.nombre, precio: r.precio, imagen: r.imagen, categoria: r.categoria });
                                setAdded(prev => ({ ...prev, [key]: true }));
                                setTimeout(() => setAdded(prev => ({ ...prev, [key]: false })), 1200);
                              }}
                              style={{ ...BUSCAR_ADD_BTN_BASE, background: added[key] ? "#2A7A6A" : "var(--teal)" }}
                            >
                              {added[key] ? "✓ Añadido" : "Añadir"}
                            </button>
                          ) : (
                            <Link href="/segunda-mano" style={{ background: "#C9923A", color: "white", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                              Ver
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </FadeUp>
                );
              })}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
