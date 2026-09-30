"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronRight, Heart, Shield } from "lucide-react";

const STEPS = [
  { label: "Beneficiario", icon: Heart },
  { label: "Dependencia", icon: Shield },
];

const SITUACIONES = ["Vive solo/a", "Con familia", "Con cónyuge", "En residencia", "Con cuidador externo"];
const DISCAPACIDADES = [
  "Movilidad reducida",
  "Discapacidad visual",
  "Discapacidad auditiva",
  "Deterioro cognitivo / demencia",
  "Enfermedad crónica",
  "Problemas de comunicación",
  "Dependencia emocional / aislamiento",
];

export default function OnboardingPage() {
  const { push } = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [beneficiario, setBeneficiario] = useState({ nombre: "", edad: "", ciudad: "", situacion_convivencial: "" });
  const [dependencia, setDependencia] = useState({ autonomia: "", discapacidades: [] as string[] });

  const dismiss = async () => {
    if (!userId) { push("/"); return; }
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, step: "dismiss", data: {} }),
    }).catch(() => {});
    const saved = sessionStorage.getItem("r65_user:v1");
    if (saved) {
      const u = JSON.parse(saved);
      u.onboarding_completado = true;
      sessionStorage.setItem("r65_user:v1", JSON.stringify(u));
    }
    push("/");
  };

  useEffect(() => {
    const authed = sessionStorage.getItem("r65_authed") === "true";
    if (!authed) { push("/"); return; }
    try {
      const u = JSON.parse(sessionStorage.getItem("r65_user:v1") ?? "{}");
      if (!u?.id) { push("/"); return; }
      if (u.rol !== "intermediario") { push("/"); return; }
      setUserId(Number(u.id));
      if (u.onboarding_completado) { push("/"); return; }
    } catch { push("/"); }
  }, [push]);

  const save = async (stepNum: number, data: Record<string, unknown>) => {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, step: stepNum, data }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Error al guardar"); return false; }
      if (d.completado) {
        const saved = sessionStorage.getItem("r65_user:v1");
        if (saved) {
          const u = JSON.parse(saved);
          u.onboarding_completado = true;
          sessionStorage.setItem("r65_user:v1", JSON.stringify(u));
        }
      }
      return true;
    } catch { setError("Error de conexión"); return false; }
    finally { setSaving(false); }
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiario.nombre || !beneficiario.edad || !beneficiario.ciudad || !beneficiario.situacion_convivencial) {
      setError("Rellena todos los campos."); return;
    }
    const ok = await save(1, { ...beneficiario, edad: Number(beneficiario.edad) });
    if (ok) setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dependencia.autonomia) { setError("Selecciona el nivel de autonomía."); return; }
    await save(2, dependencia);
    push("/");
  };

  const toggleDiscapacidad = (d: string) => {
    setDependencia(prev => ({
      ...prev,
      discapacidades: prev.discapacidades.includes(d)
        ? prev.discapacidades.filter(x => x !== d)
        : [...prev.discapacidades, d],
    }));
  };

  if (!userId) return null;

  return (
    <>
      <style>{`
        .ob-root { min-height: 100vh; background: linear-gradient(135deg, #F8F4FF 0%, #FDF2F8 100%); display: flex; align-items: center; justify-content: center; padding: 40px 16px; font-family: 'DM Sans', sans-serif; }
        .ob-card { background: white; border-radius: 28px; box-shadow: 0 8px 48px rgba(147,51,234,0.10); max-width: 540px; width: 100%; padding: 48px 44px; }
        @media(max-width:560px){ .ob-card { padding: 32px 20px; } }
        .ob-stepper { display: flex; gap: 0; margin-bottom: 40px; }
        .ob-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; }
        .ob-step:not(:last-child)::after { content:''; position:absolute; top:18px; left:calc(50% + 20px); right:calc(-50% + 20px); height:2px; background:#E2D9F3; }
        .ob-step.done:not(:last-child)::after { background:#9333EA; }
        .ob-step-dot { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #E2D9F3; background:white; color:#C4B5FD; transition:all .3s; }
        .ob-step.active .ob-step-dot { border-color:#9333EA; background:#9333EA; color:white; }
        .ob-step.done .ob-step-dot { border-color:#9333EA; background:#9333EA; color:white; }
        .ob-step-label { font-size:11px; color:#94A3B8; font-weight:600; letter-spacing:.04em; text-transform:uppercase; }
        .ob-step.active .ob-step-label { color:#9333EA; }
        .ob-step.done .ob-step-label { color:#9333EA; }
        .ob-title { font-family:'Cormorant Garamond',serif; font-size:30px; font-weight:700; color:#1E293B; margin:0 0 6px; }
        .ob-sub { font-size:14px; color:#64748B; margin:0 0 28px; }
        .ob-field { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
        .ob-label { font-size:13px; font-weight:600; color:#475569; }
        .ob-input { border:1.5px solid #E2E8F0; border-radius:10px; padding:11px 14px; font-size:15px; font-family:'DM Sans',sans-serif; color:#1E293B; outline:none; transition:border .2s; }
        .ob-input:focus { border-color:#9333EA; }
        .ob-select { border:1.5px solid #E2E8F0; border-radius:10px; padding:11px 14px; font-size:15px; font-family:'DM Sans',sans-serif; color:#1E293B; outline:none; background:white; appearance:none; cursor:pointer; }
        .ob-select:focus { border-color:#9333EA; }
        .ob-error { background:#FFF1F2; color:#E11D48; font-size:13px; border-radius:8px; padding:10px 14px; margin-bottom:16px; }
        .ob-btn { width:100%; padding:14px; border-radius:12px; background:linear-gradient(135deg,#9333EA 0%,#EC4899 100%); color:white; font-size:15px; font-weight:700; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:8px; transition:opacity .2s; }
        .ob-btn:disabled { opacity:.6; cursor:default; }
        .ob-chips { display:flex; flex-wrap:wrap; gap:8px; }
        .ob-chip { padding:7px 14px; border-radius:99px; border:1.5px solid #E2E8F0; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; color:#475569; background:white; }
        .ob-chip.selected { border-color:#9333EA; background:#F3E8FF; color:#9333EA; }
        .ob-autonomia { display:flex; gap:12px; margin-bottom:16px; }
        .ob-autonomia-btn { flex:1; padding:16px 12px; border-radius:14px; border:2px solid #E2E8F0; cursor:pointer; text-align:center; transition:all .2s; background:white; }
        .ob-autonomia-btn.selected { border-color:#9333EA; background:#F3E8FF; }
        .ob-autonomia-btn .ob-aut-title { font-size:15px; font-weight:700; color:#1E293B; margin-bottom:4px; }
        .ob-autonomia-btn.selected .ob-aut-title { color:#9333EA; }
        .ob-autonomia-btn .ob-aut-desc { font-size:12px; color:#94A3B8; }
        .ob-skip { text-align:center; margin-top:16px; }
        .ob-skip button { background:none; border:none; color:#94A3B8; font-size:13px; cursor:pointer; font-family:'DM Sans',sans-serif; text-decoration:underline; }
      `}</style>

      <div className="ob-root">
        <div className="ob-card">
          <div className="ob-stepper">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const state = step > i + 1 ? "done" : step === i + 1 ? "active" : "";
              return (
                <div key={s.label} className={`ob-step ${state}`}>
                  <div className="ob-step-dot">
                    {step > i + 1 ? <CheckCircle size={16} /> : <Icon size={16} />}
                  </div>
                  <span className="ob-step-label">{s.label}</span>
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <form onSubmit={handleStep1}>
              <h1 className="ob-title">Datos del beneficiario</h1>
              <p className="ob-sub">La persona mayor a quien va dirigido el cuidado.</p>
              {error && <div className="ob-error">{error}</div>}
              <div className="ob-field">
                <label className="ob-label" htmlFor="beneficiario-nombre">Nombre completo</label>
                <input id="beneficiario-nombre" className="ob-input" value={beneficiario.nombre} onChange={e => setBeneficiario(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre de la persona mayor" />
              </div>
              <div className="ob-field">
                <label className="ob-label" htmlFor="beneficiario-edad">Edad</label>
                <input id="beneficiario-edad" className="ob-input" type="number" min="55" max="110" value={beneficiario.edad} onChange={e => setBeneficiario(p => ({ ...p, edad: e.target.value }))} placeholder="Edad" />
              </div>
              <div className="ob-field">
                <label className="ob-label" htmlFor="beneficiario-ciudad">Ciudad</label>
                <input id="beneficiario-ciudad" className="ob-input" value={beneficiario.ciudad} onChange={e => setBeneficiario(p => ({ ...p, ciudad: e.target.value }))} placeholder="Ciudad de residencia" />
              </div>
              <div className="ob-field">
                <label className="ob-label" htmlFor="beneficiario-situacion">Situación de convivencia</label>
                <select id="beneficiario-situacion" className="ob-select" value={beneficiario.situacion_convivencial} onChange={e => setBeneficiario(p => ({ ...p, situacion_convivencial: e.target.value }))}>
                  <option value="">Selecciona...</option>
                  {SITUACIONES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" className="ob-btn" disabled={saving}>
                {saving ? "Guardando..." : <>Siguiente <ChevronRight size={18} /></>}
              </button>
              <div className="ob-skip"><button type="button" onClick={dismiss}>Completar más tarde</button></div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2}>
              <h1 className="ob-title">Nivel de dependencia</h1>
              <p className="ob-sub">Nos ayuda a conectarte con los servicios más adecuados.</p>
              {error && <div className="ob-error">{error}</div>}
              <div className="ob-field">
                <span className="ob-label" id="autonomia-label">Nivel de autonomía</span>
                <div className="ob-autonomia" role="group" aria-labelledby="autonomia-label">
                  <button type="button" className={`ob-autonomia-btn ${dependencia.autonomia === "autonomo" ? "selected" : ""}`} onClick={() => setDependencia(p => ({ ...p, autonomia: "autonomo" }))}>
                    <div className="ob-aut-title">Autónomo/a</div>
                    <div className="ob-aut-desc">Se vale por sí mismo/a en el día a día</div>
                  </button>
                  <button type="button" className={`ob-autonomia-btn ${dependencia.autonomia === "no_autonomo" ? "selected" : ""}`} onClick={() => setDependencia(p => ({ ...p, autonomia: "no_autonomo" }))}>
                    <div className="ob-aut-title">No autónomo/a</div>
                    <div className="ob-aut-desc">Requiere apoyo para actividades cotidianas</div>
                  </button>
                </div>
              </div>
              <div className="ob-field">
                <span className="ob-label" id="discapacidades-label">Condiciones específicas (opcional)</span>
                <div className="ob-chips" style={{ marginTop: 4 }} role="group" aria-labelledby="discapacidades-label">
                  {DISCAPACIDADES.map(d => (
                    <button type="button" key={d} className={`ob-chip ${dependencia.discapacidades.includes(d) ? "selected" : ""}`} onClick={() => toggleDiscapacidad(d)}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="ob-btn" disabled={saving}>
                {saving ? "Guardando..." : <>Finalizar <CheckCircle size={18} /></>}
              </button>
              <div className="ob-skip"><button type="button" onClick={dismiss}>Completar más tarde</button></div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
