"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─────────────────────────────────────────────
   DATOS
───────────────────────────────────────────── */
const STATS = [
  { value: 500, suffix: "+", label: "Personas ayudadas" },
  { value: 10,  suffix: "+", label: "Cuidadores certificados" },
  { value: 20,  suffix: "+", label: "Organizaciones aliadas" },
  { value: 1,   suffix: "",  label: "Año de experiencia" },
];

const VALUES = [
  {
    variant: "v1",
    iconNode: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10z"/>
      </svg>
    ),
    title: "Empatía",
    desc: "Entendemos las necesidades únicas de cada persona mayor y sus familias.",
  },
  {
    variant: "v2",
    iconNode: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      </svg>
    ),
    title: "Compromiso",
    desc: "Nos dedicamos a brindar el mejor servicio con profesionalismo y dedicación.",
  },
  {
    variant: "v3",
    iconNode: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/>
        <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5"/><path d="M14 19c0-2.4 1.8-4 3-4s3 1.4 3 3.5"/>
      </svg>
    ),
    title: "Comunidad",
    desc: "Creamos redes de apoyo entre personas mayores, familias y cuidadores.",
  },
  {
    variant: "v4",
    iconNode: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="9" r="5"/><path d="M8.5 13 L 7 21 L 12 18 L 17 21 L 15.5 13"/>
      </svg>
    ),
    title: "Excelencia",
    desc: "Formación continua y estándares de calidad en todos nuestros servicios.",
  },
];

const SN_BEE_SHADOW_STYLE: React.CSSProperties = { position: "fixed", zIndex: 49, pointerEvents: "none", width: 80, height: 30, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(0,0,0,0.42) 0%,transparent 70%)", transformOrigin: "center" };

const EQUIPO = [
  { name: "Teresa Iglesias",    role: "Directora Ejecutiva",     photo: "https://unavatar.io/linkedin/teresaiglesiashr?fallback=false",                                       linkedin: "https://www.linkedin.com/in/teresaiglesiashr/" },
  { name: "Diego García Niño",  role: "Director de Operaciones", photo: "https://unavatar.io/linkedin/diego-garcia-nino?fallback=false",                                      linkedin: "https://www.linkedin.com/in/diego-garcia-nino/" },
  { name: "Héctor López",       role: "Desarrollador",           photo: "https://unavatar.io/linkedin/héctor-lópez-b7330b400?fallback=false",                                 linkedin: "https://www.linkedin.com/in/h%C3%A9ctor-l%C3%B3pez-b7330b400/" },
  { name: "Javier Echevarría",  role: "Desarrollador",           photo: "https://unavatar.io/linkedin/javier-echevarría-traspuesto-ab3755258?fallback=false",                linkedin: "https://www.linkedin.com/in/javier-echevarría-traspuesto-ab3755258/" },
];

