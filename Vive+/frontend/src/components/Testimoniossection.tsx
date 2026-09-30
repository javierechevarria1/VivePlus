"use client";

import { useState, useEffect, useReducer, useRef } from "react";
import { FadeUp } from "@/frontend/src/components/fade-up";
import { Star, Send, CheckCircle } from "lucide-react";

type Testimonio = {
  id: number;
  nombre: string;
  rol: string;
  texto: string;
  rating: number;
  creado_en: string;
};

type CurrentUser = { id: number; username: string; email: string };

function shuffle(arr: number[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const colors = ["#EC4899","#9333EA","#1D4ED8","#DB2777","#7C3AED","#2563EB"];

const badgeStyle: React.CSSProperties = {
  display: "inline-block", background: "white", border: "1px solid var(--sand)",
  borderRadius: 99, padding: "6px 20px", fontSize: 12, fontWeight: 700,
  letterSpacing: "0.04em", textTransform: "uppercase", color: "#9333EA", marginBottom: 20,
};
const cardWrapStyle: React.CSSProperties = {
  width: "100%", maxWidth: 600, margin: "0 auto", overflow: "hidden",
  position: "relative", minHeight: 220, marginBottom: 28, display: "flex", justifyContent: "center",
};
const successBoxStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, background: "#FDF2F8",
  border: "1px solid rgba(236,72,153,0.25)", borderRadius: 14, padding: "14px 20px",
  marginBottom: 24, maxWidth: 500, margin: "0 auto 24px",
};
const ctaButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg,#9333EA 0%,#EC4899 100%)", color: "white",
  border: "none", borderRadius: 99, padding: "13px 32px", fontSize: 14, fontWeight: 600,
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 8px 28px rgba(236,72,153,0.30)",
};
const formCardStyle: React.CSSProperties = {
  background: "white", borderRadius: 22, padding: "36px", maxWidth: 560, margin: "0 auto",
  border: "1px solid var(--sand)", boxShadow: "0 8px 32px rgba(0,0,0,0.07)", textAlign: "left",
};
const cancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid var(--sand)",
  background: "white", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600, fontSize: 14, color: "var(--muted)",
};
const publishBtnBase: React.CSSProperties = {
  flex: 2, padding: "12px", borderRadius: 12, border: "none",
  fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
};

type FormularioState = {
  showForm: boolean;
  sending: boolean;
  success: boolean;
  authError: boolean;
  form: { vinculo: string; texto: string; rating: number };
};

type FormularioAction =
  | { type: "openForm" }
  | { type: "closeForm" }
  | { type: "fieldChanged"; field: "vinculo" | "texto"; value: string }
  | { type: "ratingChanged"; value: number }
  | { type: "submitStart" }
  | { type: "submitEnd" }
  | { type: "submitSuccess" }
  | { type: "successHidden" };

const initialFormularioState: FormularioState = {
  showForm: false,
  sending: false,
  success: false,
  authError: false,
  form: { vinculo: "", texto: "", rating: 0 },
};

function formularioReducer(state: FormularioState, action: FormularioAction): FormularioState {
  switch (action.type) {
    case "openForm": return { ...state, showForm: true };
    case "closeForm": return { ...state, showForm: false };
    case "fieldChanged": return { ...state, form: { ...state.form, [action.field]: action.value } };
    case "ratingChanged": return { ...state, form: { ...state.form, rating: action.value } };
    case "submitStart": return { ...state, sending: true, authError: false };
    case "submitEnd": return { ...state, sending: false };
    case "submitSuccess": return { ...state, success: true, showForm: false, form: { vinculo: "", texto: "", rating: 0 } };
    case "successHidden": return { ...state, success: false };
    default: return state;
  }
}

