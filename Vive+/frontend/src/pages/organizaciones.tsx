"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { FadeUp } from "@/frontend/src/components/fade-up";
import {
  ExternalLink, Shield, Heart, Building2, Users, Laptop, ShieldCheck,
  HeartPulse, Dumbbell, Leaf, Palette, Landmark, Coffee, GraduationCap,
  Activity, Sofa, Eye, MessageCircle, Tag, Star, Zap, Globe, LayoutGrid,
} from "lucide-react";
import { FilterBar, type FilterOption } from "@/frontend/src/components/filter-bar";
import { BannerPublicitario } from "@/frontend/src/components/BannerPublicitario";
import { OrganizacionCard } from "@/frontend/src/components/cards";
import { apiService } from "@/frontend/src/services/apiService";

type Org = {
  id: number; nombre: string; tipo: string;
  descripcion: string; web: string | null;
  email: string | null; telefono: string | null;
  direccion: string | null; ciudad: string | null;
  estado: string | null; logo_url: string | null;
  servicios: { nombre: string; descripcion: string }[];
};

type CatOrgDB = { id: number; key: string; label: string; color: string; bg_color: string; text_color: string; icono: string; orden: number; };

const ICON_MAP_O: Record<string, React.ReactNode> = {
  Heart: <Heart size={14} />, Shield: <Shield size={14} />,
  Building2: <Building2 size={14} />, Users: <Users size={14} />,
  Laptop: <Laptop size={14} />, ShieldCheck: <ShieldCheck size={14} />,
  HeartPulse: <HeartPulse size={14} />, Dumbbell: <Dumbbell size={14} />,
  Leaf: <Leaf size={14} />, Palette: <Palette size={14} />,
  Landmark: <Landmark size={14} />, Coffee: <Coffee size={14} />,
  GraduationCap: <GraduationCap size={14} />, ExternalLink: <ExternalLink size={14} />,
  Activity: <Activity size={14} />, Sofa: <Sofa size={14} />,
  Eye: <Eye size={14} />, MessageCircle: <MessageCircle size={14} />,
  Tag: <Tag size={14} />, Star: <Star size={14} />,
  Zap: <Zap size={14} />, Globe: <Globe size={14} />, LayoutGrid: <LayoutGrid size={14} />,
};

