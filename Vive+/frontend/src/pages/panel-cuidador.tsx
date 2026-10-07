"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, CheckCircle, CreditCard, Loader2, AlertCircle, LogOut, Check, Lock, BadgeCheck } from "lucide-react";

type Plan = { id: number; nombre: string; precio: number; intervalo: string; caracteristicas: string[] };
// Lo que el Server Component saca del token: es todo lo que esta pantalla
// necesita del cuidador.
export type InitialUser = { email: string; planActivo: boolean } | null;

const PCP_STYLES = `
  @keyframes pcp-spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes pcp-pop   { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes pcp-fade  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .pcp-page { min-height: 100vh; font-family: 'DM Sans', sans-serif; position: relative; overflow: hidden;
    background: radial-gradient(circle at 10% 0%, rgba(147,51,234,0.08), transparent 45%),
                radial-gradient(circle at 90% 15%, rgba(236,72,153,0.08), transparent 40%),
                #FAF8FF; }

  .pcp-topbar { position: sticky; top: 0; z-index: 5; background: rgba(255,255,255,0.85); backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid rgba(15,23,42,0.06); }
  .pcp-topbar-inner { max-width: 760px; margin: 0 auto; padding: 0 clamp(16px,4vw,28px); height: 64px;
    display: flex; align-items: center; justify-content: space-between; }
  .pcp-brand { display: flex; align-items: center; gap: 12px; }
  .pcp-brand-icon { width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
    background: linear-gradient(135deg, #9333EA, #EC4899); display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(147,51,234,0.28); }
  .pcp-brand-title { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 700; color: #0F172A; line-height: 1.2; }
  .pcp-brand-sub { font-size: 12px; color: #64748B; }
  .pcp-logout { display: flex; align-items: center; gap: 6px; background: none; border: 1.5px solid #EDE9FE; color: #64748B;
    border-radius: 10px; padding: 8px 13px; font-size: 12.5px; font-weight: 600; font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: border-color .18s, color .18s, background .18s; }
  .pcp-logout:hover { border-color: #EC4899; color: #EC4899; background: #FDF2F8; }

  .pcp-content { max-width: 760px; margin: 0 auto; padding: clamp(28px,5vw,52px) clamp(16px,4vw,28px) 60px; position: relative; z-index: 1; }

  .pcp-hero { border-radius: 22px; padding: clamp(28px,5vw,40px) clamp(24px,5vw,40px); margin-bottom: 28px;
    background: linear-gradient(150deg, #0F2820 0%, #9333EA 45%, #2E1065 100%); position: relative; overflow: hidden;
    animation: pcp-fade .4s ease both; }
  .pcp-hero::before { content: ''; position: absolute; top: -80px; right: -60px; width: 240px; height: 240px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%); }
  .pcp-hero-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(255,255,255,0.14); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; margin-bottom: 16px; position: relative; z-index: 1; }
  .pcp-hero-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(24px,4vw,30px); font-weight: 600; color: #fff;
    margin-bottom: 8px; position: relative; z-index: 1; }
  .pcp-hero-sub { font-size: 14px; color: rgba(255,255,255,0.72); line-height: 1.6; max-width: 480px; position: relative; z-index: 1; }

  .pcp-steps { display: flex; align-items: center; gap: 6px; margin-top: 22px; position: relative; z-index: 1; flex-wrap: wrap; }
  .pcp-step { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: rgba(255,255,255,0.55); font-weight: 600; }
  .pcp-step.done { color: #fff; }
  .pcp-step-dot { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.14); flex-shrink: 0; }
  .pcp-step.done .pcp-step-dot { background: #34D399; }
  .pcp-step.active .pcp-step-dot { background: #EC4899; }
  .pcp-step-line { width: 20px; height: 1.5px; background: rgba(255,255,255,0.22); }

  .pcp-card { background: #fff; border-radius: 18px; border: 1px solid rgba(15,23,42,0.06);
    box-shadow: 0 2px 10px rgba(15,23,42,0.04); padding: clamp(22px,4vw,32px); animation: pcp-fade .45s .05s ease both; }

  .pcp-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
  .pcp-card-head-title { font-size: 17px; font-weight: 700; color: #0F172A; font-family: 'DM Sans', sans-serif; }

  .pcp-error { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 11px 14px; color: #991B1B;
    font-size: 13px; margin-bottom: 18px; display: flex; align-items: flex-start; gap: 8px; }

  .pcp-plans { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); margin-bottom: 26px; }
  .pcp-plan { border-radius: 14px; border: 2px solid #ECE9F4; padding: 20px 20px 18px; cursor: pointer; background: #fff;
    transition: border-color .18s, transform .18s, box-shadow .18s; position: relative; }
  .pcp-plan:hover { transform: translateY(-2px); border-color: #D8B4FE; box-shadow: 0 8px 20px rgba(147,51,234,0.10); }
  .pcp-plan.selected { border-color: #9333EA; background: linear-gradient(180deg, #FAF5FF, #FFFFFF);
    box-shadow: 0 8px 24px rgba(147,51,234,0.14); }
  .pcp-plan-radio { position: absolute; top: 18px; right: 18px; width: 20px; height: 20px; border-radius: 50%;
    border: 2px solid #D8CFF0; display: flex; align-items: center; justify-content: center; transition: border-color .18s, background .18s; }
  .pcp-plan.selected .pcp-plan-radio { border-color: #9333EA; background: #9333EA; }
  .pcp-plan-nombre { font-weight: 700; font-size: 15px; color: #0F172A; margin-bottom: 6px; padding-right: 28px; }
  .pcp-plan-precio { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700; color: #9333EA; margin-bottom: 12px; }
  .pcp-plan-precio span { font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500; color: #64748B; }
  .pcp-plan-feat { display: flex; align-items: flex-start; gap: 6px; font-size: 12.5px; color: #475569; margin-bottom: 6px; line-height: 1.4; }

  .pcp-pay-btn { width: 100%; padding: 15px 0; border-radius: 12px; border: none; color: #fff; font-family: 'DM Sans', sans-serif;
    font-weight: 700; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;
    background: linear-gradient(135deg, #9333EA, #EC4899); box-shadow: 0 4px 14px rgba(147,51,234,0.28);
    transition: opacity .18s, transform .18s, box-shadow .18s; }
  .pcp-pay-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(147,51,234,0.34); }
  .pcp-pay-btn:disabled { background: #E4D9FB; cursor: not-allowed; box-shadow: none; }

  .pcp-trust { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 14px; font-size: 11.5px; color: #94A3B8; }

  .pcp-success-icon { width: 76px; height: 76px; border-radius: 50%; background: #F0FDF4; border: 3px solid #BBF7D0;
    display: flex; align-items: center; justify-content: center; margin: 0 auto 22px; animation: pcp-pop .5s cubic-bezier(0.34,1.56,0.64,1) both; }
  .pcp-badge { display: inline-flex; align-items: center; gap: 6px; background: #ECFDF5; color: #059669; border-radius: 99px;
    padding: 7px 16px; font-size: 13px; font-weight: 700; }
  .pcp-continue-btn { margin-top: 22px; padding: 13px 28px; border-radius: 12px; border: none; color: #fff;
    font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer;
    background: linear-gradient(135deg, #9333EA, #EC4899); box-shadow: 0 4px 14px rgba(147,51,234,0.26);
    transition: transform .18s, box-shadow .18s; }
  .pcp-continue-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(147,51,234,0.32); }

  @media (max-width: 520px) { .pcp-plans { grid-template-columns: 1fr; } }
`;