export default function TestimoniosSection() {
  const [testimonios,  setTestimonios]  = useState<Testimonio[]>([]);
  const [current,      setCurrent]      = useState(0);
  const [animating,    setAnimating]    = useState(false);
  const [direction,    setDirection]    = useState<"left"|"right">("right");
  const [currentUser,  setCurrentUser]  = useState<CurrentUser | null>(null);
  const autoRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderRef = useRef<number[]>([]);
  // Distingue el paso automatico del manual: advance() y goTo() cierran su propia
  // animacion, y este efecto no debe sumar otro avance encima.
  const autoAdvanceRef = useRef(false);
  const [formulario, dispatchFormulario] = useReducer(formularioReducer, initialFormularioState);
  const { showForm, sending, success, authError, form } = formulario;

  useEffect(() => {
    const load = () => {
      const saved = sessionStorage.getItem("r65_user:v1");
      if (saved) setCurrentUser(JSON.parse(saved));
    };
    load();
    window.addEventListener("r65:authed", load);
    return () => window.removeEventListener("r65:authed", load);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/testimonios")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data) return;
        const list: Testimonio[] = data.testimonios ?? [];
        setTestimonios(list);
        orderRef.current = shuffle(list.map((_, i) => i));
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (testimonios.length <= 1) return;
    autoRef.current = setInterval(() => {
      if (animating) return;
      autoAdvanceRef.current = true;
      setDirection("right");
      setAnimating(true);
    }, 5000);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [testimonios.length, animating]);

  // El paso automatico cierra su animacion aqui, y no dentro del intervalo, para
  // que el timer de la transicion quede pendiente del mismo efecto que lo crea:
  // al desmontar a mitad de animacion se cancela solo.
  useEffect(() => {
    if (!animating || !autoAdvanceRef.current) return;
    const animTid = setTimeout(() => {
      autoAdvanceRef.current = false;
      setCurrent(prev => (prev + 1) % orderRef.current.length);
      setAnimating(false);
    }, 380);
    return () => clearTimeout(animTid);
  }, [animating]);

  const advance = (dir: "left" | "right") => {
    if (animating || testimonios.length <= 1) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(prev => {
        const len = orderRef.current.length;
        return dir === "right" ? (prev + 1) % len : (prev - 1 + len) % len;
      });
      setAnimating(false);
    }, 380);
  };

  const goTo = (idx: number) => {
    if (idx === current || animating) return;
    if (autoRef.current) clearInterval(autoRef.current);
    const dir = idx > current ? "right" : "left";
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
      autoRef.current = setInterval(() => advance("right"), 5000);
    }, 380);
  };

  const handleSubmit = async () => {
    if (!currentUser || !form.vinculo.trim() || !form.texto.trim() || form.rating === 0) return;
    dispatchFormulario({ type: "submitStart" });
    try {
      const res = await fetch("/api/testimonios", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          usuario_id: currentUser.id,
          vinculo:    form.vinculo,
          texto:      form.texto,
          rating:     form.rating,
        }),
      });
      if (res.ok) {
        dispatchFormulario({ type: "submitSuccess" });
        const refreshRes = await fetch("/api/testimonios");
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const list: Testimonio[] = data.testimonios ?? [];
          setTestimonios(list);
          orderRef.current = shuffle(list.map((_, i) => i));
        }
        setCurrent(0);
        setTimeout(() => dispatchFormulario({ type: "successHidden" }), 4000);
      }
    } catch { /* ignore */ }
    finally { dispatchFormulario({ type: "submitEnd" }); }
  };

  const realIdx = orderRef.current[current] ?? 0;
  const t = testimonios[realIdx];

  return (
    <section style={{ background: "var(--cream)", padding: "80px 40px" }}>
      <style>{`
        @keyframes slideInRight  { from { opacity:0; transform: translateX(60px);  } to { opacity:1; transform: none; } }
        @keyframes slideInLeft   { from { opacity:0; transform: translateX(-60px); } to { opacity:1; transform: none; } }
        @keyframes slideOutRight { from { opacity:1; transform: none; } to { opacity:0; transform: translateX(-60px); } }
        @keyframes slideOutLeft  { from { opacity:1; transform: none; } to { opacity:0; transform: translateX(60px);  } }
        .test-card-enter-right { animation: slideInRight  0.38s cubic-bezier(0.22,1,0.36,1) both; }
        .test-card-enter-left  { animation: slideInLeft   0.38s cubic-bezier(0.22,1,0.36,1) both; }
        .test-card-exit-right  { animation: slideOutRight 0.38s cubic-bezier(0.22,1,0.36,1) both; }
        .test-card-exit-left   { animation: slideOutLeft  0.38s cubic-bezier(0.22,1,0.36,1) both; }
        .test-dot { transition: all 0.3s ease; cursor: pointer; border-radius: 99px; }
        .test-dot.active { background: #EC4899 !important; width: 24px !important; }
        .test-nav-btn { transition: all 0.2s ease; }
        .test-nav-btn:hover { transform: scale(1.1); background: #EC4899 !important; color: white !important; border-color: #EC4899 !important; }
        .test-form-field { width: 100%; padding: 11px 14px; border-radius: 12px; border: 1.5px solid var(--sand); font-family: 'DM Sans', sans-serif; font-size: 14px; box-sizing: border-box; }
        .test-form-field:focus-visible { outline: 2px solid #EC4899; outline-offset: 2px; }
        .test-form-textarea { resize: none; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <FadeUp>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span style={badgeStyle}>
              TESTIMONIOS
            </span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.2rem,4vw,3.2rem)", color: "var(--slate)", lineHeight: 1.2 }}>
              Lo que dicen<br /><em>nuestras familias</em>
            </h2>
          </div>
        </FadeUp>

        {testimonios.length === 0 ? (
          <FadeUp>
            <p style={{ textAlign: "center", color: "var(--muted)", fontFamily: "'DM Sans', sans-serif", marginBottom: 40 }}>
              Sé el primero en compartir tu experiencia.
            </p>
          </FadeUp>
        ) : (
          <FadeUp>
            {/* Tarjeta */}
            <div style={cardWrapStyle}>
              {t && (
                <div
                  key={`${current}-${realIdx}`}
                  className={animating
                    ? (direction === "right" ? "test-card-exit-right" : "test-card-exit-left")
                    : (direction === "right" ? "test-card-enter-right" : "test-card-enter-left")}
                  style={{ background: "white", borderRadius: 22, padding: "32px 32px 28px", border: "1px solid var(--sand)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", width: "100%", boxSizing: "border-box" }}
                >
                  {/* Stars */}
                  <div style={{ display: "flex", gap: 3, marginBottom: 18 }}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={16} fill={s <= t.rating ? "#F5A623" : "none"} color={s <= t.rating ? "#F5A623" : "#DDD"} />
                    ))}
                  </div>

                  {/* Quote */}
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontStyle: "italic", color: "var(--muted)", lineHeight: 1.75, marginBottom: 24 }}>
                    &ldquo;{t.texto}&rdquo;
                  </p>

                  {/* Author */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: colors[realIdx % colors.length], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "white", fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{initials(t.nombre)}</span>
                    </div>
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15, color: "var(--slate)", margin: 0 }}>{t.nombre}</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--muted)", margin: 0 }}>{t.rol}</p>
                    </div>
                  </div>
                
              </div>

            )}</div>

          </FadeUp>
        )}

        {/* Success */}
        {success && (
          <div style={successBoxStyle}>
            <CheckCircle size={18} color="#EC4899" />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9333EA", margin: 0 }}>¡Gracias! Tu testimonio ya aparece en la página.</p>
          </div>
        )}

        {/* Botón / Formulario */}
        <FadeUp>
          <div style={{ textAlign: "center" }}>
            {!showForm ? (
              currentUser ? (
                <button type="button" onClick={() => dispatchFormulario({ type: "openForm" })}
                  style={ctaButtonStyle}>
                  Comparte tu experiencia
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--muted)", margin: 0 }}>
                    Inicia sesión para compartir tu experiencia
                  </p>
                  <button type="button" onClick={() => window.dispatchEvent(new Event("r65:open-auth"))}
                    style={ctaButtonStyle}>
                    Iniciar sesión
                  </button>
                </div>
              )
            ) : (
              <div style={formCardStyle}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--slate)", marginBottom: 8 }}>Tu experiencia</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--muted)", marginBottom: 24 }}>Se publicará de forma anónima</p>

                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>VALORACIÓN</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => dispatchFormulario({ type: "ratingChanged", value: s })}
                        aria-label={`Valorar con ${s} estrellas`}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                        <Star size={26} fill={s <= form.rating ? "#F5A623" : "none"} color={s <= form.rating ? "#F5A623" : "#DDD"} />
                      </button>
                    ))}
                  </div>
                  {form.rating === 0 && (
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#E74C3C", marginTop: 4 }}>Selecciona una valoración</p>
                  )}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="test-vinculo" style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>ROL</label>
                  <input id="test-vinculo" value={form.vinculo} onChange={e => dispatchFormulario({ type: "fieldChanged", field: "vinculo", value: e.target.value })}
                    placeholder="Ej: Hija de usuario, Usuario directo..."
                    className="test-form-field" />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label htmlFor="test-texto" style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>TU EXPERIENCIA</label>
                  <textarea id="test-texto" value={form.texto} onChange={e => dispatchFormulario({ type: "fieldChanged", field: "texto", value: e.target.value })}
                    placeholder="Cuéntanos cómo ha sido tu experiencia..."
                    rows={4}
                    className="test-form-field test-form-textarea" />
                </div>

                {authError && (
                  <p style={{ color: "#E74C3C", fontSize: 13, marginBottom: 16, fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>
                    Debes iniciar sesión para poder compartir tu experiencia.
                  </p>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" onClick={() => dispatchFormulario({ type: "closeForm" })}
                    style={cancelBtnStyle}>
                    Cancelar
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={sending || form.rating === 0 || !form.vinculo || !form.texto}
                    style={{ ...publishBtnBase, background: form.rating === 0 || !form.vinculo || !form.texto ? "#E2E8F0" : "linear-gradient(135deg,#9333EA 0%,#EC4899 100%)", color: form.rating === 0 || !form.vinculo || !form.texto ? "#94A3B8" : "white", cursor: form.rating === 0 || !form.vinculo || !form.texto ? "not-allowed" : "pointer" }}>
                    {sending ? "Enviando…" : <><Send size={14} /> Publicar</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
