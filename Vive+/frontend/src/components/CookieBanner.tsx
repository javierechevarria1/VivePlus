"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  guardarConsentimiento,
  parsearConsentimiento,
  snapshotConsentimiento,
  snapshotServidor,
  subscribirConsentimiento,
} from "@/frontend/src/lib/consentimiento";

export default function CookieBanner() {
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState({ necesarias: true as const, analiticas: false, marketing: false });
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Se pregunta a todo el que entra, tenga cuenta o no. Antes solo salía si
  // habías iniciado sesión, así que un visitante anónimo navegaba sin ver
  // ningún aviso — y es justo antes de tener cuenta cuando hay que preguntarlo.
  //
  // El banner se muestra por lo que hay guardado, no por un estado propio: al
  // responder, la elección queda escrita y el banner desaparece solo.
  const guardado = useSyncExternalStore(
    subscribirConsentimiento,
    snapshotConsentimiento,
    snapshotServidor
  );

  // En el render de hidratación el valor que llega es el del servidor, que
  // siempre está vacío: quien ya respondió vuelve a contar ahí como «sin
  // responder». Abrir el modal en ese render lo hacía aparecer en cada recarga
  // para cerrarse solo al llegar el valor real del navegador. Se espera a estar
  // montado, que es cuando ya se ha leído el almacenamiento de verdad.
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    setMontado(true);
  }, []);

  const visible = montado && parsearConsentimiento(guardado) === null;

  // El diálogo se abre y se cierra, pero NO se desmonta.
  //
  // Un <dialog> abierto con showModal() bloquea el scroll de la página que hay
  // detrás, y ese bloqueo solo lo levanta close(). Si el elemento desaparece
  // del DOM antes de cerrarlo, el bloqueo se queda puesto: la página deja de
  // hacer scroll y encima no hay ningún banner a la vista que lo explique.
  //
  // Pasaba justo aquí: en el primer render el consentimiento todavía se lee
  // como «sin responder», se abría el modal, y al llegar el valor real de
  // quien ya había respondido el componente se quitaba de en medio sin cerrarlo.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (visible && !dialog.open) dialog.showModal();
    if (!visible && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [visible]);

  // Se guarda por el helper compartido, que además avisa a quien depende del
  // consentimiento para que se aplique ya y no en la siguiente recarga. No
  // hace falta cerrar el banner a mano: al quedar respondido, deja de mostrarse.
  const accept = () => {
    guardarConsentimiento({ necesarias: true, analiticas: true, marketing: true });
  };

  const reject = () => {
    guardarConsentimiento({ necesarias: true, analiticas: false, marketing: false });
  };

  const savePrefs = () => {
    guardarConsentimiento({ necesarias: true, analiticas: prefs.analiticas, marketing: prefs.marketing });
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, -48%) scale(0.96); opacity: 0; }
          to   { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
        }
        /* Cerrado no se ve ni ocupa. Lo hace ya el navegador por defecto, pero
           aquí se deja explícito porque de ello depende que la página no se
           quede bloqueada. */
        dialog.cookie-banner:not([open]) { display: none; }
        .cookie-banner {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: calc(100% - 48px);
          max-width: 780px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 48px rgba(0,0,0,0.14), 0 2px 12px rgba(0,0,0,0.08);
          z-index: 50;
          animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
          border: 1px solid rgba(147,51,234,0.10);
          padding: 0;
          overflow: hidden;
        }
        .cookie-banner::backdrop {
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(3px);
        }
        .cookie-btn-accept {
          background: var(--teal, #9333EA);
          color: white;
          border: none;
          border-radius: 99px;
          padding: 11px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .cookie-btn-accept:hover { background: #14403a; transform: translateY(-1px); }
        .cookie-btn-reject {
          background: transparent;
          color: var(--teal, #9333EA);
          border: 2px solid rgba(147,51,234,0.20);
          border-radius: 99px;
          padding: 11px 24px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .cookie-btn-reject:hover { border-color: var(--teal,#9333EA); background: rgba(147,51,234,0.04); }
        .cookie-btn-config {
          background: none;
          border: none;
          color: rgba(0,0,0,0.4);
          font-size: 13px;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.2s;
        }
        .cookie-btn-config:hover { color: var(--teal, #9333EA); }
        .cookie-toggle {
          position: relative;
          width: 40px;
          height: 22px;
          flex-shrink: 0;
        }
        .cookie-toggle input { opacity: 0; width: 0; height: 0; }
        .cookie-toggle-slider {
          position: absolute;
          inset: 0;
          background: #ddd;
          border-radius: 99px;
          cursor: pointer;
          transition: 0.2s;
        }
        .cookie-toggle-slider::before {
          content: "";
          position: absolute;
          width: 16px; height: 16px;
          left: 3px; bottom: 3px;
          background: white;
          border-radius: 50%;
          transition: 0.2s;
        }
        .cookie-toggle input:checked + .cookie-toggle-slider { background: var(--teal, #9333EA); }
        .cookie-toggle input:checked + .cookie-toggle-slider::before { transform: translateX(18px); }
        .cookie-toggle input:disabled + .cookie-toggle-slider { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <dialog
        ref={dialogRef}
        className="cookie-banner"
        aria-label="Aviso de cookies"
        onCancel={(e) => { e.preventDefault(); reject(); }}
      >
        <div style={{ height: 4, background: "linear-gradient(90deg, var(--teal,#9333EA), var(--gold,#c9923a))" }} />

        <div style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
            <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>🍪</span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 500, color: "#1a2e2b", margin: "0 0 4px" }}>
                Usamos cookies
              </h3>
              <p style={{ fontSize: 14, color: "rgba(0,0,0,0.55)", lineHeight: 1.6, margin: 0 }}>
                Utilizamos cookies propias y de terceros para mejorar tu experiencia. Puedes aceptarlas todas, rechazar las opcionales o{" "}
                <button type="button" className="cookie-btn-config" onClick={() => setShowDetails(!showDetails)}>
                  personalizar tu elección
                </button>
                . Más info en nuestra{" "}
                <Link href="/cookies" style={{ color: "var(--teal,#9333EA)", fontSize: 13 }}>
                  política de cookies
                </Link>
                .
              </p>
            </div>
          </div>

          {showDetails && (
            <div style={{ background: "#FFF5F9", borderRadius: 12, padding: "16px 18px", marginBottom: 16, border: "1px solid rgba(147,51,234,0.10)" }}>
              {[
                { key: "necesarias", label: "Necesarias", desc: "Imprescindibles para el funcionamiento de la web.", disabled: true },
                { key: "analiticas", label: "Analíticas", desc: "Nos ayudan a entender cómo usas la web (ej. Google Analytics)." },
                { key: "marketing", label: "Marketing", desc: "Permiten mostrarte publicidad relevante en otras webs." },
              ].map(({ key, label, desc, disabled }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: key !== "marketing" ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2e2b" }}>{label}</div>
                    <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", marginTop: 2 }}>{desc}</div>
                  </div>
                  <label htmlFor={`cookie-toggle-${key}`} aria-label={label} className="cookie-toggle">
                    <input
                      id={`cookie-toggle-${key}`}
                      type="checkbox"
                      checked={prefs[key as keyof typeof prefs]}
                      disabled={disabled}
                      onChange={() => !disabled && setPrefs(p => ({ ...p, [key]: !p[key as keyof typeof prefs] }))}
                    />
                    <span className="cookie-toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button type="button" className="cookie-btn-config" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? "Ocultar opciones" : "Personalizar"}
            </button>
            <button type="button" className="cookie-btn-reject" onClick={reject}>Solo necesarias</button>
            {showDetails
              ? <button type="button" className="cookie-btn-accept" onClick={savePrefs}>Guardar preferencias</button>
              : <button type="button" className="cookie-btn-accept" onClick={accept}>Aceptar todas</button>
            }
          </div>
        </div>
      </dialog>
    </>
  );
}