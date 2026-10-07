"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FadeUp } from "@/frontend/src/components/fade-up";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react";

const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=NetBees%20Business%20Center%2C%20Pol%C3%ADgono%20Industrial%20de%20Guarnizo%2049%2C%2039611%20Guarnizo%2C%20Cantabria";

const INFO = [
  { icon: MapPin, title: "Dirección", lines: ["Polígono Industrial de Guarnizo 49", "39611 Guarnizo, Cantabria"], color: "#EC4899", emoji: "📍" },
  { icon: Phone,  title: "Teléfono",  lines: ["+34 673 032 561", "Lunes a viernes: 8:30 - 16:30"],              color: "#9333EA", emoji: "📞" },
  { icon: Mail,   title: "Email",     lines: ["tecnico@netbees.com", "Respondemos en 24-48h"],               color: "#3B82F6", emoji: "✉️" },
  { icon: Clock,  title: "Horario",   lines: ["L-V: 8:30 - 16:30", "Fines de semana: cerrado"],                  color: "#9B59B6", emoji: "🕒" },
];

/* =========================================================
   ANIMACIONES Y UTILIDADES DE FONDO
========================================================= */


function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.4 + 0.1,
    }));
    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,215,120,${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);  
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}


function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (evento: MouseEvent) => {
      if (ref.current) Object.assign(ref.current.style, { left: evento.clientX + "px", top: evento.clientY + "px" });
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={ref} className="ct-mouse-glow" />;
}

function ContactoForm({ form, setForm, sent, sending, submit, focused, setFocused, inputStyle }: {
  form: { name: string; email: string; phone: string; subject: string; message: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string; subject: string; message: string }>>;
  sent: boolean;
  sending: boolean;
  submit: (e: React.FormEvent) => void;
  focused: string | null;
  setFocused: (v: string | null) => void;
  inputStyle: (field: string) => React.CSSProperties;
}) {
  return (
    <div className="ct-form-card" style={{ background: "white", borderRadius: 26, padding: 40, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid var(--sand)" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "inline-block", background: "linear-gradient(135deg, #FDF2F8, #FBCFE8)", borderRadius: 99, padding: "5px 16px", marginBottom: 12 }}>
          <span style={{ color: "var(--teal)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>Formulario</span>
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: "var(--slate)", fontWeight: 600 }}>Envíanos un mensaje</h2>
      </div>

      {sent ? (
        <div className="ct-success" style={{ textAlign: "center", padding: "44px 20px" }}>
          <div className="ct-success-icon" style={{ display: "inline-flex" }}>
            <CheckCircle size={60} color="var(--teal)" />
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--teal)", margin: "20px 0 12px", fontWeight: 600 }}>¡Mensaje enviado!</h3>
          <p style={{ color: "var(--muted)", fontSize: 15, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>Te contactaremos pronto.<br />Gracias por escribirnos.</p>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="ct-name-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label htmlFor="ct-name" className="ct-label" style={{ color: focused === "name" ? "var(--teal)" : "var(--slate)" }}>Nombre completo *</label>
              <input id="ct-name" style={inputStyle("name")} required placeholder="María García" value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, "") }))}
                onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} />
            </div>
            <div>
              <label htmlFor="ct-email" className="ct-label" style={{ color: focused === "email" ? "var(--teal)" : "var(--slate)" }}>Email *</label>
              <input id="ct-email" style={inputStyle("email")} type="email" required placeholder="maria@email.com" value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} />
            </div>
          </div>

          <div className="ct-name-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label htmlFor="ct-phone" className="ct-label" style={{ color: focused === "phone" ? "var(--teal)" : "var(--slate)" }}>Teléfono</label>
              <input
                id="ct-phone" style={inputStyle("phone")}
                type="tel"
                placeholder="+34 673 032 561"
                value={form.phone}
                onChange={(e) => {
                  const raw   = e.target.value;
                  const hasPlus = raw.startsWith("+");
                  const digits  = raw.replace(/\D/g, "").slice(0, 12);
                  const groups  = digits.match(/.{1,3}/g) ?? [];
                  const formatted = (hasPlus ? "+" : "") + groups.join(" ");
                  setForm(prev => ({ ...prev, phone: formatted }));
                }}
                maxLength={16}
                onFocus={() => setFocused("phone")}
                onBlur={() => setFocused(null)}
              />
            </div>
            <div>
              <label htmlFor="ct-subject" className="ct-label" style={{ color: focused === "subject" ? "var(--teal)" : "var(--slate)" }}>Asunto *</label>
              <input id="ct-subject" style={inputStyle("subject")} required placeholder="¿En qué podemos ayudarte?" value={form.subject}
                onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                onFocus={() => setFocused("subject")} onBlur={() => setFocused(null)} />
            </div>
          </div>

          <div>
            <label htmlFor="ct-message" className="ct-label" style={{ color: focused === "message" ? "var(--teal)" : "var(--slate)" }}>Mensaje *</label>
            <textarea id="ct-message" style={{ ...inputStyle("message"), minHeight: 130, resize: "vertical" }} required
              placeholder="Cuéntanos con detalle cómo podemos ayudarte..." value={form.message}
              onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
              onFocus={() => setFocused("message")} onBlur={() => setFocused(null)} />
          </div>

          <p style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, margin: "-4px 0 0" }}>
            Al enviar aceptas nuestra <Link href="/privacidad" style={{ color: "var(--teal)", fontWeight: 600 }}>política de privacidad</Link>. Nunca compartiremos tus datos.
          </p>

          <button type="submit" className="ct-submit ct-submit-btn" disabled={sending}
            style={{ background: sending ? "#F472B6" : "var(--teal)", cursor: sending ? "not-allowed" : "pointer" }}>
            {sending ? <><div className="ct-spinner" /> Enviando…</> : <><Send size={15} /> Enviar mensaje</>}
          </button>
        </form>
      )}
    </div>
  );
}

