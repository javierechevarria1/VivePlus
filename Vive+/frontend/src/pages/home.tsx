"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import TestimoniosSection from "@/frontend/src/components/Testimoniossection";
import { BannerPublicitario } from "@/frontend/src/components/BannerPublicitario";
import { Building2, Handshake, Sparkles, Heart, Laptop } from "lucide-react";

const FEATURES = [
  {
    img: "/img/cuidadores.png",
    title: "Cuidadores Profesionales",
    desc: "Cuidadores certificados y con experiencia, disponibles según tus horarios y necesidades.",
    href: "/salud",
    icon: <Handshake size={20} />,
  },
  {
    img: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=800&auto=format&fit=crop",
    title: "Tecnología",
    desc: "Productos tecnológicos inteligentes: robots asistentes, altavoces inteligentes y dispositivos que facilitan el día a día.",
    href: "/marketplace",
    icon: <Laptop size={20} />,
  },
  {
    img: "/img/actividades.jpg",
    title: "Actividades",
    desc: "Actividades sociales, voluntariado, centros de día y cursos de tecnología en Santander.",
    href: "/recursos",
    icon: <Sparkles size={20} />,
  },
  {
    img: "/img/comunidad.png",
    title: "Acompañamiento",
    desc: "Conectamos personas mayores con su comunidad para vivir con más energía, risas y momentos que importan.",
    href: "/sobre-nosotros",
    icon: <Heart size={20} />,
  },
];

const VITA_STAMPS = [
  "07:00 · martes",
  "07:00 · martes",
  "09:15 · martes",
  "11:08 · martes",
  "14:20 · martes",
  "17:55 · martes",
  "una cifra",
  "21:14 · martes",
];

const VITA_IMGS = {
  portrait: "/img/foto_1.jpg",
  morning:  "/img/Foto_2.jpg",
  table:    "/img/foto_3.jpg",
  window:   "/img/foto_4.jpg",
  call:     "/img/foto_5.jpg",
};

