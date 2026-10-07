"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CheckCircle2, X, Building2, Megaphone } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

interface Plan {
  id: string;
  nombre: string;
  precio: string;
  intervalo: string;
  caracteristicas: string[];
  scope: string;
}

const PO_MODAL_OVERLAY: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" };
const PO_MODAL_CLOSE_BTN: React.CSSProperties = { position: "absolute", top: 12, right: 12, zIndex: 10, background: "#F5F0FF", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const PO_CONTENT_BOX: React.CSSProperties = { backgroundColor: "#FAF8FF", borderRadius: "32px", width: "100%", maxWidth: "860px", padding: "30px 24px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" };
const PO_BADGE: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#7C3AED", color: "white", padding: "6px 16px", borderRadius: "99px", fontWeight: "bold", fontSize: "15px", marginBottom: "24px" };
const PO_SUCCESS_BOX: React.CSSProperties = { background: "#FDF2F8", color: "#EC4899", padding: "12px 20px", borderRadius: "12px", border: "1px solid #FBCFE8", marginBottom: "24px", display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "14px" };
const PO_ERROR_BOX: React.CSSProperties = { background: "#FFF0F0", color: "#C0392B", padding: "10px 18px", borderRadius: "10px", border: "1px solid #F5C6C6", marginBottom: "20px", fontSize: "13px", fontWeight: 500 };
const PO_VISIBILITY_BADGE: React.CSSProperties = { position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#7C3AED", color: "white", padding: "4px 14px", borderRadius: "99px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em" };
const PO_ICON_CIRCLE: React.CSSProperties = { width: "46px", height: "46px", borderRadius: "50%", backgroundColor: "#FDF2F8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px auto", color: "#7C3AED" };
const PO_FEATURES_LIST: React.CSSProperties = { listStyle: "none", padding: 0, margin: "0 0 24px 0", textAlign: "left", display: "flex", flexDirection: "column", gap: "10px", flex: 1 };

const esBanner = (nombre: string) => nombre.toLowerCase().includes("banner");

// Misma condicion que la guarda de la pantalla: sin ella, quien no puede estar
// aqui confirmaria igualmente el pago al volver de Stripe.
function esOrganizacionSinPlan() {
  const saved = sessionStorage.getItem("r65_user:v1");
  if (!saved) return false;
  try {
    const u = JSON.parse(saved);
    return u.rol === "usuario_organizacion" && !u.plan_org_id;
  } catch { return false; }
}

function guardarPlanEnSesion(planOrgId: string) {
  const raw = sessionStorage.getItem("r65_user:v1");
  if (!raw) return;
  try {
    const u = JSON.parse(raw);
    u.plan_org_id = planOrgId;
    sessionStorage.setItem("r65_user:v1", JSON.stringify(u));
    window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
  } catch {}
}

export default function PlanesOrganizacionPage() {
  const router = useRouter();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quien no es organizacion, o ya tiene plan, no llega hasta aqui: lo aparta
  // el Server Component de la ruta antes de renderizar nada.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/planes")
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const orgPlanes: Plan[] = Array.isArray(data)
          ? data.filter((p: any) => p.scope === "organizacion")
          : [];
        setPlanes(orgPlanes);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // La vuelta de Stripe va en su propio efecto para que el temporizador de la
  // redireccion quede a cargo del mismo efecto que lo crea.
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId || !esOrganizacionSinPlan()) return;

    let cancelled = false;
    let redirectTid: ReturnType<typeof setTimeout> | undefined;
    window.history.replaceState(null, "", "/planes-organizacion");

    fetch(`/api/confirm-org-plan?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.ok && data.plan_org_id) {
          redirectTid = setTimeout(() => { if (!cancelled) router.replace("/organizaciones"); }, 2500);
          setPaymentSuccess(true);
          guardarPlanEnSesion(data.plan_org_id);
        } else {
          setErrorMsg(data.error || "Error al confirmar el pago. Contacta con soporte.");
        }
      })
      .catch(() => { if (!cancelled) setErrorMsg("Error de conexión al confirmar el pago. Recarga la página."); });

    return () => {
      cancelled = true;
      clearTimeout(redirectTid);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClientSecret = useCallback(async () => {
    if (!selectedPlanId) return "";
    const res = await fetch("/api/stripe-org-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: selectedPlanId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Error al procesar el pago");
      setCheckoutOpen(false);
      throw new Error(data.error || "Error");
    }
    return data.clientSecret as string;
  }, [selectedPlanId]);

  const handleSelectPlan = (planId: string) => {
    setErrorMsg(null);
    setSelectedPlanId(planId);
    setCheckoutOpen(true);
  };

  return (
    <>
      {checkoutOpen && selectedPlanId && (
        <div style={PO_MODAL_OVERLAY}>
          <div style={{
            background: "white", borderRadius: "20px",
            width: "100%", maxWidth: "520px", maxHeight: "90vh",
            overflow: "auto", position: "relative",
          }}>
            <button
              type="button"
              onClick={() => setCheckoutOpen(false)}
              style={PO_MODAL_CLOSE_BTN}
              aria-label="Cerrar"
            >
              <X size={16} color="#475569" />
            </button>
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: "#7C3AED", minHeight: "calc(100vh - 80px)",
        padding: "40px 20px", display: "flex", justifyContent: "center",
        alignItems: "center", fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={PO_CONTENT_BOX}>

          <div style={PO_BADGE}>
            <Building2 size={16} />
            VIVE+ · Organizaciones
          </div>

          <h1 style={{
            fontSize: "clamp(1.6rem, 3vw, 2rem)", color: "#7C3AED",
            fontWeight: 700, margin: "0 0 12px 0", lineHeight: 1.2,
          }}>
            Elige el plan para tu organización
          </h1>

          <p style={{
            color: "#4A655A", fontSize: "14.5px", maxWidth: "480px",
            margin: "0 auto 32px auto", lineHeight: 1.5,
          }}>
            Activa tu ficha y dale visibilidad a tu organización en nuestra plataforma.
          </p>

          {paymentSuccess && (
            <div style={PO_SUCCESS_BOX}>
              <CheckCircle2 size={18} />
              ¡Pago completado! Tu organización ya es visible. Redirigiendo…
            </div>
          )}

          {errorMsg && (
            <div style={PO_ERROR_BOX}>
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div style={{ padding: "50px", color: "#7C3AED" }}>Cargando planes...</div>
          ) : planes.length === 0 ? (
            <p style={{ color: "#64748B", fontSize: 14 }}>
              Los planes aún no están configurados. Contacta con el administrador.
            </p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px", width: "100%", maxWidth: "760px",
            }}>
              {planes.map(plan => {
                const esPack = esBanner(plan.nombre);
                return (
                  <div key={plan.id} style={{
                    backgroundColor: "white", borderRadius: "20px",
                    padding: "24px 20px", boxShadow: esPack
                      ? "0 10px 30px rgba(27, 77, 62, 0.12)"
                      : "0 4px 15px rgba(0,0,0,0.05)",
                    border: esPack ? "2px solid #7C3AED" : "1px solid #E2E8E5",
                    position: "relative", display: "flex",
                    flexDirection: "column", textAlign: "center",
                  }}>
                    {esPack && (
                      <div style={PO_VISIBILITY_BADGE}>
                        Más visibilidad
                      </div>
                    )}

                    <div style={PO_ICON_CIRCLE}>
                      {esPack ? <Megaphone size={22} strokeWidth={1.5} /> : <Building2 size={22} strokeWidth={1.5} />}
                    </div>

                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#7C3AED", margin: "0 0 6px 0" }}>
                      {plan.nombre}
                    </h2>

                    <p style={{ color: "#6B8076", fontSize: "12px", margin: "0 0 16px 0", minHeight: "34px" }}>
                      {esPack
                        ? "Ficha completa y banner publicitario en la plataforma."
                        : "Tu organización aparece en el directorio de Vive+."}
                    </p>

                    <div style={{
                      marginBottom: "20px", display: "flex",
                      alignItems: "baseline", justifyContent: "center", gap: "4px",
                    }}>
                      <span style={{ fontSize: "30px", fontWeight: 800, color: "#7C3AED", lineHeight: 1 }}>
                        €{parseFloat(plan.precio).toFixed(0)}
                      </span>
                      <span style={{ fontSize: "12.5px", color: "#6B8076", fontWeight: 500 }}>
                        /{plan.intervalo}
                      </span>
                    </div>

                    <ul style={PO_FEATURES_LIST}>
                      {(Array.isArray(plan.caracteristicas)
                        ? plan.caracteristicas
                        : typeof plan.caracteristicas === "string"
                          ? JSON.parse(plan.caracteristicas)
                          : []
                      ).map((c: string) => (
                        <li key={c} style={{
                          display: "flex", alignItems: "flex-start", gap: "8px",
                          color: "#4A655A", fontSize: "12px", fontWeight: 500,
                        }}>
                          <CheckCircle2 size={14} color="#EC4899" style={{ flexShrink: 0, marginTop: "1px" }} />
                          <span style={{ lineHeight: 1.3 }}>{c}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan.id)}
                      style={{
                        width: "100%", padding: "12px", borderRadius: "10px",
                        fontSize: "14.5px", fontWeight: 600, cursor: "pointer",
                        transition: "opacity 0.2s ease",
                        backgroundColor: esPack ? "#7C3AED" : "white",
                        color: esPack ? "white" : "#7C3AED",
                        border: esPack ? "none" : "1.5px solid #7C3AED",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                    >
                      {esPack ? "Elegir Pack Ficha + Banner" : "Elegir Ficha Básica"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