const ORG_MOUSE_GLOW_BASE: React.CSSProperties = { position: "fixed", pointerEvents: "none", zIndex: 0, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)", transform: "translate(-50%,-50%)", transition: "left 0.1s ease, top 0.1s ease" };
const ORG_MAIN_LAYOUT: React.CSSProperties = { maxWidth: 1520, margin: "0 auto", padding: "2.5rem 1.5rem 4rem", fontFamily: "'DM Sans', sans-serif", display: "flex", gap: "2rem", alignItems: "flex-start", scrollMarginTop: "100px" };
const ORG_CTA_BOX: React.CSSProperties = { marginTop: 32, background: "linear-gradient(135deg, #9333EA 0%, #EC4899 100%)", borderRadius: 28, padding: "clamp(28px,5vw,52px) clamp(20px,4vw,48px)", textAlign: "center", position: "relative", overflow: "hidden", boxShadow: "0 24px 60px rgba(147,51,234,0.20)" };
const ORG_CTA_DISABLED_BTN: React.CSSProperties = { background: "var(--gold)", color: "white", borderRadius: 99, padding: "14px 38px", fontSize: 15, fontWeight: 600, display: "inline-block", fontFamily: "'DM Sans', sans-serif", opacity: 0.6, cursor: "not-allowed" };
const ORG_CTA_LINK_BTN: React.CSSProperties = { background: "var(--gold)", color: "white", borderRadius: 99, padding: "14px 38px", fontSize: 15, fontWeight: 600, textDecoration: "none", display: "inline-block", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 8px 28px rgba(236,72,153,0.35)" };

function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (evento: MouseEvent) => { if (ref.current) Object.assign(ref.current.style, { left: evento.clientX + "px", top: evento.clientY + "px" }); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={ref} style={ORG_MOUSE_GLOW_BASE} />;
}

export default function OrganizacionesPage() {
  const [orgs,        setOrgs]    = useState<Org[]>([]);
  const [catsDB,      setCatsDB]  = useState<CatOrgDB[]>([]);
  const [loading,     setLoading] = useState(true);
  const heroBgRef      = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const mainRef        = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; rol: string } | null>(null);

  useEffect(() => {
    apiService.getCategoriasOrganizaciones()
      .then(categorias => setCatsDB(categorias))
      .catch(() => {});
  }, []);

  const filterOptions: FilterOption[] = useMemo(() => [
    { key: "Todas", label: "Todas", color: "#EC4899" },
    ...catsDB.map(c => ({ key: c.key, label: c.label, color: c.color, icon: ICON_MAP_O[c.icono] ?? <Tag size={14} /> })),
  ], [catsDB]);

  const [filter, setFilter] = useState<string[]>(["Todas"]);

  // El banner principal ya no se mueve con el scroll ni salta a la
  // siguiente sección: el scroll es el normal del navegador.


  useEffect(() => {
    const tid = setTimeout(() => setLoading(true), 0);
    apiService.getOrganizaciones()
      .then(organizaciones => setOrgs(organizaciones))
      .finally(() => setLoading(false));
    return () => clearTimeout(tid);
  }, []);

  const handleFilter = (f: string) => {
    const next = (() => {
      if (f === "Todas") return ["Todas"];
      const sinTodas = filter.filter(filtro => filtro !== "Todas");
      if (filter.includes(f)) {
        const removed = sinTodas.filter(filtro => filtro !== f);
        return removed.length === 0 ? ["Todas"] : removed;
      }
      return [...sinTodas, f];
    })();

    setFilter(next);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("tipo");
        if (!next.includes("Todas")) {
          next.forEach(c => url.searchParams.append("tipo", c));
        }
        window.history.replaceState({}, "", url.toString());
      });
    }
  };

  const filterSet = new Set(filter);
  const filteredOrgs = filterSet.has("Todas")
    ? orgs
    : [...orgs]
        .filter(organizacion => filterSet.has(organizacion.tipo))
        .sort((a, b) => filter.indexOf(a.tipo) - filter.indexOf(b.tipo));

  return (
    <div className="page-enter" style={{ background: "#FFFFFF" }}>
      <style>{`
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
        
        .org-badge{animation:fadeInScale .7s cubic-bezier(.22,1,.36,1) both}
        .org-h1{animation:slideUp .9s .15s cubic-bezier(.22,1,.36,1) both}
        .org-sub{animation:slideUp .9s .3s cubic-bezier(.22,1,.36,1) both}
        .org-pill{display:inline-flex;align-items:center;gap:6px;padding:9px 22px;border-radius:99px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid transparent;transition:background-color .25s cubic-bezier(.22,1,.36,1),color .25s,border-color .25s,transform .25s,box-shadow .25s;font-family:'DM Sans',sans-serif}
        .org-pill-active{background:var(--primary);color:white;box-shadow:0 6px 20px var(--primary-glow);transform:translateY(-1px)}
        .org-pill-inactive{background:white;color:var(--ink-mid);border-color:var(--border-color)}
        .org-pill-inactive:hover{border-color:var(--primary);color:var(--primary);transform:translateY(-2px)}
        .org-card{transition:transform .4s cubic-bezier(.22,1,.36,1)}
        .org-emoji-box{transition:transform .4s cubic-bezier(.34,1.56,.64,1)}
        .org-card:hover .org-emoji-box{transform:scale(1.18) rotate(-6deg)}
        .org-top-bar{transition:height .3s ease}
        .org-visit-btn{transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s}
        .org-visit-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.2) !important}
        .org-scroll{animation:bounce-y 2s infinite}
        `}</style>

      <MouseGlow />


      <header className="sn-hero" ref={heroRef}>
        <div
          ref={heroBgRef}
          className="sn-hero__bg"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=1800&auto=format&fit=crop')" }}
        />
        <div className="sn-hero__overlay" />
        <div className="sn-hero__inner" ref={heroContentRef}>
          <h1 className="sn-hero__title">
            <span className="sn-word"><span>Nuestras</span></span>
            <br />
            <span className="sn-word delay gold"><span>Organizaciones</span></span>
          </h1>
          <p className="sn-hero__sub">
            Las mejores organizaciones de Santander comprometidas con el bienestar de las personas mayores
          </p>
        </div>
        <div className="sn-hero__scroll">
          <div className="sn-hero__bar" />
          <span>SCROLL</span>
        </div>
      </header>

      <div style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 55" fill="none" style={{ width: "100%" }}>
          <path d="M0,28 C360,55 1080,0 1440,28 L1440,55 L0,55 Z" fill="white" />
        </svg>
      </div>

      <main
        ref={mainRef}
        id="organizaciones"
        style={ORG_MAIN_LAYOUT}
      >
        <div className="hidden-mobile">
          <BannerPublicitario ubicacion="organizaciones" lateral={true} />
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingBottom: "100px" }}>
          <FilterBar
            options={filterOptions}
            active={filter}
            onToggle={handleFilter}
            resultWord="organización"
            resultCount={filteredOrgs.length}
            loading={loading}
          />

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 24, height: 24, border: "2px solid #EDE9FE", borderTopColor: "var(--teal)", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ color: "var(--muted)", fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>Cargando organizaciones…</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(340px,100%),1fr))", gap: 28 }}>
            {filteredOrgs.map((org, indice) => (
              <OrganizacionCard
                key={org.id}
                org={org}
                typeColor={catsDB.find(c => c.key === org.tipo)?.color}
                typeLabel={catsDB.find(c => c.key === org.tipo)?.label}
                delay={indice * 0.08}
              />
            ))}
          </div>
        )}

        {/* Banner Horizontal Inferior */}
        <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <BannerPublicitario ubicacion="organizaciones" lateral={false} />
        </div>

        <FadeUp>
          <div style={ORG_CTA_BOX}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem,3vw,2.4rem)", color: "white", marginBottom: 14, fontWeight: 600 }}>
              ¿Tu organización quiere <em>colaborar</em>?
            </h3>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.7, maxWidth: 500, margin: "0 auto 28px", fontFamily: "'DM Sans', sans-serif" }}>
              Si representas una organización comprometida con las personas mayores, únete a nuestra red.
            </p>
            {currentUser?.rol === "admin" ? (
                <div style={ORG_CTA_DISABLED_BTN}>
                  Solo para usuarios
                </div>
              ) : (
                <Link href="/contacto" style={ORG_CTA_LINK_BTN}>
                  Contáctanos
                </Link>
              )}
          </div>
        </FadeUp>

        <div style={{ marginTop: "2.5rem" }}>
          <Link
            href="/"
            style={{
              color: "#EC4899",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: 13.5,
              opacity: 0.75,
            }}
          >
            Volver al inicio
          </Link>
        </div>
        </div>

        <div className="hidden-mobile">
          <BannerPublicitario ubicacion="organizaciones" lateral={true} />
        </div>
      </main>
    </div>
  );
}