/* ─────────────────────────────────────────────
   COUNTUP
───────────────────────────────────────────── */
function CountUp({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref     = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const dur = 1400, start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          setCount(Math.round(target * (1 - Math.pow(1 - t, 3))));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{count}</span>;
}


function FlyingBee() {
  const beeRef    = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const animRef   = useRef<number>(0);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const vw = window.innerWidth, vh = window.innerHeight;
    let px = vw * 0.5, py = -120;
    let vx = (Math.random() - 0.5) * 3, vy = 1.2;
    let targetX = vw * 0.4, targetY = vh * 0.2;
    let nextChange = performance.now() + 800;
    let smoothRY = 0, smoothRX = 0;
    let t = 0;
    // Noise state for smooth random drift (simple LCG-based smooth noise)
    let noiseX = 0, noiseY = 0, noiseVX = (Math.random()-0.5)*0.04, noiseVY = (Math.random()-0.5)*0.02;
    const MAX_SPD = 7;

    const pick = (now: number) => {
      const m = vw * 0.1;
      targetX = m + Math.random() * (vw - m * 2);
      // Targets distributed vertically so the bee wanders the full page naturally
      targetY = py + vh * (0.1 + Math.random() * 0.45);
      nextChange = now + 1400 + Math.random() * 1800;
    };

    const tick = (now: number) => {
      const el = beeRef.current, sh = shadowRef.current;
      if (!el) return;
      if (py > vh + 80) { setGone(true); return; }
      if (now >= nextChange) pick(now);

      t += 0.018;

      // Smooth organic noise (random walk, bounded)
      noiseVX += (Math.random() - 0.5) * 0.05; noiseVX *= 0.92;
      noiseVY += (Math.random() - 0.5) * 0.03; noiseVY *= 0.92;
      noiseX += noiseVX; noiseY += noiseVY;
      noiseX = Math.max(-1, Math.min(1, noiseX));
      noiseY = Math.max(-0.6, Math.min(0.6, noiseY));

      // Steering toward target — soft, eased force (stronger when far)
      const dx = targetX - px, dy = targetY - py;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const ease = Math.min(1, dist / 220);          // ramp up force at distance
      const steer = 0.09 * ease;
      vx += (dx / dist) * steer * MAX_SPD;
      vy += (dy / dist) * steer * MAX_SPD;

      // Organic drift noise on top
      vx += noiseX * 0.18;
      vy += noiseY * 0.10;

      // Natural vertical bob (wing-beat rhythm)
      vy += Math.sin(t * 4.2) * 0.08;

      // Speed cap with smooth clamping
      const spd = Math.sqrt(vx*vx + vy*vy);
      if (spd > MAX_SPD) { vx = vx/spd*MAX_SPD; vy = vy/spd*MAX_SPD; }

      // Damping — higher = smoother glide
      vx *= 0.92; vy *= 0.92;

      // Gentle gravity-like downward pull so it keeps descending overall
      if (vy < 0.5) vy += (0.5 - vy) * 0.08;

      px += vx; py += vy;

      // Soft wall bounce
      if (px < 20)     { vx = Math.abs(vx) * 0.7; px = 20; }
      if (px > vw-20)  { vx = -Math.abs(vx) * 0.7; px = vw-20; }

      // Rotation: lean into velocity direction, smooth and limited
      const tRY = Math.max(-38, Math.min(38, vx * 3.8));
      const tRX = Math.max(-18, Math.min(18, -vy * 1.4));
      smoothRY += (tRY - smoothRY) * 0.09;
      smoothRX += (tRX - smoothRX) * 0.09;

      // Slight wing-flap tilt oscillation
      const flapTilt = Math.sin(t * 28) * 1.8;

      const fade = vh * 0.78, op = py > fade ? Math.max(0, 1-(py-fade)/(vh*0.28)) : 1;
      Object.assign(el.style, {
        left: px+"px", top: py+"px", opacity: String(op),
        transform: `perspective(420px) rotateY(${smoothRY}deg) rotateX(${smoothRX + flapTilt}deg) scaleX(${1-Math.abs(smoothRY)/260})`,
        filter: `drop-shadow(${smoothRY*0.08}px 5px 10px rgba(0,0,0,0.28))`
      });
      if (sh) Object.assign(sh.style, {
        left: (px+12)+"px", top: (py+90)+"px", opacity: String(op*0.14),
        transform: `scaleX(${Math.max(0.2, 1-Math.abs(smoothRY)/90)}) scaleY(0.28)`
      });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);
  if (gone) return null;
  return (
    <>
      <div ref={shadowRef} style={SN_BEE_SHADOW_STYLE} />
      <div ref={beeRef} style={{ position:"fixed",zIndex:50,pointerEvents:"none",left:"50%",top:"-120px",transformStyle:"preserve-3d",transformOrigin:"center" }}>
        <Image src="https://www.netbees.es/uploads/abejanetbees.png" alt="" width={110} height={110} style={{ width:110,height:110,display:"block",userSelect:"none" }} />
      </div>
    </>
  );
}


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
function Reveal({ children, delay=0, className="", variant="up" }:
  { children: React.ReactNode; delay?: number; className?: string; variant?: "up"|"left"|"right"|"scale" }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`sn-reveal sn-reveal--${variant} ${className}`}
      style={{ transitionDelay: delay ? `${delay}s` : undefined }}>
      {children}
    </div>
  );
}


function HeroWord({ children, delay=0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = setTimeout(() => el.classList.add("sn-in"), 200 + delay);
    return () => clearTimeout(t);
  }, [delay]);
  return <span ref={ref} className="sn-word">{children}</span>;
}

function getAbsoluteTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top + window.scrollY;
}