const VITA_HERO_STYLES = `
  /* ══ Vita Hero — paleta rosa · morado · azul ══ */
  .vt-wrap {
    --s-bg0:   oklch(1 0 0);
    --s-bg1:   oklch(0.97 0.012 350);
    --s-ink:   oklch(0.16 0.03 265);
    --s-ink2:  oklch(0.35 0.05 270);
    --s-ink3:  oklch(0.55 0.04 280);
    --s-pink:  oklch(0.65 0.24 350);
    --s-pink2: oklch(0.58 0.22 348);
    --s-purple:oklch(0.52 0.22 290);
    --s-blue:  oklch(0.48 0.22 265);
    --s-glass: oklch(1 0 0 / 0.70);
    --s-gb:    oklch(0.88 0.06 350 / 0.35);
    --s-serif: "Cormorant Garamond","Times New Roman",serif;
    --s-mono:  "IBM Plex Mono",ui-monospace,monospace;
  }

  /* Sticky cinematic stage */
  .vt-stage {
    position: sticky; top: 0; height: 100vh; overflow: hidden;
    background:
      radial-gradient(ellipse 65% 55% at 15% 20%, oklch(0.88 0.18 350/.45), transparent 62%),
      radial-gradient(ellipse 55% 45% at 88% 72%, oklch(0.78 0.16 290/.35), transparent 62%),
      radial-gradient(ellipse 60% 50% at 50% 100%, oklch(0.75 0.18 265/.30), transparent 68%),
      linear-gradient(180deg, var(--s-bg1), var(--s-bg0) 55%, oklch(0.97 0.01 300));
  }

  /* Floating particle dots */
  .vt-stage::before {
    content:""; position:absolute; inset:0; pointer-events:none;
    background-image:
      radial-gradient(2px 2px at 20% 30%, var(--s-pink) 50%, transparent 60%),
      radial-gradient(2px 2px at 72% 14%, var(--s-purple) 50%, transparent 60%),
      radial-gradient(2px 2px at 40% 80%, var(--s-blue) 50%, transparent 60%),
      radial-gradient(2px 2px at 88% 60%, var(--s-pink) 50%, transparent 60%),
      radial-gradient(2px 2px at 12% 65%, var(--s-purple) 50%, transparent 60%),
      radial-gradient(2px 2px at 55% 40%, var(--s-blue) 50%, transparent 60%);
    background-size:100% 100%; opacity:.55;
    animation: vt-drift 14s ease-in-out infinite alternate;
  }
  .vt-stage::after {
    content:""; position:absolute; inset:0; pointer-events:none;
    background: linear-gradient(180deg, transparent 30%, oklch(0.88 0.06 280/.35) 100%);
  }
  @keyframes vt-drift {
    0%  { transform:translate3d(0,0,0) }
    100%{ transform:translate3d(-12px,-8px,0) }
  }

  /* Progress rail */
  .vt-rail { position:absolute; top:0; left:0; right:0; height:3px; z-index:60 }
  .vt-rail__fill {
    height:100%;
    background: linear-gradient(90deg, var(--s-pink), var(--s-purple), var(--s-blue));
    box-shadow: 0 0 16px var(--s-pink);
    transition: width .08s linear;
  }

  /* Badge — top left */
  .vt-badge {
    position:absolute; top:14px; left:32px; z-index:50;
    display:inline-flex; align-items:center; gap:10px;
    padding:9px 16px; border-radius:999px;
    background: oklch(0.99 0.01 310 / 0.75);
    border:1px solid var(--s-gb);
    backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
    font-family:var(--s-serif); font-size:14px; letter-spacing:.08em;
    text-transform:uppercase; color:var(--s-ink2);
    box-shadow: 0 4px 20px oklch(0.60 0.24 338 / 0.15);
  }
  .vt-dot {
    width:8px; height:8px; border-radius:50%;
    background: var(--s-pink);
    box-shadow: 0 0 10px var(--s-pink);
    animation: vt-pulse 2.6s ease-in-out infinite;
  }
  @keyframes vt-pulse{ 0%,100%{opacity:.5} 50%{opacity:1} }

  /* Timestamp — top right */
  .vt-ts {
    position:absolute; top:14px; right:32px; z-index:50;
    padding:9px 16px; border-radius:999px;
    background: oklch(0.99 0.01 310 / 0.65);
    border:1px solid var(--s-gb);
    backdrop-filter:blur(12px);
    font-family:var(--s-serif); font-size:14px; letter-spacing:.08em;
    text-transform:uppercase; color:var(--s-ink2);
  }

  /* Scroll hint — bottom center */
  .vt-hint {
    position:absolute; bottom:22px; left:50%; transform:translateX(-50%);
    z-index:50; font-family:var(--s-mono); font-size:10px;
    letter-spacing:.3em; text-transform:uppercase; color:var(--s-ink3);
    transition:opacity .3s ease; white-space:nowrap; pointer-events:none;
  }
  .vt-hint::after{ content:" ↓"; display:inline-block; animation:vt-bob 2s ease-in-out infinite }
  @keyframes vt-bob{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(4px)} }

  /* Counter — bottom right */
  .vt-counter {
    position:absolute; bottom:22px; right:32px; z-index:50;
    font-family:var(--s-mono); font-size:10px; letter-spacing:.3em; color:var(--s-ink3);
  }
  .vt-counter b{ color:var(--s-pink); font-weight:500 }

  /* Scenes */
  .vt-scene {
    position:absolute; inset:0; z-index:10;
    display:flex; align-items:center; justify-content:center;
    padding:88px 48px 70px;
    opacity:0; transition:opacity .7s ease; pointer-events:none;
  }
  .vt-scene.is-active{ opacity:1; pointer-events:auto }
  .vt-frame{ position:relative; width:min(1280px,92vw) }

  /* Typography */
  .vt-kicker{
    font-family:var(--s-serif); font-size:14px;
    letter-spacing:.12em; text-transform:uppercase;
    color:var(--s-pink); margin-bottom:22px;
  }
  .vt-lede{
    font-family:var(--s-serif); font-weight:400;
    font-size:clamp(22px,2.6vw,44px); line-height:1.02;
    letter-spacing:-0.015em; color:var(--s-ink); text-wrap:balance;
  }
  .vt-lede em{ font-style:italic; color:var(--s-purple); font-weight:400 }
  .vt-body{
    font-family:var(--s-serif); font-weight:300;
    font-size:clamp(17px,1.3vw,20px); line-height:1.5;
    color:var(--s-ink2); max-width:46ch; margin-top:24px;
  }
  .vt-title{
    font-family:var(--s-serif); font-weight:500;
    font-size:clamp(34px,4vw,64px); line-height:.94;
    letter-spacing:-0.02em; color:var(--s-ink);
  }
  .vt-title em{ display:block; font-style:italic; font-weight:400; color:var(--s-pink) }

  /* Photo card */
  .vt-card{
    position:relative; border-radius:14px;
    background:var(--s-glass); border:1px solid var(--s-gb);
    backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
    padding:14px 14px 0;
    box-shadow:
      0 30px 80px -30px oklch(0.60 0.24 338 / 0.20),
      inset 0 1px 0 oklch(0.99 0.01 310 / 0.60);
  }
  .vt-card img{
    display:block; width:100%; border-radius:10px; object-fit:cover;
    max-height:50vh;
  }
  .vt-caption{
    font-family:var(--s-serif); font-size:14px;
    letter-spacing:.1em; text-transform:uppercase;
    color:var(--s-ink2); text-align:center;
    padding:14px 8px 12px;
  }
  .vt-caption b{ color:var(--s-pink); font-weight:500 }

  /* Buttons */
  .vt-ctas{ display:flex; gap:16px; margin-top:30px; padding-top:8px; flex-wrap:nowrap; align-items:center; overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none }
  .vt-ctas::-webkit-scrollbar{ display:none }
  .vt-btn{
    display:inline-flex; align-items:center; gap:10px; flex-shrink:0;
    padding:15px 32px; border-radius:999px;
    font-family:var(--s-serif); font-size:16px;
    letter-spacing:.06em; text-transform:uppercase; font-weight:500;
    cursor:pointer; text-decoration:none;
    transition:transform .22s cubic-bezier(.2,.7,.2,1), box-shadow .22s ease, background .2s ease;
    border:1px solid transparent;
  }
  .vt-btn--primary{
    background: linear-gradient(145deg, var(--s-pink) 0%, var(--s-purple) 100%);
    color: white;
    box-shadow: inset 0 1px 0 oklch(0.99 0.01 310 / 0.25);
  }
  .vt-btn--primary:hover{ transform:translateY(-3px) }
  .vt-btn--ghost{
    background: oklch(0.88 0.10 320 / 0.75);
    border-color: var(--s-pink);
    color: var(--s-purple);
    backdrop-filter:blur(8px);
  }
  .vt-btn--ghost:hover{ background:oklch(0.83 0.14 320 / 0.90); transform:translateY(-2px) }

  /* ── Scene layouts ── */
  .vt-g01{ display:grid; grid-template-columns:1.05fr 1fr; gap:64px; align-items:center }
  .vt-g02{ display:grid; grid-template-columns:1.1fr  1fr; gap:80px; align-items:center }
  .vt-g03{ display:grid; grid-template-columns:1fr 1.1fr; gap:80px; align-items:center }
  .vt-g04{ display:grid; grid-template-columns:1fr 1.1fr; gap:80px; align-items:center }
  .vt-g05{ display:grid; grid-template-columns:1.1fr  1fr; gap:80px; align-items:center }
  .vt-g06{ display:grid; grid-template-columns:1fr 1.1fr; gap:80px; align-items:center }
  .vt-g07{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:28px }
  .vt-g08{ display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center }

  /* Scene 07 — big statistic */
  .vt-big{
    font-family:var(--s-serif); font-weight:400;
    font-size:clamp(60px,9vw,130px); line-height:.9;
    letter-spacing:-0.04em; color:var(--s-ink);
  }
  .vt-big .pct{ color:var(--s-pink); font-style:italic; font-weight:500 }
  .vt-caption-big{
    font-family:var(--s-serif); font-style:italic; font-weight:300;
    font-size:clamp(16px,1.6vw,22px); color:var(--s-ink2);
    max-width:30ch; line-height:1.2;
  }
  .vt-source{
    font-family:var(--s-mono); font-size:10px;
    letter-spacing:.26em; text-transform:uppercase; color:var(--s-ink3); margin-top:12px;
  }

  /* Clock */
  .vt-clock-wrap{
    position:relative; display:flex; justify-content:center; align-items:center;
    aspect-ratio:1; max-width:380px; margin:0 auto;
  }
  .vt-clock-glow{
    position:absolute; inset:-10%;
    background:radial-gradient(circle, var(--s-pink) 0%, transparent 60%);
    opacity:.12; filter:blur(20px);
  }
  .vt-clock{
    width:320px; height:320px; border-radius:50%;
    border:2px solid var(--s-pink); background:oklch(0.97 0.03 320 / 0.70);
    backdrop-filter:blur(14px); position:relative;
    box-shadow:0 0 0 6px oklch(0.65 0.24 350 / 0.08);
  }
  .vt-clock::after{
    content:""; position:absolute; inset:50%; width:10px; height:10px;
    border-radius:50%; background:var(--s-purple);
    transform:translate(-50%,-50%); box-shadow:0 0 12px var(--s-purple);
  }
  .vt-tick{ position:absolute; left:50%; top:14px; width:1px; height:10px; background:var(--s-purple); transform-origin:50% 146px; opacity:.5 }
  .vt-tick--major{ height:14px; opacity:1; width:2px; background:var(--s-pink) }
  .vt-hand{ position:absolute; left:50%; bottom:50%; transform-origin:bottom center; border-radius:2px }
  .vt-hand--h{ width:4px;  height:80px;  background:var(--s-purple); transform:translateX(-50%) rotate(120deg); box-shadow:0 0 6px var(--s-purple) }
  .vt-hand--m{ width:2px;  height:120px; background:var(--s-pink); transform:translateX(-50%) rotate(360deg); box-shadow:0 0 4px var(--s-pink) }
  .vt-hand--s{ width:1px;  height:130px; background:var(--s-blue); transform:translateX(-50%) rotate(0deg);
                box-shadow:0 0 6px var(--s-blue); animation:vt-sweep 60s linear infinite }
  @keyframes vt-sweep{ to{ transform:translateX(-50%) rotate(360deg) } }

  /* Phone */
  .vt-phone-wrap{ display:flex; justify-content:center }
  .vt-phone{
    width:250px; aspect-ratio:9/19; border-radius:32px;
    border:2px solid var(--s-pink); background:linear-gradient(160deg, oklch(0.94 0.06 320), oklch(0.90 0.08 290)); position:relative;
    box-shadow:
      0 40px 80px -30px oklch(0.60 0.24 338 / 0.30),
      0 0 0 6px oklch(0.65 0.24 350 / 0.08),
      inset 0 1px 0 oklch(0.99 0.01 310 / 0.70);
  }
  .vt-screen{
    position:absolute; inset:10px; border-radius:24px;
    background:linear-gradient(180deg, oklch(0.97 0.04 330), oklch(0.92 0.06 300));
    display:flex; flex-direction:column; align-items:center;
    padding:32px 18px 18px; text-align:center; overflow:hidden;
  }
  .vt-notch{ position:absolute; top:8px; left:50%; transform:translateX(-50%); width:80px; height:6px; border-radius:3px; background:var(--s-pink) }
  .vt-ptime{ font-family:var(--s-serif); font-weight:300; font-size:56px; line-height:1; color:var(--s-ink); margin-top:20px }
  .vt-pdate{ font-family:var(--s-mono); font-size:9px; letter-spacing:.22em; text-transform:uppercase; color:var(--s-ink3); margin-top:10px }
  .vt-pnotes{ margin-top:auto; width:100% }
  .vt-prow{ display:flex; justify-content:space-between; align-items:center; font-family:var(--s-mono); font-size:9px; letter-spacing:.06em; color:var(--s-ink3); padding:10px 0; border-top:1px solid oklch(0.82 0.07 310 / 0.20) }
  .vt-prow span:last-child{ color:var(--s-ink2) }
  .vt-pgood{ color:var(--s-pink) !important; font-weight:600 }

  /* Lift entrance per scene */
  .vt-scene .lift{ transform:translateY(20px); opacity:0; transition:transform 1s cubic-bezier(.2,.7,.2,1),opacity 1s ease }
  .vt-scene.is-active .lift{ transform:translateY(0); opacity:1 }
  .vt-scene.is-active .lift:nth-child(1){ transition-delay:.05s }
  .vt-scene.is-active .lift:nth-child(2){ transition-delay:.15s }
  .vt-scene.is-active .lift:nth-child(3){ transition-delay:.25s }
  .vt-scene.is-active .lift:nth-child(4){ transition-delay:.35s }
  .vt-scene.is-active .lift:nth-child(5){ transition-delay:.45s }

  /* ── Responsive ── */
  @media(max-width:900px){
    .vt-scene{ padding:80px 20px 64px }
    .vt-g01,.vt-g02,.vt-g03,.vt-g04,.vt-g05,.vt-g06,.vt-g08{
      grid-template-columns:1fr; gap:28px;
    }
    .vt-lede  { font-size:20px }
    .vt-title { font-size:34px }
    .vt-big   { font-size:70px }
    .vt-badge { font-size:11px; padding:6px 10px; left:14px; top:12px }
    .vt-ts    { font-size:11px; padding:6px 10px; right:14px; top:12px }
    .vt-clock { width:220px; height:220px }
    .vt-tick  { transform-origin:50% 96px }
    .vt-hand--h{ height:54px } .vt-hand--m{ height:82px } .vt-hand--s{ height:90px }
  }
  @media(max-width:480px){
    .vt-scene{ padding:64px 12px 52px }
    .vt-lede  { font-size:17px }
    .vt-title { font-size:26px }
    .vt-big   { font-size:52px }
    .vt-caption-big{ font-size:14px }
    .vt-badge,.vt-ts{ display:none }
    .vt-clock { width:170px; height:170px }
    .vt-tick  { transform-origin:50% 71px }
    .vt-hand--h{ height:40px } .vt-hand--m{ height:62px } .vt-hand--s{ height:70px }
    .vt-phone { width:150px }
    .vt-body  { font-size:14px; margin-top:12px }
    .vt-btn   { padding:10px 16px; font-size:10px }
    .vt-ctas  { gap:8px; margin-top:20px }
    .vt-kicker{ margin-bottom:10px }
  }
`;