function ContactoInfo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "inline-block", background: "linear-gradient(135deg, #FDF2F8, #FBCFE8)", borderRadius: 99, padding: "5px 16px", marginBottom: 12 }}>
          <span style={{ color: "var(--teal)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>Información</span>
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: "var(--slate)", fontWeight: 600, marginBottom: 8 }}>¿Cómo llegar?</h2>
        <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif" }}>
          Puedes contactarnos por cualquiera de estos medios. Te respondemos lo antes posible.
        </p>
      </div>

      {INFO.map(({ icon: Icon, title, lines, color }) => (
        <div key={title} className="ct-info-card"
          style={{ background: "white", borderRadius: 18, padding: "20px 22px", border: `1px solid ${color}20`, display: "flex", gap: 16, alignItems: "flex-start", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <div className="ct-info-icon" style={{ width: 50, height: 50, borderRadius: 14, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${color}25` }}>
            <Icon size={20} color={color} />
          </div>
          <div>
            <h4 style={{ fontSize: 15, color: "var(--slate)", marginBottom: 5, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{title}</h4>
            {lines.map((l, i) => (
              <p key={l} style={{ fontSize: 16, color: i === 0 ? "var(--slate)" : "var(--muted)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, margin: 0 }}>{l}</p>
            ))}
          </div>
        </div>
      ))}

      <div className="ct-map-card"
        role="button" tabIndex={0} onClick={() => window.open(MAP_URL, "_blank", "noopener,noreferrer")} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); window.open(MAP_URL, "_blank", "noopener,noreferrer"); } }}
        onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, { transform: "scale(1.01)", boxShadow: "0 12px 32px rgba(236,72,153,0.15)" })}
        onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, { transform: "none", boxShadow: "none" })}>
        <div style={{ textAlign: "center" }}>
          <div className="map-pin ct-map-pin">
            <MapPin size={20} color="white" />
          </div>
          <p style={{ color: "var(--teal)", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Ver en Google Maps</p>
          <p style={{ color: "var(--muted)", fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Guarnizo, Cantabria</p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PÁGINA PRINCIPAL DE CONTACTO
========================================================= */
export default function ContactoPage() {
  const [form, setForm]       = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const heroBgRef      = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const mainRef        = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  // El banner principal ya no se mueve con el scroll ni salta a la
  // siguiente sección: el scroll es el normal del navegador.



  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error al enviar");
      setSent(true);
      setTimeout(() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }, 4000);
    } catch {
      alert("Ha ocurrido un error al enviar el mensaje. Por favor, inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  };


  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%", padding: "13px 16px",
    border: `1.5px solid ${focused === field ? "var(--teal)" : "var(--sand)"}`,
    borderRadius: 12, fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--slate)", background: focused === field ? "white" : "var(--cream)",
    outline: "none",
    transition: "border-color 0.25s, background 0.25s, box-shadow 0.25s",
    boxShadow: focused === field ? "0 0 0 3px rgba(236,72,153,0.10)" : "none",
  });

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
        

        .ct-badge { animation: ctFade  0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .ct-h1    { animation: ctSlide 0.9s 0.15s cubic-bezier(0.22,1,0.36,1) both; }
        .ct-sub   { animation: ctSlide 0.9s 0.3s  cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes ctFade  { from { opacity:0; transform:scale(0.85) translateY(10px); } to { opacity:1; transform:none; } }
        @keyframes ctSlide { from { opacity:0; transform:translateY(36px); } to { opacity:1; transform:none; } }
        .ct-form-card { transition: box-shadow 0.4s ease; }
        .ct-form-card:hover { box-shadow: 0 32px 72px rgba(0,0,0,0.1) !important; }
        .ct-submit { transition: all 0.3s cubic-bezier(0.22,1,0.36,1); position: relative; overflow: hidden; }
        .ct-submit::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); transform: translateX(-100%); transition: transform 0.5s ease; }
        .ct-submit:hover::after { transform: translateX(100%); }
        .ct-submit:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(236,72,153,0.40) !important; }
        .ct-submit:active { transform: translateY(0); }
        .ct-info-card { transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, border-color 0.3s ease; }
        .ct-info-card:hover { transform: translateX(6px); box-shadow: 0 12px 32px rgba(0,0,0,0.08) !important; }
        .ct-info-icon { transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.3s ease; }
        .ct-info-card:hover .ct-info-icon { transform: scale(1.18) rotate(-5deg); }
        .ct-success { animation: successPop 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .ct-success-icon { animation: iconSpin 0.6s 0.2s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes successPop { from { opacity:0; transform:scale(0.9) translateY(10px); } to { opacity:1; transform:none; } }
        @keyframes iconSpin   { from { transform:scale(0) rotate(-180deg); } to { transform:scale(1) rotate(0); } }
        .ct-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.35); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ct-label { display: block; font-size: 13px; font-weight: 600; color: var(--slate); margin-bottom: 8px; font-family: 'DM Sans', sans-serif; transition: color 0.2s ease; }
        .ct-wave svg { display: block; }
        @keyframes mapPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(236,72,153,0.28); } 50% { box-shadow: 0 0 0 12px rgba(236,72,153,0); } }
        .map-pin { animation: mapPulse 2.5s infinite; }
        .ct-scroll { animation: ctBounce 2s infinite; }
        @keyframes ctBounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(8px)} }
        .ct-mouse-glow { position: fixed; pointer-events: none; z-index: 0; width: 380px; height: 380px; border-radius: 50%; background: radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%); transform: translate(-50%,-50%); transition: left 0.1s ease, top 0.1s ease; }
        .ct-submit-btn { color: white; border: none; border-radius: 14px; padding: 15px 20px; font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 9px; box-shadow: 0 6px 24px rgba(236,72,153,0.28); }
        .ct-map-card { margin-top: 8px; border-radius: 18px; overflow: hidden; border: 1px solid var(--sand); position: relative; height: 160px; background: linear-gradient(135deg, #FDF2F8 0%, #FBCFE8 100%); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .ct-map-pin { width: 44px; height: 44px; border-radius: 50%; background: var(--teal); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
        @media (max-width: 768px) {
          .ct-grid-inner { grid-template-columns: 1fr !important; gap: 36px !important; }
          .ct-name-grid  { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .ct-h1 { font-size: clamp(2.5rem, 10vw, 3.5rem) !important; }
          .ct-form-card { padding: 24px !important; }
          .ct-badge { margin-bottom: 20px !important; }
        }
      `}</style>

      <MouseGlow />

      {/* =========================================================
         PANEL HERO (Sección superior con título y fondo)
      ========================================================= */}

      <header className="sn-hero" ref={heroRef}>
        <div ref={heroBgRef} className="sn-hero__bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516733968668-dbdce39c4651?q=80&w=1800&auto=format&fit=crop')" }} />
        <div className="sn-hero__overlay" />
        <div className="sn-hero__inner" ref={heroContentRef}>
          <h1 className="sn-hero__title">
            <span className="sn-word"><span>Ponte en</span></span><br />
            <span className="sn-word delay gold"><span>Contacto</span></span>
          </h1>
          <p className="sn-hero__sub">
            ¿Tienes alguna pregunta? Estamos aquí para ayudarte
          </p>
        </div>
        <div className="sn-hero__scroll">
          <div className="sn-hero__bar" />
          SCROLL
        </div>
      </header>

      {/* =========================================================
         PANEL PRINCIPAL DE CONTENIDO (Formulario e Información)
      ========================================================= */}
      <section ref={mainRef} id="formulario" style={{ maxWidth: 1100, margin: "0 auto", padding: "70px 40px 100px" }}>
        <div className="ct-grid-inner" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, alignItems: "start" }}>


          <FadeUp>
            <ContactoForm form={form} setForm={setForm} sent={sent} sending={sending} submit={submit} focused={focused} setFocused={setFocused} inputStyle={inputStyle} />
          </FadeUp>

          <FadeUp delay={0.15}>
            <ContactoInfo />
          </FadeUp>
        </div>

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
      </section>
    </div>
  );
}