export default function PanelCuidadorPage({ initialUser }: { initialUser: InitialUser }) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [planes,      setPlanes]      = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [paying,      setPaying]      = useState(false);
  // Se sabe desde el primer render si venimos de Stripe, asi que la pantalla de
  // confirmacion no aparece un fotograma tarde.
  const [confirming,  setConfirming]  = useState(() => sessionId !== null);
  const [error,       setError]       = useState<string | null>(null);
  const [confirmed,   setConfirmed]   = useState(false);

  // El plan queda activo si ya lo estaba al cargar la pagina o si acaba de
  // confirmarse el pago: no hace falta guardarlo aparte.
  const planActivo = confirmed || !!initialUser?.planActivo;

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    fetch(`/api/confirmar-pago-medico?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.ok) {
          setConfirmed(true);
          // El servidor reemite y fija la cookie HttpOnly en la respuesta de confirmar-pago-medico.
          const storedRaw = sessionStorage.getItem("r65_user:v1");
          if (storedRaw) {
            const stored = JSON.parse(storedRaw);
            sessionStorage.setItem("r65_user:v1", JSON.stringify({ ...stored, plan_activo: true }));
          }
          window.history.replaceState({}, "", "/panel-cuidador");
        } else {
          setError(data.error ?? "Error al confirmar el pago");
        }
      })
      .catch(() => { if (!cancelled) setError("Error de conexión al confirmar el pago"); })
      .finally(() => { if (!cancelled) setConfirming(false); });

    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => {
    if (planActivo) return;
    let cancelled = false;
    fetch("/api/planes")
      .then(r => r.json())
      .then((data: (Plan & { scope?: string })[]) => {
        if (cancelled) return;
        const medicoPlanes = Array.isArray(data) ? data.filter(p => p.scope === "medico") : [];
        setPlanes(medicoPlanes);
        if (medicoPlanes.length > 0) setSelectedPlan(medicoPlanes[0].id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [planActivo]);

  const handlePagar = async () => {
    if (!selectedPlan) return;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/iniciar-pago-medico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al iniciar el pago"); return; }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Error de conexión");
    } finally {
      setPaying(false);
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("r65_authed");
    sessionStorage.removeItem("r65_user:v1");
    // La cookie es HttpOnly: solo el servidor puede borrarla.
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
    window.location.href = "/";
  };

  const handleContinuar = () => {
    window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
    window.location.href = "/";
  };

  if (confirming) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8FF" }}>
        <Loader2 size={32} style={{ color: "#9333EA", animation: "pcp-spin 1s linear infinite" }} />
        <style>{PCP_STYLES}</style>
      </div>
    );
  }

  return (
    <div className="pcp-page">
      <style>{PCP_STYLES}</style>

      <div className="pcp-topbar">
        <div className="pcp-topbar-inner">
          <div className="pcp-brand">
            <div className="pcp-brand-icon"><Shield size={20} color="#fff" /></div>
            <div>
              <div className="pcp-brand-title">Panel del profesional</div>
              {initialUser && <div className="pcp-brand-sub">{initialUser.email}</div>}
            </div>
          </div>
          <button type="button" className="pcp-logout" onClick={handleLogout}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </div>

      <div className="pcp-content">
        {planActivo ? (
          <div className="pcp-card" style={{ textAlign: "center" }}>
            <div className="pcp-success-icon">
              <CheckCircle size={38} color="#16A34A" />
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
              {confirmed ? "¡Pago confirmado!" : "Tu plan está activo"}
            </div>
            <p style={{ color: "#64748B", fontSize: 15, maxWidth: 420, margin: "0 auto 20px", lineHeight: 1.6 }}>
              {confirmed
                ? "Tu perfil profesional ya está activo. A partir de ahora aparecerás en la página de Salud y Bienestar."
                : "Tu perfil profesional está activo y visible en la página de Salud y Bienestar."}
            </p>
            <div className="pcp-badge">
              <BadgeCheck size={14} /> Verificado
            </div>
            <div>
              <button type="button" className="pcp-continue-btn" onClick={handleContinuar}>
                Ir a la plataforma →
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="pcp-hero">
              <div className="pcp-hero-icon"><Shield size={24} color="#fff" /></div>
              <div className="pcp-hero-title">Ya casi estás — activa tu plan</div>
              <div className="pcp-hero-sub">
                Tu documentación ha sido aprobada. Elige tu plan profesional para completar tu perfil
                y empezar a aparecer en la página de Salud y Bienestar.
              </div>
              <div className="pcp-steps">
                <div className="pcp-step done"><span className="pcp-step-dot"><Check size={12} color="#0F2820" /></span>Cuenta creada</div>
                <div className="pcp-step-line" />
                <div className="pcp-step done"><span className="pcp-step-dot"><Check size={12} color="#0F2820" /></span>Documentación aprobada</div>
                <div className="pcp-step-line" />
                <div className="pcp-step active"><span className="pcp-step-dot">3</span>Activar plan</div>
              </div>
            </div>

            <div className="pcp-card">
              <div className="pcp-card-head">
                <CreditCard size={19} color="#9333EA" />
                <div className="pcp-card-head-title">Elige tu plan profesional</div>
              </div>

              {error && (
                <div className="pcp-error">
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                </div>
              )}

              {planes.length === 0 ? (
                <div style={{ color: "#94A3B8", fontSize: 14, marginBottom: 20 }}>Cargando planes…</div>
              ) : (
                <div className="pcp-plans">
                  {planes.map(plan => (
                    <div
                      key={plan.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedPlan(plan.id)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedPlan(plan.id); } }}
                      className={`pcp-plan ${selectedPlan === plan.id ? "selected" : ""}`}
                    >
                      <div className="pcp-plan-radio">
                        {selectedPlan === plan.id && <Check size={12} color="#fff" />}
                      </div>
                      <div className="pcp-plan-nombre">{plan.nombre}</div>
                      <div className="pcp-plan-precio">
                        {plan.precio}€<span>/{plan.intervalo ?? "mes"}</span>
                      </div>
                      {Array.isArray(plan.caracteristicas) && plan.caracteristicas.slice(0, 4).map((c) => (
                        <div key={c} className="pcp-plan-feat">
                          <Check size={13} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} /> {c}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="pcp-pay-btn"
                onClick={handlePagar}
                disabled={paying || !selectedPlan}
              >
                {paying
                  ? <><Loader2 size={16} style={{ animation: "pcp-spin 1s linear infinite" }} /> Redirigiendo a Stripe…</>
                  : "Activar plan y pagar →"
                }
              </button>
              <div className="pcp-trust">
                <Lock size={11} /> Pago seguro procesado por Stripe
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