function VitaHeroSection({ user }: { user: { rol?: string } | null }) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const clockRef        = useRef<HTMLDivElement>(null);
  const isReturnVisit   = useRef(false);
  const [sceneIdx, setSceneIdx]           = useState(0);
  const [progress, setProgress]           = useState(0);
  const [heroCompleted, setHeroCompleted] = useState(false);
  const [returnVisit, setReturnVisit]     = useState(false);

  useLayoutEffect(() => {
    if (sessionStorage.getItem("r65_hero_seen")) {
      isReturnVisit.current = true;
      setReturnVisit(true);
      setHeroCompleted(true);
      setSceneIdx(7);
      setProgress(1);
    } else {
      sessionStorage.setItem("r65_hero_seen", "1");
    }
  }, []);

  useEffect(() => {
    if (clockRef.current && !clockRef.current.dataset.built) {
      clockRef.current.dataset.built = "1";
      for (let i = 0; i < 12; i++) {
        const t = document.createElement("div");
        t.className = "vt-tick" + (i % 3 === 0 ? " vt-tick--major" : "");
        t.style.transform = `rotate(${i * 30}deg)`;
        clockRef.current.appendChild(t);
      }
    }
  }, []);

  useEffect(() => {
    if (isReturnVisit.current) return;
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect      = el.getBoundingClientRect();
      const scrolled  = Math.max(0, -rect.top);
      const scrollable = rect.height - window.innerHeight;
      const p = scrollable > 0 ? Math.min(1, scrolled / scrollable) : 0;
      const newScene = Math.min(7, Math.floor(p * 8));
      setProgress(p);
      setSceneIdx(newScene);
      if (newScene === 7) setHeroCompleted(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    if (heroCompleted) {
      document.body.classList.remove("vt-hero-active");
    } else {
      document.body.classList.add("vt-hero-active");
    }
    return () => document.body.classList.remove("vt-hero-active");
  }, [heroCompleted]);

  const active = (i: number) => sceneIdx === i;

  return (
    <>
      <style>{VITA_HERO_STYLES}</style>

      <div ref={containerRef} className="vt-wrap" style={{ height: returnVisit ? "auto" : "800vh", position: "relative" }}>

        <div className="vt-stage" style={returnVisit ? { position: "relative" } : undefined}>

          {/* Rail de progreso */}
          <div className="vt-rail">
            <div className="vt-rail__fill" style={{ width: `${progress * 100}%` }} />
          </div>

          {/* Badge */}
          <div className="vt-badge">
            <span className="vt-dot" />
            <span>VIVE+ · Conexión real ·</span>
          </div>

          {/* Timestamp */}
          <div className="vt-ts">{VITA_STAMPS[sceneIdx]}</div>

          {/* Escena 01 — Hero principal */}
          <section className={`vt-scene ${active(0) ? "is-active" : ""}`}>
            <div className="vt-frame vt-g01">
              <div>
                <div className="vt-kicker lift">Tu comunidad te espera · 8 momentos</div>
                <h1 className="vt-title lift">
                  Tu vida,<br />más vibrante<em>que nunca.</em>
                </h1>
                <p className="vt-body lift">
                  Descubre cómo VIVE+ conecta personas mayores con actividades, amigos y la tecnología que les hace la vida más fácil: tablets, asistentes de voz, relojes y sensores pensados para vivir mejor.
                </p>
                <div className="vt-ctas lift">
                  {user?.rol === "admin" ? (
                    <span className="vt-btn vt-btn--primary" style={{ opacity: 0.6, cursor: "not-allowed" }}>
                      Solo para usuarios
                    </span>
                  ) : (
                    <Link href="/contacto" className="vt-btn vt-btn--primary">Empieza ahora</Link>
                  )}
                  <Link href="/marketplace" className="vt-btn vt-btn--ghost">Ver tecnología</Link>
                </div>
              </div>
              <div className="vt-card lift">
                <Image src={VITA_IMGS.portrait} alt="Personas mayores sonriendo y disfrutando juntas" width={800} height={600} style={{ aspectRatio: "4/3", width: "100%", height: "auto" }} />
                <p className="vt-caption">Descubre cómo la <b>conexión</b> transforma tu día</p>
              </div>
            </div>
          </section>

          {/* Escena 02 — Mañana con energía */}
          <section className={`vt-scene ${active(1) ? "is-active" : ""}`}>
            <div className="vt-frame vt-g02">
              <div className="vt-card lift">
                <Image src={VITA_IMGS.morning} alt="Personas mayores activas por la mañana" width={400} height={500} style={{ aspectRatio: "4/5", width: "100%", height: "auto" }} />
                <p className="vt-caption">Buenos días · con energía y compañía</p>
              </div>
              <div>
                <div className="vt-kicker lift">Escena 02 · 07:30</div>
                <p className="vt-lede lift">Las mañanas tienen sabor cuando las compartes. Con <em>energía</em> y propósito.</p>
                <p className="vt-body lift">El café sabe mejor cuando hay alguien al otro lado. Su altavoz inteligente le recuerda la cita, y Rosa llama todos los martes para salir a caminar.</p>
                <div className="vt-ctas lift">
                  <Link href="/segunda-mano" className="vt-btn vt-btn--ghost">Ver segunda mano</Link>
                </div>
              </div>
            </div>
          </section>

          {/* Escena 03 — Reloj: el tiempo vuela */}
          <section className={`vt-scene ${active(2) ? "is-active" : ""}`}>
            <div className="vt-frame vt-g03">
              <div className="vt-clock-wrap lift">
                <div className="vt-clock-glow" />
                <div className="vt-clock" ref={clockRef}>
                  <div className="vt-hand vt-hand--h" />
                  <div className="vt-hand vt-hand--m" />
                  <div className="vt-hand vt-hand--s" />
                </div>
              </div>
              <div>
                <div className="vt-kicker lift">Escena 03 · 09:15</div>
                <p className="vt-lede lift">El tiempo <em>vuela</em> cuando tienes planes y personas con quienes compartirlos.</p>
                <p className="vt-body lift">Hoy: senderismo con el grupo, taller de tecnología, y la llamada de tu nieta. Su reloj inteligente avisa cuándo toca cada cosa — la agenda está llena.</p>
                <div className="vt-ctas lift">
                  <Link href="/marketplace" className="vt-btn vt-btn--ghost">Ver marketplace</Link>
                </div>
              </div>
            </div>
          </section>

          {/* Escena 04 — Teléfono: conectado */}
          <section className={`vt-scene ${active(3) ? "is-active" : ""}`}>
            <div className="vt-frame vt-g04">
              <div className="vt-phone-wrap lift">
                <div className="vt-phone">
                  <div className="vt-screen">
                    <div className="vt-notch" />
                    <div className="vt-ptime">11:08</div>
                    <div className="vt-pdate">martes · 14 abril</div>
                    <div className="vt-pnotes">
                      <div className="vt-prow"><span>Llamadas</span><span className="vt-pgood">3 hoy</span></div>
                      <div className="vt-prow"><span>Mensajes</span><span className="vt-pgood">5 nuevos</span></div>
                      <div className="vt-prow"><span>Hoy</span><span>senderismo, 10:00</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="vt-kicker lift">Escena 04 · 11:08</div>
                <p className="vt-lede lift">El teléfono suena. <em>Tres veces.</em> Son tus amigos de VIVE+.</p>
                <p className="vt-body lift">Luis, Carmen, el grupo de senderismo. Con la tablet y el asistente de voz, todo está a un toque — no esperas nada, lo tienes todo.</p>
                <div className="vt-ctas lift">
                  <Link href="/marketplace" className="vt-btn vt-btn--ghost">Ver tecnología</Link>
                </div>
              </div>
            </div>
          </section>

          {/* Escena 05 — Mesa para cuatro */}
          <section className={`vt-scene ${active(4) ? "is-active" : ""}`}>
            <div className="vt-frame vt-g05">
              <div>
                <div className="vt-kicker lift">Escena 05 · 14:20</div>
                <p className="vt-lede lift">Pone <em>cuatro</em> platos.<br />Pone <em>cuatro</em> vasos.</p>
                <p className="vt-body lift">Hoy comen juntos. La mesa llena es la versión mejor del día. El robot de cocina ayuda con la comida y los planes ya están hechos para el sábado.</p>
                <div className="vt-ctas lift">
                  <Link href="/segunda-mano" className="vt-btn vt-btn--ghost">Ver segunda mano</Link>
                </div>
              </div>
              <div className="vt-card lift">
                <Image src={VITA_IMGS.table} alt="Mesa compartida con amigos y risas" width={500} height={400} style={{ aspectRatio: "5/4", width: "100%", height: "auto" }} />
                <p className="vt-caption">Mesa para cuatro · <b>nueva familia</b></p>
              </div>
            </div>
          </section>

          {/* Escena 06 — Tarde llena de vida */}
          <section className={`vt-scene ${active(5) ? "is-active" : ""}`}>
            <div className="vt-frame vt-g06">
              <div className="vt-card lift">
                <Image src={VITA_IMGS.window} alt="Personas mayores disfrutando activamente al aire libre" width={300} height={400} style={{ aspectRatio: "3/4", width: "100%", height: "auto" }} />
                <p className="vt-caption">17:55 · tarde llena de <b>vida</b></p>
              </div>
              <div>
                <div className="vt-kicker lift">Escena 06 · 17:55</div>
                <p className="vt-lede lift">Cuenta las risas.<br />Cuenta los planes.<br /><em>Cuenta los momentos.</em></p>
                <p className="vt-body lift">Las tardes son cortas cuando tienes con quién compartirlas, un sensor de caídas que cuida sin agobiar, y planes que te esperan.</p>
                <div className="vt-ctas lift">
                  <Link href="/marketplace" className="vt-btn vt-btn--ghost">Ver marketplace</Link>
                </div>
              </div>
            </div>
          </section>

          {/* Escena 07 — Estadística de impacto */}
          <section className={`vt-scene ${active(6) ? "is-active" : ""}`}>
            <div className="vt-frame vt-g07">
              <div className="vt-kicker lift">El impacto es real</div>
              <div className="vt-big lift">9<span className="pct"> de cada 10</span></div>
              <p className="vt-caption-big lift">
                usuarios de VIVE+ sienten que su vida social mejoró significativamente en el primer mes, gracias a la comunidad y a la tecnología que les acompaña cada día.
              </p>
              <div className="vt-source lift">Estudio de impacto · VIVE+ · Relatia55</div>
              <div className="vt-ctas lift">
                <Link href="/marketplace" className="vt-btn vt-btn--ghost">Ver tecnología</Link>
              </div>
            </div>
          </section>

          {/* Escena 08 — CTA final */}
          <section className={`vt-scene ${active(7) ? "is-active" : ""}`}>
            <div className="vt-frame vt-g08">
              <div className="vt-card lift">
                <Image src={VITA_IMGS.call} alt="Familia sonriendo y conectada gracias a VIVE+" width={800} height={600} loading="eager" style={{ aspectRatio: "4/3", width: "100%", height: "auto" }} />
                <p className="vt-caption">Una <b>conexión</b> · una vida más plena</p>
              </div>
              <div>
                <div className="vt-kicker lift">La diferencia real</div>
                <p className="vt-lede lift">La vida que mereces<br />cabe en la <em>tecnología</em></p>
                <p className="vt-body lift">Empieza hoy con VIVE+. Tu comunidad, tus planes, tu energía. Todo en un solo lugar.</p>
                <div className="vt-ctas lift">
                  {user?.rol === "admin" ? (
                    <span className="vt-btn vt-btn--primary" style={{ opacity: 0.6, cursor: "not-allowed" }}>
                      Solo para usuarios
                    </span>
                  ) : (
                    <Link href="/sobre-nosotros" className="vt-btn vt-btn--primary">Sobre nosotros</Link>
                  )}
                  <Link href="/segunda-mano" className="vt-btn vt-btn--ghost">Ver segunda mano</Link>
                </div>
              </div>
            </div>
          </section>

          {/* Contador / hint */}
          <div className="vt-counter">
            <b>{String(sceneIdx + 1).padStart(2, "0")}</b> / 08
          </div>
          <div className="vt-hint" style={{ opacity: progress > 0.02 ? 0 : 1 }}>
            Desliza hacia abajo
          </div>

        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR SECTION — Antonio, 71 años (sin modelo 3D)
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_STEPS = [
  {
    label: "Antes",
    title: "Solo y desconectado",
    desc: "71 años. La casa grande. El teléfono que no sonaba. Los martes iguales a los domingos.",
    img: "https://images.unsplash.com/photo-1508028922235-7b9a1b690358?q=80&w=900&auto=format&fit=crop",
    alt: "Señor mayor sentado solo en un banco",
    pos: "center 65%",
  },
  {
    label: "El encuentro",
    title: "Descubrió VIVE+",
    desc: "Su nieta le instaló la app. No lo entendió todo al principio. Pero respondió. Y alguien le contestó.",
    img: "https://images.unsplash.com/photo-1758691030790-efe4c90a1ca6?q=80&w=900&auto=format&fit=crop",
    alt: "Señor mayor descubriendo la tecnología, sorprendido",
    pos: "center 30%",
  },
  {
    label: "Comunidad",
    title: "Nuevas amistades",
    desc: "Rosa, Luis, el grupo de senderismo. Actividades cada martes. El teléfono empezó a sonar.",
    img: "https://images.unsplash.com/photo-1761634372910-016de07c85a8?q=80&w=900&auto=format&fit=crop",
    alt: "Grupo de personas mayores felices juntas",
    pos: "center 40%",
  },
  {
    label: "Hoy",
    title: "Activo y feliz",
    desc: "No cambió su edad. Cambió su vida. Tiene planes, tiene comunidad. Tiene VIVE+.",
    img: "https://images.unsplash.com/photo-1758686253859-8ef7e940096e?q=80&w=900&auto=format&fit=crop",
    alt: "Señor mayor sonriendo feliz",
    pos: "center 20%",
  },
];








function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add("sn-in"); obs.unobserve(el); }
    }, { threshold: 0.14, rootMargin: "0px 0px -60px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}
function Reveal({ children, delay = 0, className = "", variant = "up" }: {
  children: React.ReactNode; delay?: number; className?: string; variant?: "up" | "left" | "right" | "scale";
}) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`sn-reveal sn-reveal--${variant} ${className}`}
      style={{ transitionDelay: delay ? `${delay}s` : undefined }}>
      {children}
    </div>
  );
}