const navTo = (id: string) => (e: React.SyntheticEvent) => {
  e.preventDefault();
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: getAbsoluteTop(el), behavior: "smooth" });
};

const SOBRE_NOSOTROS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,500;1,9..144,600;1,9..144,700&family=Inter:wght@300;400;500;600;700&display=swap');

  .sn-root {
    --sn-cream: #F8F5FF; --sn-g900: #1D4ED8; --sn-g800: #7C3AED;
    --sn-g700: #9333EA;  --sn-g500: #EC4899;  --sn-mint: #FBCFE8;
    --sn-gold: #EC4899;  --sn-ink: #0F172A;    --sn-ink2: #334155;
    --sn-line: rgba(147,51,234,0.12);
    --sn-shadow: 0 30px 60px -30px rgba(147,51,234,.22), 0 8px 18px -10px rgba(147,51,234,.10);
    font-family: 'Inter', system-ui, sans-serif; color: var(--sn-ink); overflow-x: hidden;
  }

  /* PROGRESS */
  .sn-progress { position:fixed; top:0; left:0; height:3px; z-index:200; pointer-events:none;
    background:linear-gradient(90deg,var(--sn-g700),var(--sn-gold)); transition:width .12s linear; }

  /* REVEAL */
  .sn-reveal { opacity:0; transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1); }
  .sn-reveal--up    { transform:translateY(40px); }
  .sn-reveal--left  { transform:translateX(-50px); }
  .sn-reveal--right { transform:translateX(50px); }
  .sn-reveal--scale { transform:scale(0.94); }
  .sn-reveal.sn-in  { opacity:1; transform:none; }

  /* EYEBROW */
  .sn-eyebrow { display:inline-flex; align-items:center; gap:8px; padding:8px 18px; border-radius:999px;
    background:var(--sn-mint); color:var(--sn-g800); font-size:11px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; }
  .sn-eyebrow::before { content:""; width:8px; height:8px; border-radius:50%; background:var(--sn-g700); }
  .sn-eyebrow--white { background:rgba(255,255,255,.92); color:var(--sn-g800); box-shadow:0 4px 12px rgba(0,0,0,.1); }
  .sn-eyebrow--white::before { background:var(--sn-g500); }


  /* HERO */
  .sn-hero { position:relative; height:100vh; min-height:720px; overflow:hidden;
    display:grid; place-items:center; isolation:isolate; }
  .sn-hero__bg { position:absolute; inset:-8%; z-index:-2; will-change:transform;
    background-size:cover; background-position:center; }
  .sn-hero__overlay { position:absolute; inset:0; z-index:-1;
    background:linear-gradient(180deg,rgba(29,78,216,.30) 0%,rgba(29,78,216,.10) 30%,rgba(29,78,216,.55) 78%,rgba(15,10,30,.92) 100%); }
  .sn-hero__inner { position:relative; z-index:2; text-align:center; padding:0 24px; color:#fff; will-change:transform,opacity; }
  .sn-hero__title { font-family:'Fraunces',serif; font-weight:500; font-size:clamp(72px,13vw,200px); line-height:.95; letter-spacing:-.02em; margin:32px 0 0; }
  .sn-hero__title .second { display:block; font-style:italic; color:var(--sn-gold); margin-top:-10px; }
  .sn-hero__sub { margin-top:28px; font-size:clamp(16px,1.6vw,22px); font-weight:400; color:rgba(255,255,255,.92); }
  .sn-word-wrap { overflow:hidden; display:inline-block; vertical-align:bottom; }
  .sn-word { display:inline-block; transform:translateY(110%); transition:transform 1s cubic-bezier(.2,.7,.2,1); }
  .sn-word.sn-in { transform:translateY(0); }
  .sn-hero__scroll { position:absolute; bottom:32px; left:50%; transform:translateX(-50%);
    display:flex; flex-direction:column; align-items:center; gap:12px;
    color:rgba(255,255,255,.7); font-size:11px; letter-spacing:.25em; text-transform:uppercase;
    z-index:3; opacity:0; animation:snFade .9s ease .9s forwards; }
  .sn-hero__bar { width:1px; height:40px; background:linear-gradient(to bottom,transparent,var(--sn-gold)); animation:snDrop 2s ease-in-out infinite; }
  @keyframes snDrop { 0%{transform:scaleY(0);transform-origin:top} 50%{transform:scaleY(1);transform-origin:top} 51%{transform:scaleY(1);transform-origin:bottom} 100%{transform:scaleY(0);transform-origin:bottom} }
  /* HISTORIA */
  .sn-historia { background:var(--sn-cream); min-height:100vh; display:flex; align-items:center; }
  .sn-historia__grid { display:grid; grid-template-columns:1.05fr 1fr; gap:80px; align-items:center; }
  .sn-historia__visual { position:relative; aspect-ratio:1/1; border-radius:24px; overflow:hidden;
    background:linear-gradient(160deg,#FDF2F8,#c9dccf 70%,#b6cfc1); box-shadow:var(--sn-shadow); }
  .sn-historia__heart { position:absolute; inset:12% 12% 28%; width:76%; height:60%; }
  .sn-historia__silhouettes { position:absolute; inset:22% 22% 32%; width:56%; height:46%;
    display:flex; gap:4%; align-items:flex-end; justify-content:center; }
  .sn-historia__figure { width:48%; aspect-ratio:1/1.4; border-radius:50% 50% 35% 35%;
    background:linear-gradient(180deg,#c4ccc7 0%,#8a9590 60%,#6e7975 100%); position:relative; }
  .sn-historia__figure::before { content:""; position:absolute; top:0; left:50%; transform:translateX(-50%);
    width:50%; aspect-ratio:1; border-radius:50%; background:linear-gradient(180deg,#d4d8d3,#a8b0ab); }
  .sn-historia__year { position:absolute; bottom:6%; left:50%; transform:translateX(-50%);
    background:var(--sn-g800); color:#fff; padding:18px 56px; border-radius:12px; text-align:center;
    border:2px solid rgba(255,255,255,.4); box-shadow:0 14px 30px rgba(147,51,234,.25); }
  .sn-historia__year .y { font-family:'Fraunces',serif; font-size:44px; font-weight:500; line-height:1; }
  .sn-historia__year .l { font-size:12px; margin-top:6px; letter-spacing:.04em; color:rgba(255,255,255,.85); }
  .sn-historia__head h2 { font-family:'Fraunces',serif; font-size:clamp(40px,5vw,64px); font-weight:500;
    line-height:1.05; margin:24px 0 36px; letter-spacing:-.02em; }
  .sn-historia__head h2 em { font-style:italic; color:var(--sn-g800); }
  .sn-timeline { border-left:1.5px solid var(--sn-g700); padding-left:28px; display:flex; flex-direction:column; gap:28px; }
  .sn-timeline-item { position:relative; font-size:16px; line-height:1.65; color:var(--sn-ink2); }
  .sn-timeline-item::before { content:""; position:absolute; left:-36px; top:8px; width:14px; height:14px; border-radius:50%;
    background:var(--sn-g800); border:3px solid var(--sn-cream); box-shadow:0 0 0 1.5px var(--sn-g700); }

  /* STATS — min-height:100vh para ser snap target completo */
  .sn-stats-wrap { background:var(--sn-cream); min-height:100vh; display:flex; align-items:center; }
  .sn-stats-inner { max-width:1240px; margin:0 auto; padding:0 48px; width:100%; }
  .sn-stats { background:radial-gradient(ellipse 60% 80% at 110% 0%,rgba(212,161,74,.25),transparent 55%),
      linear-gradient(135deg,#EC4899 0%,#9333EA 70%); border-radius:32px; padding:72px 64px;
    display:grid; grid-template-columns:repeat(4,1fr); gap:48px;
    box-shadow:0 40px 80px -40px rgba(147,51,234,.5); position:relative; overflow:hidden; }
  .sn-stat { color:#fff; position:relative; }
  .sn-stat+.sn-stat::before { content:""; position:absolute; left:-24px; top:8px;
    width:1px; height:calc(100%-16px); background:rgba(255,255,255,.18); }
  .sn-stat__num { font-family:'Fraunces',serif; font-weight:500; font-size:clamp(72px,8vw,110px);
    line-height:1; letter-spacing:-.03em; display:inline-flex; align-items:baseline; }
  .sn-stat__plus { color:var(--sn-gold); font-size:.55em; margin-left:4px; font-style:italic; }
  .sn-stat__label { margin-top:24px; font-size:16px; color:rgba(255,255,255,.82); letter-spacing:.01em; }

  /* VALORES */
  .sn-valores { background:var(--sn-cream); min-height:100vh; display:flex; align-items:center; }
  .sn-valores__grid { display:grid; grid-template-columns:repeat(4,1fr); gap:24px; align-items:stretch; }
  .sn-valores__grid .sn-reveal { display:flex; flex-direction:column; }
  .sn-valor { background:#fff; border-radius:24px; padding:36px 28px; text-align:left;
    border:none; border-top:4px solid var(--sv-ifg,var(--sn-g800));
    box-shadow:0 2px 16px rgba(147,51,234,0.08);
    transition:transform .5s cubic-bezier(.2,.7,.2,1),box-shadow .5s ease; cursor:default;
    display:flex; flex-direction:column; flex:1; }
  .sn-valor:hover { transform:translateY(-8px); box-shadow:0 20px 48px rgba(147,51,234,0.16); }
  .sn-valor__icon { width:64px; height:64px; border-radius:50%; display:grid; place-items:center;
    background:var(--sv-ibg,#FDF2F8); color:var(--sv-ifg,var(--sn-g800)); margin-bottom:24px; transition:transform .4s; }
  .sn-valor:hover .sn-valor__icon { transform:scale(1.1) rotate(-4deg); }
  .sn-valor h3 { font-family:'Fraunces',serif; font-weight:600; font-size:22px; margin:0 0 10px; }
  .sn-valor p  { margin:0; color:var(--sn-ink2); font-size:16px; line-height:1.75; flex:1; }
  .sv-v1{--sv-ibg:#fde7e7;--sv-ifg:#c14848} .sv-v2{--sv-ibg:#dceae3;--sv-ifg:var(--sn-g800)}
  .sv-v3{--sv-ibg:#f7e9c8;--sv-ifg:#a07728} .sv-v4{--sv-ibg:#e3e8f7;--sv-ifg:#4a5cae}

  /* EQUIPO */
  .sn-equipo { background:var(--sn-cream); min-height:100vh; display:flex; align-items:center; }
  .sn-equipo__grid { display:grid; grid-template-columns:repeat(4,1fr); gap:24px; }
  .sn-miembro { background:#fff; border-radius:18px; padding:36px 24px 28px; text-align:center;
    border:1px solid var(--sn-line); box-shadow:0 12px 30px -16px rgba(147,51,234,.12);
    transition:transform .4s,box-shadow .4s; position:relative; overflow:hidden; }
  .sn-miembro::after { content:""; position:absolute; left:50%; bottom:0; transform:translateX(-50%);
    width:0; height:3px; background:var(--sn-gold); border-radius:2px 2px 0 0; transition:width .4s; }
  .sn-miembro:hover { transform:translateY(-4px); box-shadow:var(--sn-shadow); }
  .sn-miembro:hover::after { width:60%; }
  .sn-miembro__photo-wrap { width:120px; height:120px; border-radius:50%; overflow:hidden; margin:0 auto 22px;
    border:2px solid var(--sn-mint); position:relative; transition:transform .4s,box-shadow .4s; }
  .sn-miembro:hover .sn-miembro__photo-wrap { transform:scale(1.06); box-shadow:0 0 0 3px var(--sn-g700),0 12px 30px -8px rgba(147,51,234,.3); }
  .sn-miembro__photo { width:100%; height:100%; object-fit:cover; display:block; transition:transform .4s,filter .4s; }
  .sn-miembro:hover .sn-miembro__photo { transform:scale(1.1); filter:brightness(.62); }
  .sn-linkedin-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity .4s; }
  .sn-miembro:hover .sn-linkedin-overlay { opacity:1; }
  .sn-miembro h4 { font-family:'Fraunces',serif; font-weight:600; font-size:19px; margin:0 0 6px; color:var(--sn-ink); }
  .sn-miembro p  { margin:0; color:var(--sn-ink2); font-size:14px; transition:color .3s; }
  .sn-miembro:hover p { color:var(--sn-g700); }

  /* CTA */
  .sn-cta { background:var(--sn-cream); min-height:100vh; display:flex; align-items:stretch; }
  .sn-cta-inner { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
    background:radial-gradient(ellipse 60% 80% at 110% 100%,rgba(212,161,74,.18),transparent 55%),
      linear-gradient(135deg,#EC4899 0%,#9333EA 100%);
    color:#fff; padding:100px 24px 80px; text-align:center; position:relative; overflow:hidden; }
  .sn-cta-inner::before { content:""; position:absolute; top:-1px; left:0; right:0; height:80px;
    background:var(--sn-cream);
    -webkit-mask:radial-gradient(80% 100% at 50% 0%,transparent 99%,#000 100%);
            mask:radial-gradient(80% 100% at 50% 0%,transparent 99%,#000 100%); }
  .sn-cta-inner h2 { font-family:'Fraunces',serif; font-weight:500; font-size:clamp(38px,4.8vw,60px);
    line-height:1.1; margin:0 auto 24px; max-width:800px; }
  .sn-cta-inner p { max-width:540px; margin:0 auto 40px; color:rgba(255,255,255,.8); font-size:17px; line-height:1.6; }
  .sn-btn { display:inline-flex; align-items:center; gap:10px; background:var(--sn-gold); color:#fff;
    border:none; border-radius:999px; padding:18px 44px; font-size:16px; font-weight:600;
    cursor:pointer; text-decoration:none; font-family:'Inter',sans-serif;
    box-shadow:0 0 0 10px rgba(212,161,74,.18),0 0 60px rgba(212,161,74,.45),0 14px 30px rgba(147,51,234,.25);
    transition:transform .3s,box-shadow .3s; }
  .sn-btn:hover { transform:translateY(-2px); box-shadow:0 0 0 12px rgba(212,161,74,.22),0 0 70px rgba(212,161,74,.55),0 18px 38px rgba(147,51,234,.3); }

  /* FAB */
  .sn-fab { position:fixed; bottom:24px; left:24px; width:44px; height:44px; border-radius:50%; border:none; padding:0;
    background:var(--sn-ink); color:#fff; display:grid; place-items:center;
    font-family:'Fraunces',serif; font-style:italic; font-weight:500; font-size:18px;
    z-index:90; box-shadow:0 8px 20px rgba(0,0,0,.2); cursor:pointer; transition:transform .3s; }
  .sn-fab:hover { transform:scale(1.1); }

  /* SECTION WRAPPER */
  .sn-section { max-width:1240px; margin:0 auto; padding:110px 48px 80px; width:100%; }
  .sn-section-head { display:flex; flex-direction:column; align-items:center; gap:18px; text-align:center; margin-bottom:64px; }
  .sn-section-head h2 { font-family:'Fraunces',serif; font-size:clamp(40px,5vw,64px); font-weight:500; line-height:1.05; margin:0; letter-spacing:-.02em; }
  .sn-section-head h2 em { font-style:italic; color:var(--sn-g800); }

  /* RESPONSIVE */
  @media(max-width:980px){
    .sn-historia__grid{grid-template-columns:1fr;gap:50px}
    .sn-stats{grid-template-columns:repeat(2,1fr);gap:40px 20px;padding:48px 32px}
    .sn-stat+.sn-stat::before{display:none}
    .sn-valores__grid,.sn-equipo__grid{grid-template-columns:repeat(2,1fr)}
    .sn-section{padding:80px 24px}
    .sn-stats-inner{padding:0 24px}
    .sn-historia__year{position:static;transform:none;margin:24px auto 0;display:block;width:fit-content}
  }
  @media(max-width:560px){
    .sn-valores__grid,.sn-equipo__grid{grid-template-columns:1fr}
    .sn-stats{grid-template-columns:1fr;gap:32px}
    .sn-hero__title{font-size:clamp(60px,16vw,90px)}
    .sn-section{padding:48px 16px}
    .sn-stats{padding:32px 16px}
  }
  @media(max-width:375px){
    .sn-section{padding:36px 14px}
    .sn-hero__title{font-size:clamp(44px,14vw,70px)}
    .sn-valores__grid,.sn-equipo__grid{gap:14px}
  }
`;

function SobreNosotrosValores() {
  return (
    <div className="sn-section">
      <div className="sn-section-head">
        <Reveal><span className="sn-eyebrow">Lo que nos guía</span></Reveal>
        <Reveal delay={0.1}><h2>Nuestros <em>Valores</em></h2></Reveal>
      </div>
      <div className="sn-valores__grid">
        {VALUES.map(({ variant, iconNode, title, desc }, i) => (
          <Reveal key={title} delay={i * 0.1}>
            <article className={`sn-valor sv-${variant}`}>
              <div className="sn-valor__icon">{iconNode}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function SobreNosotrosEquipo() {
  return (
    <div className="sn-section">
      <div className="sn-section-head">
        <Reveal><span className="sn-eyebrow">Las personas detrás</span></Reveal>
        <Reveal delay={0.1}><h2>Nuestro <em>Equipo</em></h2></Reveal>
      </div>
      <div className="sn-equipo__grid">
        {EQUIPO.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.1}>
            <article className="sn-miembro">
              <a href={p.linkedin} target="_blank" rel="noopener noreferrer" style={{ display:"block",textDecoration:"none" }}>
                <div className="sn-miembro__photo-wrap">
                  <Image src={p.photo} alt={p.name} width={120} height={120} unoptimized className="sn-miembro__photo" />
                  <div className="sn-linkedin-overlay">
                    <svg viewBox="0 0 24 24" width="26" height="26" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                      <rect x="2" y="9" width="4" height="12"/>
                      <circle cx="4" cy="4" r="2"/>
                    </svg>
                  </div>
                </div>
              </a>
              <h4>{p.name}</h4>
              <p>{p.role}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PÁGINA
───────────────────────────────────────────── */
export default function SobreNosotrosPage() {
  const [user, setUser]           = useState<{ rol?: string } | null>(null);
  const activeSectionRef = useRef("hero");
  const [scrollProgress, setScrollProgress] = useState(0);

 
  const heroRef     = useRef<HTMLElement>(null);
  const historiaRef = useRef<HTMLElement>(null);
  const statsRef    = useRef<HTMLDivElement>(null);
  const valoresRef  = useRef<HTMLElement>(null);
  const equipoRef   = useRef<HTMLElement>(null);
  const ctaRef      = useRef<HTMLElement>(null);

  
  const heroBgRef      = useRef<HTMLDivElement>(null);
  const heroSilRef     = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    const check = () => {
      const u = sessionStorage.getItem("r65_user:v1");
      setUser(u ? (() => { try { return JSON.parse(u); } catch { return null; } })() : null);
    };
    check();
    window.addEventListener("relatia-auth-changed", check);
    window.addEventListener("r65:authed", check);
    return () => { window.removeEventListener("relatia-auth-changed", check); window.removeEventListener("r65:authed", check); };
  }, []);

  

  
  useEffect(() => {
    const items = [
      { id:"hero",     el: heroRef.current },
      { id:"historia", el: historiaRef.current },
      { id:"stats",    el: statsRef.current },
      { id:"valores",  el: valoresRef.current },
      { id:"equipo",   el: equipoRef.current },
      { id:"cta",      el: ctaRef.current },
    ].filter(s => s.el) as { id: string; el: HTMLElement }[];
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > 0.3) {
          const f = items.find(s => s.el === e.target);
          if (f) activeSectionRef.current = f.id;
        }
      });
    }, { threshold: [0.3, 0.6] });
    for (const s of items) obs.observe(s.el);
    return () => obs.disconnect();
  }, []);

  
  useEffect(() => {
    if (window.innerWidth < 768) return;
    let ticking = false;
    const fn = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const sc = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(max > 0 ? (sc / max) * 100 : 0);
        const heroH = window.innerHeight;
        if (sc < heroH * 1.2) {
          if (heroBgRef.current) heroBgRef.current.style.transform = `translateY(${sc*0.35}px) scale(${1+sc*0.0003})`;
          if (heroSilRef.current) heroSilRef.current.style.transform = `translateY(${sc*0.15}px)`;
          if (heroContentRef.current) {
            heroContentRef.current.style.transform = `translateY(${sc*0.45}px)`;
            heroContentRef.current.style.opacity   = String(Math.max(0, 1 - sc/(heroH*0.7)));
          }
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  
  // Sin saltos automáticos entre secciones: el scroll es el del navegador.
  // El código anterior cancelaba TODOS los eventos de rueda sin condición, y
  // además las flechas, avanzar página, espacio, inicio y fin.

  return (
    <div className="page-enter">
      <FlyingBee />

      <style>{SOBRE_NOSOTROS_STYLES}</style>

      <div className="sn-root">

        
        <div className="sn-progress" style={{ width: `${scrollProgress}%` }} />

        
        <button
          type="button"
          className="sn-fab"
          onClick={navTo("hero")}
        >N</button>



        <header className="sn-hero" ref={heroRef} id="hero">
          <div ref={heroBgRef} className="sn-hero__bg"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2200&auto=format&fit=crop')" }}
          />
          <div className="sn-hero__overlay" />
          <div ref={heroContentRef} className="sn-hero__inner">
            <h1 className="sn-hero__title">
              <span className="sn-word-wrap"><HeroWord>Sobre</HeroWord></span>
              <span className="second sn-word-wrap"><HeroWord delay={180}>Nosotros</HeroWord></span>
            </h1>
            <p className="sn-hero__sub">En VIVE&nbsp;+ creemos que ninguna persona mayor debería sentirse sola</p>
          </div>
          <div className="sn-hero__scroll">
            <span>Descubre más</span>
            <div className="sn-hero__bar" />
          </div>
        </header>

        <section className="sn-historia" id="historia" ref={historiaRef}>
          <div className="sn-section">
            <div className="sn-historia__grid">
              <Reveal variant="left">
                <div className="sn-historia__visual">
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Image src="/logo.png" alt="Logo VIVE +" fill
                      sizes="(max-width: 980px) 100vw, 50vw"
                      style={{ objectFit:"cover" }} />
                  </div>
                  <div className="sn-historia__year">
                    <div className="y">2026</div>
                    <div className="l">Fundados en Santander</div>
                  </div>
                </div>
              </Reveal>
              <div className="sn-historia__head">
                <Reveal><span className="sn-eyebrow">Nuestra historia</span></Reveal>
                <Reveal delay={0.1}><h2>Nacimos para<br /><em>combatir la soledad</em></h2></Reveal>
                <div className="sn-timeline">
                  {[
                    "VIVE + nació en 2026 con una misión clara: combatir la soledad no deseada en personas mayores de Santander. Fundada por profesionales de la salud y el trabajo social, hemos crecido hasta convertirnos en plataforma de referencia en Cantabria.",
                    "Conectamos a personas mayores con cuidadores profesionales y organizaciones que ofrecen acompañamiento, actividades sociales y servicios para mejorar su calidad de vida.",
                    "Creemos que el envejecimiento activo y la conexión social son fundamentales para el bienestar. Por eso trabajamos cada día para crear puentes entre generaciones y comunidades.",
                  ].map((text, i) => (
                    <Reveal key={text} delay={0.2 + i * 0.1}>
                      <div className="sn-timeline-item">{text}</div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        
        <div className="sn-stats-wrap" ref={statsRef}>
          <div className="sn-stats-inner">
            <Reveal variant="scale">
              <div className="sn-stats">
                {STATS.map(({ value, suffix, label }) => (
                  <div key={label} className="sn-stat">
                    <div className="sn-stat__num">
                      <CountUp target={value} />
                      {suffix && <span className="sn-stat__plus">{suffix}</span>}
                    </div>
                    <div className="sn-stat__label">{label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        
        <section className="sn-valores" id="valores" ref={valoresRef}>
          <SobreNosotrosValores />
        </section>

        <section className="sn-equipo" id="equipo" ref={equipoRef}>
          <SobreNosotrosEquipo />
        </section>

        
        <section className="sn-cta" ref={ctaRef}>
          <div className="sn-cta-inner">
            <Reveal>
              <h2>¿Quieres formar parte<br /><em style={{ fontStyle:"italic",color:"#fff" }}>de nuestra misión?</em></h2>
              <p>Únete como cuidador, colabora como organización o apóyanos como voluntario.</p>
              {user?.rol === "admin"
                ? <span className="sn-btn" style={{ opacity:.6,cursor:"not-allowed" }}>Solo para usuarios</span>
                : <Link href="/contacto" className="sn-btn">Contáctanos</Link>}
            </Reveal>
          </div>
        </section>

        {/* VOLVER */}
        <div style={{ background:"var(--sn-cream)",padding:"32px 5%",textAlign:"left" }}>
          <Link href="/" style={{ color:"#9333EA",textDecoration:"none",fontWeight:500,fontSize:13.5,opacity:.75 }}>
            Volver al inicio
          </Link>
        </div>

      </div>
    </div>
  );
}