"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { User, Crown, CheckCircle2, X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { useRouter, useSearchParams } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

interface Plan {
  id: string;
  nombre: string;
  precio: string;
  intervalo: string;
  caracteristicas: string[];
}

const PL_MODAL_OVERLAY: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(8px, 3vw, 16px)', overscrollBehavior: 'contain' };
const PL_MODAL_BOX: React.CSSProperties = { background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto', position: 'relative', overscrollBehavior: 'contain' };
const PL_MODAL_CLOSE_BTN: React.CSSProperties = { position: 'absolute', top: 12, right: 12, zIndex: 10, background: '#F5F0FF', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const PL_CONTENT_BOX: React.CSSProperties = { backgroundColor: '#FAF8FF', borderRadius: '32px', width: '100%', maxWidth: '800px', padding: '30px 24px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const PL_BADGE: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#7C3AED', color: 'white', padding: '6px 16px', borderRadius: '99px', fontWeight: 'bold', fontSize: '15px', marginBottom: '24px' };
const PL_BADGE_ICON: React.CSSProperties = { width: 20, height: 20, borderRadius: '50%', background: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' };
const PL_SUCCESS_BOX: React.CSSProperties = { background: '#FDF2F8', color: '#EC4899', padding: '12px 20px', borderRadius: '12px', border: '1px solid #FBCFE8', marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' };
const PL_PLAN_CARD_BASE: React.CSSProperties = { backgroundColor: 'white', borderRadius: '20px', padding: '24px 20px', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', textAlign: 'center' };
const PL_POPULAR_BADGE: React.CSSProperties = { position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#7C3AED', color: 'white', padding: '4px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' };
const PL_ICON_CIRCLE: React.CSSProperties = { width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#7C3AED' };
const PL_FEATURES_LIST: React.CSSProperties = { listStyle: 'none', padding: 0, margin: '0 0 24px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 };

export default function PlanesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  // Se sabe en el primer render si venimos de pagar, y se congela: la URL se
  // limpia enseguida, pero la pantalla de exito tiene que quedarse.
  const [paymentSuccess] = useState(() => sessionId !== null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (sessionId) {
      window.history.replaceState(null, '', '/planes');
      fetch(`/api/confirm-plan?session_id=${encodeURIComponent(sessionId)}`)
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          if (data.ok && data.plan_id) {
            const saved = sessionStorage.getItem("r65_user:v1");
            if (saved) {
              try {
                const u = JSON.parse(saved);
                u.plan_id = data.plan_id;
                sessionStorage.setItem("r65_user:v1", JSON.stringify(u));
                window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
              } catch {}
            }
          }
        })
        .catch(() => {});
    }

    const intent = sessionStorage.getItem('r65_checkout_intent');
    if (intent && sessionStorage.getItem('r65_user:v1')) {
      sessionStorage.removeItem('r65_checkout_intent');
      setSelectedPlanId(intent);
      setCheckoutOpen(true);
    }

    fetch('/api/planes')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        const filteredPlanes = Array.isArray(data) ? data.filter((p: any) => p.nombre !== 'Plan_pro_medicos' && p.nombre !== 'Plan ficha basica' && p.scope !== 'organizacion') : [];
        setPlanes(filteredPlanes);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        console.error("Error cargando planes:", err);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => {
    if (checkoutOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [checkoutOpen]);

  const fetchClientSecret = useCallback(async () => {
    if (!selectedPlanId) return '';
    const res = await fetch('/api/stripe-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: selectedPlanId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al procesar la suscripción');
    return data.clientSecret as string;
  }, [selectedPlanId]);

  const handleSubscribe = (planId: string, planName: string) => {
    if (planName.toLowerCase() !== 'pro') return;
    if (!sessionStorage.getItem('r65_user:v1')) {
      sessionStorage.setItem('r65_checkout_intent', planId);
      sessionStorage.setItem('r65_open_auth', '1');
      router.push('/');
      return;
    }
    setSelectedPlanId(planId);
    setCheckoutOpen(true);
  };

  return (
    <>
      {checkoutOpen && selectedPlanId && (
        <div
          style={PL_MODAL_OVERLAY}
          onWheel={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
        >
          <div style={PL_MODAL_BOX}>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setCheckoutOpen(false)}
              style={PL_MODAL_CLOSE_BTN}
            >
              <X size={16} color="#475569" />
            </button>
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ fetchClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: '#7C3AED', 
        minHeight: 'calc(100vh - 80px)',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'DM Sans', sans-serif"
      }}>
        

        <div style={PL_CONTENT_BOX}>


          <div style={PL_BADGE}>
            <span style={PL_BADGE_ICON}>
              <HeartIcon size={12} />
            </span>
            VIVE +
          </div>

          <h1 style={{
            fontSize: 'clamp(1.7rem, 3vw, 2rem)',
            color: '#7C3AED',
            fontWeight: 700,
            margin: '0 0 12px 0',
            lineHeight: 1.2
          }}>
            Elige el plan que<br />mejor se adapta a ti
          </h1>

          {paymentSuccess && (
            <div style={PL_SUCCESS_BOX}>
              <CheckCircle2 size={18} />
              ¡Pago completado con éxito! Tu plan ha sido actualizado a Pro.
            </div>
          )}

          <p style={{
            color: '#4A655A',
            fontSize: '14.5px',
            maxWidth: '460px',
            margin: '0 auto 40px auto',
            lineHeight: 1.5
          }}>
            Conéctate con tu comunidad, cuida tu salud<br />y accede a beneficios exclusivos.
          </p>

          {loading ? (
            <div style={{ padding: '50px', color: '#7C3AED' }}>Cargando planes...</div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              width: '100%',
              maxWidth: '720px'
            }}>
              {planes.map(plan => {
                const isPro = plan.nombre.toLowerCase() === 'pro';
                return (
                  <div key={plan.id} style={{
                    ...PL_PLAN_CARD_BASE,
                    boxShadow: isPro ? '0 10px 30px rgba(27, 77, 62, 0.1)' : '0 4px 15px rgba(0,0,0,0.05)',
                    border: isPro ? '2px solid #7C3AED' : '1px solid #E2E8E5',
                  }}>

                    {isPro && (
                      <div style={PL_POPULAR_BADGE}>
                        Más popular
                      </div>
                    )}

                    <div style={PL_ICON_CIRCLE}>
                      {isPro ? <Crown size={22} strokeWidth={1.5} /> : <User size={22} strokeWidth={1.5} />}
                    </div>

                    <h2 style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#7C3AED',
                      margin: '0 0 6px 0'
                    }}>
                      {plan.nombre}
                    </h2>

                    <p style={{
                      color: '#6B8076',
                      fontSize: '12px',
                      margin: '0 0 16px 0',
                      minHeight: '34px'
                    }}>
                      {isPro 
                        ? 'Accede a todas las funciones y beneficios exclusivos.' 
                        : 'Conéctate con tu comunidad y accede a funciones básicas.'}
                    </p>

                    <div style={{
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ fontSize: '30px', fontWeight: 800, color: '#7C3AED', lineHeight: 1 }}>
                        €{parseFloat(plan.precio).toString().replace('.', ',')}
                      </span>
                      <span style={{ fontSize: '12.5px', color: '#6B8076', fontWeight: 500 }}>
                        /{plan.intervalo}
                      </span>
                    </div>

                    <ul style={PL_FEATURES_LIST}>
                      {(Array.isArray(plan.caracteristicas) ? plan.caracteristicas : typeof plan.caracteristicas === 'string' ? JSON.parse(plan.caracteristicas) : []).map((caract: string) => (
                        <li key={caract} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          color: '#4A655A',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          <CheckCircle2 size={14} color="#EC4899" style={{ flexShrink: 0, marginTop: '1px' }} />
                          <span style={{ lineHeight: 1.3 }}>{caract}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => handleSubscribe(plan.id, plan.nombre)}
                      style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      fontSize: '14.5px',
                      fontWeight: 600,
                      cursor: isPro ? 'pointer' : 'default',
                      transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease',
                      backgroundColor: isPro ? '#7C3AED' : 'transparent',
                      color: isPro ? 'white' : '#7C3AED',
                      border: isPro ? 'none' : '1px solid #7C3AED',
                      opacity: isPro ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => {
                      if (isPro) {
                        e.currentTarget.style.opacity = '0.9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isPro) {
                        e.currentTarget.style.opacity = '1';
                      }
                    }}
                    >
                      {isPro ? 'Elegir Pro' : 'Plan actual'}
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

function HeartIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  );
}