function AvatarSection() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setStep(s => (s + 1) % AVATAR_STEPS.length), 6000);
    return () => clearInterval(t);
  }, [paused]);

  const sc = AVATAR_STEPS[step];

  return (
    <section style={{ background: "linear-gradient(135deg, #FFF0F8 0%, #F5F0FF 50%, #EFF6FF 100%)", padding: "80px 40px", position: "relative", overflow: "hidden" }}>
      <style>{`
        .av-wrap { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:72px; align-items:center; }
        .av-img-wrap { position:relative; height:520px; border-radius:28px; overflow:hidden; box-shadow:0 32px 80px rgba(42,58,32,0.18); }
        .av-img-wrap img { object-fit:cover; object-position:top center; }
        .av-img-grad { position:absolute; inset:0; background:linear-gradient(to top, rgba(245,239,224,0.6) 0%, transparent 40%); }
        .av-img-wrap { height:500px; overflow:hidden; border-radius:24px; position:relative; }
        .av-right { display:flex; flex-direction:column; gap:32px; }
        .av-eyebrow { display:inline-flex; align-items:center; gap:12px; }
        .av-line { display:block; width:40px; height:2px; background:#C9923A; border-radius:1px; }
        .av-eyetext { font-family:'DM Sans',sans-serif; font-size:.72rem; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:#C9923A; }
        .av-headline { font-family:'Fraunces',serif; font-size:clamp(2rem,3.5vw,3.4rem); font-weight:500; color:#0F172A; line-height:1.05; letter-spacing:-.02em; margin:0; }
        .av-body { font-family:'DM Sans',sans-serif; font-size:clamp(15px,1.1vw,17px); color:#334155; line-height:1.78; max-width:38ch; margin:0; }
        .av-steps { display:flex; gap:0; }
        .av-step { flex:1; padding:14px 16px; border-top:2px solid rgba(15,23,42,.12); cursor:pointer; transition:border-color .3s; }
        .av-step.av-active { border-top-color:#EC4899; }
        .av-step-label { font-family:'DM Sans',sans-serif; font-size:.62rem; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:rgba(15,23,42,.35); margin-bottom:4px; transition:color .3s; }
        .av-step.av-active .av-step-label { color:#EC4899; }
        .av-step-title { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:rgba(15,23,42,.45); transition:color .3s; }
        .av-step.av-active .av-step-title { color:#0F172A; }
        @keyframes avFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
        @keyframes avGrad {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes avGlow {
          0%,100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.2); }
        }
        @keyframes avGlow2 {
          0%,100% { opacity: 0.6; transform: scale(1.1); }
          50%      { opacity: 0.3; transform: scale(0.9); }
        }
        .av-section-bg {
          position: absolute; inset: 0; z-index: 0;
          background: linear-gradient(135deg, #FFF0F8 0%, #F5F0FF 50%, #EFF6FF 100%);
          background-size: 300% 300%;
          animation: avGrad 12s ease-in-out infinite;
        }
        .av-glow-1 {
          position: absolute; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.10) 0%, transparent 65%);
          top: -120px; left: -100px;
          animation: avGlow 8s ease-in-out infinite;
          pointer-events: none;
        }
        .av-glow-2 {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(147,51,234,0.08) 0%, transparent 65%);
          bottom: -100px; right: -80px;
          animation: avGlow2 10s ease-in-out infinite;
          pointer-events: none;
        }
        .av-glow-3 {
          position: absolute; width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(29,78,216,0.07) 0%, transparent 70%);
          top: 40%; right: 35%;
          animation: avGlow 14s ease-in-out infinite 3s;
          pointer-events: none;
        }
        @media(max-width:768px){
          .av-wrap { grid-template-columns:1fr; gap:40px; }
          .av-img-wrap { height:320px; }
          .av-img-wrap { height:280px; }
          .av-steps { flex-wrap:wrap; }
          .av-step { flex:1 0 45%; }
        }
        @media(max-width:480px){ .av-steps { flex-direction:column; } }
      `}</style>
      <div className="av-section-bg" />
      <div className="av-glow-1" />
      <div className="av-glow-2" />
      <div className="av-glow-3" />
      <div className="av-wrap" style={{ position: "relative", zIndex: 1 }}>

        {/* Foto — cambia con cada paso */}
        <Reveal variant="left">
        <div className="av-img-wrap">
          {AVATAR_STEPS.map((s, i) => (
            <Image
              key={s.label}
              src={s.img}
              alt={s.alt}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              priority={i === 0}
              style={{
                objectFit: "cover",
                objectPosition: s.pos,
                opacity: i === step ? 1 : 0,
                transition: "opacity 0.8s ease",
              }}
            />
          ))}
          <div className="av-img-grad" />
        </div>
        </Reveal>

        <Reveal variant="right" delay={0.15}>
        <div className="av-right">
          <div className="av-eyebrow">
            <span className="av-line" />
            <span className="av-eyetext">Su historia con VIVE+</span>
          </div>
          <h2 className="av-headline" key={step} style={{ animation: "avFadeUp .45s cubic-bezier(.2,.7,.2,1) both" }}>
            {sc.title}
          </h2>
          <p className="av-body" key={`b${step}`} style={{ animation: "avFadeUp .55s .08s cubic-bezier(.2,.7,.2,1) both" }}>
            {sc.desc}
          </p>
          <div className="av-steps" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            {AVATAR_STEPS.map((s, i) => (
              <div
                key={s.label}
                className={`av-step${i === step ? " av-active" : ""}`}
                onClick={() => setStep(i)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setStep(i); } }}
                role="button"
                tabIndex={0}
              >
                <div className="av-step-label">{s.label}</div>
                <div className="av-step-title">{s.title}</div>
              </div>
            ))}
          </div>
        </div>
        </Reveal>

      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (glowRef.current) Object.assign(glowRef.current.style, { left: e.clientX + "px", top: e.clientY + "px" });
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={glowRef} className="mouse-glow" />;
}

function Feature3DCard({ f, i }: { f: (typeof FEATURES)[0]; i: number }) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = e.clientX - left, y = e.clientY - top;
    const rx = ((y - height / 2) / (height / 2)) * -9;
    const ry = ((x - width  / 2) / (width  / 2)) * 12;
    Object.assign(el.style, {
      transform: `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.04,1.04,1.04)`,
      boxShadow: `${-ry * 1.2}px ${rx * 1.2}px 40px rgba(150,60,200,0.12), 0 20px 50px rgba(0,0,0,0.08)`,
    });
    if (shineRef.current) Object.assign(shineRef.current.style, { opacity: "1", background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.22) 0%, transparent 62%)` });
    const img  = el.querySelector(".feature-img")  as HTMLElement | null;
    if (img)  img.style.transform  = "scale(1.08)";
    const icon = el.querySelector(".feature-icon") as HTMLElement | null;
    if (icon) icon.style.transform = "scale(1.3) rotate(10deg)";
  };

  const onLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    Object.assign(el.style, { transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" });
    if (shineRef.current) shineRef.current.style.opacity = "0";
    const img  = el.querySelector(".feature-img")  as HTMLElement | null;
    if (img)  img.style.transform  = "none";
    const icon = el.querySelector(".feature-icon") as HTMLElement | null;
    if (icon) icon.style.transform = "none";
  };

  return (
    <Reveal delay={i * 0.1}>
      <Link href={f.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
        <div
          ref={cardRef} onMouseMove={onMove} onMouseLeave={onLeave}
          className="feature-card"
        >
          <div
            ref={shineRef}
            style={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none", zIndex: 5, borderRadius: 22, transition: "opacity 0.3s" }}
          />
          <div className="feature-img-wrap">
            <Image fill sizes="(max-width: 480px) calc(100vw - 24px), (max-width: 768px) calc(100vw - 32px), 320px" src={f.img} alt={f.title} className="feature-img" style={{ objectFit: "cover", borderRadius: "22px 22px 0 0", transition: "transform 0.15s ease" }} />
            <div className="feature-icon-badge">
              <span className="feature-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#EC4899", transition: "transform 0.3s ease" }}>{f.icon}</span>
            </div>
          </div>
          <div style={{ padding: "24px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: 20, marginBottom: 10, color: "#0F172A", fontFamily: "'Fraunces', serif", fontWeight: 600, letterSpacing: "-0.01em" }}>{f.title}</h3>
            <p  style={{ fontSize: 16, color: "#334155", lineHeight: 1.75, flex: 1, fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</p>
            <div className="feature-cta-row">
              <span>Ver más</span>
            </div>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [user, setUser] = useState<{ rol?: string } | null>(null);

  useEffect(() => {
    const checkUser = () => {
      const u = sessionStorage.getItem("r65_user:v1");
      if (u) { try { setUser(JSON.parse(u)); } catch {} } else { setUser(null); }
    };
    checkUser();
    window.addEventListener("relatia-auth-changed", checkUser);
    window.addEventListener("r65:authed", checkUser);
    return () => {
      window.removeEventListener("relatia-auth-changed", checkUser);
      window.removeEventListener("r65:authed", checkUser);
    };
  }, []);

  // Sin saltos automáticos entre secciones: el scroll es el del navegador.
  // El código anterior cancelaba la rueda y también las flechas, avanzar
  // página y la barra espaciadora.

  return (
    <div className="page-enter">
      <style>{`
        .sn-reveal { opacity:0; transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1); }
        .sn-reveal--up    { transform:translateY(40px); }
        .sn-reveal--left  { transform:translateX(-50px); }
        .sn-reveal--right { transform:translateX(50px); }
        .sn-reveal--scale { transform:scale(0.94); }
        .sn-reveal.sn-in  { opacity:1; transform:none; }
        @media (max-width: 767px) {
          .sn-reveal, .sn-reveal.sn-in { opacity:1; transform:none; transition:none; }
        }
        .feature-img  { transition: transform 0.6s cubic-bezier(0.22,1,0.36,1); }
        .shimmer-line { position: relative; overflow: hidden; }
        .shimmer-line::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%); animation: shimmer 3s infinite; }
        @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
        .cta-pink-btn { position: relative; overflow: hidden; }
        .cta-pink-btn::before { content: ''; position: absolute; inset: -2px; border-radius: 99px; background: linear-gradient(135deg, #EC4899, #9333EA, #1D4ED8); background-size: 200%; animation: borderPulse 2.5s linear infinite; z-index: -1; }
        @keyframes borderPulse { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .wave-divider svg { display: block; }
        .home-banner-wrap    { padding: 20px 40px 0; }
        .home-features-section { padding: 80px 40px 100px; }
        .home-cta-section    { padding: 80px 40px; }
        .features-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,320px)); gap:28px; justify-content:center; }
        .mouse-glow { position: fixed; pointer-events: none; z-index: 0; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%); transform: translate(-50%,-50%); transition: left 0.12s ease, top 0.12s ease; }
        .feature-card { background: white; border-radius: 20px; border: 1px solid rgba(120,60,200,0.10); height: 100%; display: flex; flex-direction: column; box-shadow: 0 8px 30px -12px rgba(120,60,200,0.10); transition: transform 0.5s cubic-bezier(.2,.7,.2,1), box-shadow 0.5s ease; position: relative; cursor: pointer; }
        .feature-img-wrap { width: 100%; aspect-ratio: 16/9; overflow: hidden; flex-shrink: 0; position: relative; border-radius: 22px 22px 0 0; transform: translateZ(0); -webkit-mask-image: -webkit-radial-gradient(white, black); }
        .feature-icon-badge { position: absolute; top: 14px; right: 14px; background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); border-radius: 12px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; }
        .feature-cta-row { margin-top: 18px; display: inline-flex; align-items: center; gap: 6px; color: #9333EA; font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif; letter-spacing: 0.06em; text-transform: uppercase; }
        .cot-home-card { max-width: 900px; margin: 0 auto; background: white; border-radius: 28px; padding: 56px 64px; box-shadow: 0 8px 40px rgba(147,51,234,0.08); border: 1px solid rgba(147,51,234,0.1); display: grid; grid-template-columns: 1fr auto; gap: 48px; align-items: center; }
        .cotizador-cta-link { display: inline-flex; align-items: center; gap: 10px; background: #9333EA; color: white; padding: 14px 32px; border-radius: 14px; font-size: 16px; font-weight: 700; text-decoration: none; font-family: 'DM Sans',sans-serif; box-shadow: 0 8px 28px rgba(147,51,234,0.3); transition: transform .2s, box-shadow .2s; }
        .cotizador-cta-btn-disabled { display: inline-flex; align-items: center; gap: 10px; background: #9333EA; color: white; padding: 14px 32px; border-radius: 14px; font-size: 16px; font-weight: 700; border: none; cursor: pointer; font-family: 'DM Sans',sans-serif; opacity: 0.6; }
        .cta-circle-1 { position: absolute; top: -80px; right: -80px; width: 300px; height: 300px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.12); pointer-events: none; }
        .cta-circle-2 { position: absolute; bottom: -60px; left: -60px; width: 250px; height: 250px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.08); pointer-events: none; }
        .cta-final-disabled { background: rgba(255,255,255,0.15); color: white; border-radius: 99px; padding: 16px 44px; font-size: 16px; font-weight: 600; display: inline-block; font-family: 'DM Sans', sans-serif; border: 1.5px solid rgba(255,255,255,0.35); opacity: 0.6; cursor: not-allowed; }
        .cta-final-link { background: rgba(255,255,255,0.15); color: white; border-radius: 99px; padding: 16px 44px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block; transition: transform 0.25s, box-shadow 0.25s, background 0.25s; font-family: 'DM Sans', sans-serif; box-shadow: 0 8px 30px rgba(0,0,0,0.20); border: 1.5px solid rgba(255,255,255,0.45); position: relative; z-index: 0; }
        @media(max-width:768px){
          .home-banner-wrap      { padding: 14px 16px 0; }
          .home-features-section { padding: 48px 16px 56px; }
          .home-cta-section      { padding: 48px 20px; }
          #home-cotizador        { padding: 36px 16px !important; }
          .cot-home-card { grid-template-columns: 1fr !important; text-align: center; padding: 32px 20px !important; gap: 0 !important; }
          .cot-home-emoji { display: none !important; }
        }
        @media(max-width:480px){
          .home-banner-wrap      { padding: 10px 12px 0; }
          .home-features-section { padding: 32px 12px 40px; }
          .home-cta-section      { padding: 36px 14px; }
        }
      `}</style>

      <MouseGlow />

      <VitaHeroSection user={user} />

      <div id="home-avatar">
        <AvatarSection />
      </div>

      <div className="home-banner-wrap" style={{ background: "linear-gradient(135deg, #F5F0FF 0%, #EEF2FF 100%)" }}>
        <Reveal variant="scale">
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <BannerPublicitario ubicacion="home" />
          </div>
        </Reveal>
      </div>

      <section id="home-features" className="home-features-section" style={{ background: "linear-gradient(160deg, #FDE8F4 0%, #F5E8FF 50%, #EDE8FF 100%)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", gap: "2rem", alignItems: "flex-start" }}>
          <div className="hidden-mobile">
            <BannerPublicitario ubicacion="home" lateral={true} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: 64 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <span style={{ display: "block", width: 44, height: 2, background: "linear-gradient(90deg,#EC4899,#9333EA)", borderRadius: 1 }} />
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9333EA", fontFamily: "'DM Sans', sans-serif" }}>Nuestros servicios</span>
                  <span style={{ display: "block", width: 44, height: 2, background: "linear-gradient(90deg,#7c3aed,#2563eb)", borderRadius: 1 }} />
                </div>
                <h2 style={{ fontSize: "clamp(2rem,4vw,3.2rem)", color: "#0F172A", fontFamily: "'Fraunces', serif", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
                  Todo lo que necesitas,<br /><em style={{ fontStyle: "italic", color: "#9333EA" }}>en un solo lugar</em>
                </h2>
              </div>
            </Reveal>
            <div className="features-grid">
              {FEATURES
                .filter(f => !(f.href === "/recursos" && user?.rol === "medico"))
                // La cuenta de médico no compra: la tarjeta que lleva a la
                // tienda solo le ofrece un sitio donde no puede hacer nada.
                .filter(f => !(f.href === "/marketplace" && user?.rol === "medico"))
                .map((f, i) => <Feature3DCard key={f.title} f={f} i={i} />)}
            </div>
          </div>
          <div className="hidden-mobile">
            <BannerPublicitario ubicacion="home" lateral={true} />
          </div>
        </div>
      </section>

      {/* ── Cotizador CTA ── */}
      <section id="home-cotizador" style={{ background: "linear-gradient(160deg, #EBF4FF 0%, #EEF0FF 50%, #F0EBFF 100%)", padding: "80px 24px" }}>
        <div className="cot-home-card">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16, background: "rgba(147,51,234,0.07)", padding: "6px 16px", borderRadius: 99 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#9333EA", fontFamily: "'DM Sans',sans-serif" }}>Herramienta gratuita</span>
            </div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 500, color: "#0F172A", margin: "0 0 14px", letterSpacing: "-.02em", lineHeight: 1.1 }}>
              ¿No sabes qué necesita<br /><em style={{ fontStyle: "italic", color: "#9333EA" }}>exactamente?</em>
            </h2>
            <p style={{ fontSize: 17, color: "#3d5049", lineHeight: 1.7, margin: "0 0 28px", maxWidth: 480 }}>
              Describe el hogar e indica sus necesidades específicas. En 2 minutos te preparamos un pack de soluciones tecnológicas personalizado y puedes añadirlas al carrito directamente.
            </p>
            {user ? (
              <Link
                href="/cotizador"
                className="cotizador-cta-link"
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 14px 36px rgba(147,51,234,0.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "none"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 28px rgba(147,51,234,0.3)"; }}
              >
                Usar el cotizador gratis
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("r65:open-auth"))}
                className="cotizador-cta-btn-disabled"
              >
                🔒 Inicia sesión para usar el cotizador
              </button>
            )}
          </div>
          <div className="cot-home-emoji" style={{ fontSize: 96, lineHeight: 1, flexShrink: 0 }}>🏠</div>
        </div>
      </section>

      <div style={{ lineHeight: 0, background: "linear-gradient(160deg, #EBF4FF 0%, #EEF0FF 100%)" }}>
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%" }}>
          <path d="M0,0 C480,60 960,60 1440,0 L1440,60 L0,60 Z" fill="#FDFAFF" />
        </svg>
      </div>

      <div id="home-testimonios">
        <TestimoniosSection />
      </div>

      <div style={{ lineHeight: 0, background: "var(--cream)" }}>
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%" }}>
          <path d="M0,60 C360,0 1080,0 1440,60 L1440,60 L0,60 Z" fill="#EC4899" />
        </svg>
      </div>

      <section id="home-cta" className="home-cta-section" style={{ background: "linear-gradient(135deg, #EC4899 0%, #9333EA 50%, #1D4ED8 100%)", position: "relative", overflow: "hidden" }}>
        <div className="cta-circle-1" />
        <div className="cta-circle-2" />
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <Reveal variant="scale">
            <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto", position: "relative", zIndex: 1 }}>
              <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 500, color: "white", marginBottom: 20, fontFamily: "'Fraunces', serif", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
                Da el primer paso hacia una vida llena de energía y conexión
              </h2>
              <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 17, lineHeight: 1.6, marginBottom: 36, fontFamily: "'DM Sans', sans-serif" }}>
                Estamos aquí para ayudarte. Contacta con nosotros y encontremos juntos la mejor solución.
              </p>
              {user?.rol === "admin" ? (
                <div className="cta-pink-btn cta-final-disabled">
                  Solo para usuarios
                </div>
              ) : (
                <Link href="/contacto" className="cta-pink-btn cta-final-link"
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, { transform: "translateY(-4px) scale(1.03)", background: "rgba(255,255,255,0.25)", boxShadow: "0 16px 40px rgba(0,0,0,0.28)" })}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: "none", background: "rgba(255,255,255,0.15)", boxShadow: "0 8px 30px rgba(0,0,0,0.20)" })}>
                  Contáctanos ahora
                </Link>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
