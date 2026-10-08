"use client";

import { useState, useEffect, useRef, useId, Suspense } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import NavBar from "@/frontend/src/components/nav-bar";
import Footer from "@/frontend/src/components/footer";
import PanelCuidadorPage from "@/frontend/src/pages/panel-cuidador";
import { LEGAL_REGISTRO, type ClaveRegistro } from "@/frontend/src/content/legal";


type Mode     = "login" | "register";
type LegalKey = ClaveRegistro | null;

const PROTECTED_ROUTES: string[] = ["/salud", "/comunidad", "/recursos", "/mis-pedidos"];
const LOCAL_DEMO = process.env.NEXT_PUBLIC_LOCAL_DEMO === "true";

function startLocalDemoSession(email: string, username?: string, rol = "usuario") {
  const user = {
    id: 9001,
    email,
    username: username?.trim() || email.split("@")[0],
    rol,
    plan_id: 2,
    plan_activo: true,
  };
  sessionStorage.setItem("r65_authed", "true");
  sessionStorage.setItem("r65_user:v1", JSON.stringify(user));
  localStorage.setItem("viveplus:demo:session:v1", JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
  window.dispatchEvent(new CustomEvent("r65:authed"));
  return user;
}

async function startLocalDemoLogin(email: string, password: string) {
  if (email.trim().toLowerCase() === "admin@relatia55.com" && password === "Admin1234!") {
    const response = await fetch("/api/demo-admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo iniciar la sesión de administrador.");

    sessionStorage.setItem("r65_authed", "true");
    sessionStorage.setItem("r65_user:v1", JSON.stringify(data.user));
    window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
    window.dispatchEvent(new CustomEvent("r65:authed"));
    return data.user;
  }
  return startLocalDemoSession(email);
}


const PLANES = [
  {
    id: "gratuito", nombre: "Gratuito", precio: "0€", desc: "Para empezar",
    features: ["Perfil básico", "Chat con 3 personas", "Ver organizaciones"],
  },
  {
    id: "basico", nombre: "Básico", precio: "4,99€/mes", desc: "Lo más popular", popular: true,
    features: ["Todo lo gratuito", "Chat ilimitado", "Chat por cercanía", "Acceso a cuidadores"],
  },
  {
    id: "premium", nombre: "Premium", precio: "9,99€/mes", desc: "Completo",
    features: ["Todo lo básico", "Videollamadas", "Soporte prioritario", "Sin anuncios"],
  },
];

// Los textos viven en `content/legal.ts`, que es de donde los leen también las
// páginas públicas: aquí solo se muestran.



function AuthLogo() {
  return (
    <div className="auth-logo">
      <div className="auth-logo-circle">
        <Image src="/logo.png" alt="Logo" width={40} height={40}
          style={{ borderRadius: "50%", objectFit: "cover" }} />
      </div>
      <span className="auth-logo-name">VIVE +</span>
    </div>
  );
}

function Spinner() {
  return <div className="spinner" />;
}

function LegalModal({ docKey, onClose, onAccept, showAccept = true }: {
  docKey: LegalKey; onClose: () => void; onAccept: () => void; showAccept?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (docKey) dialogRef.current?.showModal();
  }, [docKey]);

  if (!docKey) return null;
  const doc = LEGAL_REGISTRO[docKey];
  return (
    <dialog
      ref={dialogRef}
      className="legal-modal"
      aria-labelledby="legal-modal-title"
      onCancel={e => { e.preventDefault(); onClose(); }}
    >
      <div className="legal-modal-header">
        <span className="legal-modal-title" id="legal-modal-title">{doc.titulo}</span>
        <button type="button" aria-label="Cerrar" className="legal-modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="legal-modal-body">
        <p style={{ margin: "0 0 18px", fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>
          {doc.resumen}{" "}
          <a href={`/${doc.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "#7C3AED", fontWeight: 600 }}>
            Abrir en una página
          </a>
        </p>
        {doc.secciones.map(seccion => (
          <div key={seccion.titulo} style={{ marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{seccion.titulo}</h3>
            {seccion.bloques.map((bloque, i) => (
              <p key={i} style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.65, color: "#334155", whiteSpace: "pre-line" }}>
                {bloque.tipo === "lista" || bloque.tipo === "pasos"
                  ? bloque.puntos.map(p => `• ${p.replace(/\*\*/g, "")}`).join("\n")
                  : bloque.texto.replace(/\*\*/g, "")}
              </p>
            ))}
          </div>
        ))}
      </div>
      {showAccept && (
        <div className="legal-modal-footer">
          <button type="button" className="legal-accept-btn" onClick={onAccept}>He leído y acepto</button>
        </div>
      )}
    </dialog>
  );
}

function LegalCheckbox({ accepted, error, onToggle, onOpenDoc }: {
  accepted: boolean; error: boolean;
  onToggle: () => void; onOpenDoc: (key: LegalKey) => void;
}) {
  const idCasilla = useId();

  // La casilla es el control y los tres enlaces legales van a su lado, no
  // dentro: anidados perdían sus semánticas. Cada trozo de texto es un <label>
  // para que seguir pulsando la frase marque la casilla.
  return (
    <>
      <div className={`legal-check-wrap ${error ? "error" : ""}`}>
        <input
          type="checkbox"
          id={idCasilla}
          className="legal-checkbox"
          checked={accepted}
          onChange={onToggle}
          aria-label="He leído y acepto el Aviso Legal, la Política de Privacidad y los Términos de Uso de VIVE +."
        />
        <div className="legal-text">
          <label htmlFor={idCasilla}>He leído y acepto el</label>{" "}
          <button type="button" className="legal-link" onClick={() => onOpenDoc("aviso")}>Aviso Legal</button>
          <label htmlFor={idCasilla}>, la</label>{" "}
          <button type="button" className="legal-link" onClick={() => onOpenDoc("privacidad")}>Política de Privacidad</button>
          <label htmlFor={idCasilla}> y los</label>{" "}
          <button type="button" className="legal-link" onClick={() => onOpenDoc("terminos")}>Términos de Uso</button>
          <label htmlFor={idCasilla}> de VIVE +.</label>
        </div>
      </div>
      {error && <div className="accept-error">⚠️ Debes aceptar los términos para continuar.</div>}
    </>
  );
}

function SuccessScreen() {
  return (
    <div className="auth-card">
      <div className="success-screen">
        <div className="success-icon">✅</div>
        <div className="success-title">¡Bienvenido/a a VIVE +!</div>
        <p className="success-sub">Tu cuenta ha sido creada correctamente.<br />Entrando a la plataforma…</p>
      </div>
    </div>
  );
}


function RequireLoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="auth-restrict-wrapper">
      <div className="auth-restrict-icon"></div>
      <div>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem,4vw,2.4rem)",
          color: "#0F172A", marginBottom: 10, fontWeight: 600,
        }}>
          Acceso restringido
        </h2>
        <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
          Para acceder a esta sección necesitas iniciar sesión o crear una cuenta gratuita.
        </p>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button type="button" onClick={onLogin} className="auth-login-btn-primary">
          Iniciar sesión
        </button>
        <button type="button" onClick={onLogin} className="auth-login-btn-secondary">
          Crear cuenta gratis
        </button>
      </div>
    </div>
  );
}


const STYLES = `

  /* ─────────────────────────────────────────
     Keyframes
  ───────────────────────────────────────── */
  @keyframes overlayIn  { from { opacity: 0 }                               to { opacity: 1 } }
  @keyframes cardIn     { from { opacity: 0; transform: translateY(18px) scale(0.98) } to { opacity: 1; transform: none } }
  @keyframes successIn  { from { opacity: 0; transform: scale(0.9) }        to { opacity: 1; transform: none } }
  @keyframes popIn      { from { transform: scale(0) }                       to { transform: scale(1) } }
  @keyframes spin       { to   { transform: rotate(360deg) } }
  @keyframes toastIn    { from { opacity: 0; transform: translateX(-50%) translateY(12px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }

  /* ─────────────────────────────────────────
     Overlay + backdrop
  ───────────────────────────────────────── */
  .auth-overlay {
    position: fixed; inset: 0; z-index: 50;
    display: flex; align-items: center; justify-content: center;
    background: rgba(8, 22, 18, 0.82);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    padding: 20px; overflow-y: auto;
    animation: overlayIn .22s ease;
  }

  /* ─────────────────────────────────────────
     Card
  ───────────────────────────────────────── */
  .auth-card {
    background: #FFFFFF;
    border-radius: 22px;
    width: 100%; max-width: 820px;
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.06),
      0 8px 24px rgba(0,0,0,0.08),
      0 32px 72px rgba(0,0,0,0.22);
    overflow: hidden;
    position: relative;
    animation: cardIn .38s cubic-bezier(0.22, 1, 0.36, 1);
    flex-shrink: 0; box-sizing: border-box; margin: 0 auto;
  }
  .plan-card-wide { max-width: 840px !important; }

  /* ─────────────────────────────────────────
     Compatibility stubs (old two-column)
  ───────────────────────────────────────── */
  .auth-split           { display: grid; grid-template-columns: 1fr; }
  .auth-side-panel,
  .auth-side-logo,
  .auth-side-logo-circle,
  .auth-side-logo-name,
  .auth-side-content,
  .auth-side-title,
  .auth-side-desc,
  .auth-side-features   { display: none !important; }
  .auth-right-col       { display: flex; flex-direction: column; min-width: 0; min-height: 0; max-height: 90vh; overflow-y: auto; }

  /* ─────────────────────────────────────────
     Mobile header (hidden on desktop)
  ───────────────────────────────────────── */
  .auth-mobile-header {
    display: none;
    background: linear-gradient(135deg, #9333EA 0%, #EC4899 100%);
    padding: 20px 20px 16px; text-align: center;
  }
  .auth-logo         { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 4px; }
  .auth-logo-circle  { width: 36px; height: 36px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.55); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .auth-logo-name    { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: white; }
  .auth-tagline      { font-size: 12px; color: rgba(255,255,255,0.7); font-family: 'DM Sans', sans-serif; }

  /* ─────────────────────────────────────────
     Tabs — pill style
  ───────────────────────────────────────── */
  .auth-tabs {
    display: flex; flex-shrink: 0;
    margin: 0 20px 4px; padding: 4px;
    background: #EDE9E1; border-radius: 12px; gap: 3px;
  }
  .auth-tab {
    flex: 1; padding: 9px 8px; text-align: center;
    font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', sans-serif; border: none;
    background: transparent; border-radius: 9px; color: #64748B;
    transition: background .18s, color .18s, box-shadow .18s;
  }
  .auth-tab.active  { color: #9333EA; background: #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.1), 0 0 0 0.5px rgba(0,0,0,0.04); }
  .auth-tab:hover:not(.active) { background: rgba(255,255,255,0.45); color: #3A5248; }

  /* ─────────────────────────────────────────
     Sub-tabs (Usuarios / Organizaciones)
  ───────────────────────────────────────── */
  .auth-inner-tab {
    flex: 1; padding: 10px 8px;
    background: none; border: none; border-bottom: 2px solid transparent;
    cursor: pointer; font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; color: #94A3B8;
    transition: color .18s, border-color .18s;
    margin-bottom: -2px;
  }

  /* ─────────────────────────────────────────
     Form body
  ───────────────────────────────────────── */
  .auth-body  { padding: 20px 24px 28px; box-sizing: border-box; flex: 1; overflow-y: auto; min-height: 0; }
  .auth-field { margin-bottom: 15px; }

  .auth-label {
    display: block;
    font-size: 10.5px; font-weight: 700;
    color: #64748B; margin-bottom: 6px;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.07em; text-transform: uppercase;
  }
  .auth-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .auth-error {
    background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C;
    font-size: 13px; border-radius: 10px; padding: 10px 14px;
    margin-bottom: 14px; font-family: 'DM Sans', sans-serif;
    display: flex; align-items: flex-start; gap: 8px; line-height: 1.5;
  }

  /* ─────────────────────────────────────────
     Primary button
  ───────────────────────────────────────── */
  .auth-btn {
    width: 100%; padding: 13px;
    background: linear-gradient(135deg, #9333EA 0%, #2E8A79 100%);
    color: white; border: none; border-radius: 12px;
    font-size: 14px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif; letter-spacing: 0.01em;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.12), 0 4px 12px rgba(147,51,234,0.22);
    transition: opacity .18s, transform .18s, box-shadow .18s;
    margin-top: 4px;
  }
  .auth-btn:hover   { opacity: .9; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.14), 0 8px 20px rgba(147,51,234,0.28); }
  .auth-btn:active  { transform: translateY(0); opacity: 1; }
  .auth-btn:disabled { background: #FBCFE8; box-shadow: none; cursor: not-allowed; transform: none; opacity: 1; }

  .auth-sex-btn { flex: 1; padding: 9px 6px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; transition: background .18s, color .18s, border-color .18s; }

  .auth-footer-link { text-align: center; margin-top: 16px; font-size: 12.5px; color: #64748B; font-family: 'DM Sans', sans-serif; }
  .auth-footer-link a, .auth-footer-link button { color: #EC4899; font-weight: 600; cursor: pointer; text-decoration: none; background: none; border: none; padding: 0; font-size: inherit; font-family: inherit; }
  .auth-footer-link a:hover, .auth-footer-link button:hover { text-decoration: underline; }

  /* ─────────────────────────────────────────
     Legal checkbox
  ───────────────────────────────────────── */
  .legal-link { background: none; border: none; padding: 0; color: inherit; font: inherit; cursor: pointer; text-decoration: underline; }
  .legal-check-wrap { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: #FAF8FF; border-radius: 11px; border: 1.5px solid #EDE9FE; margin-bottom: 14px; cursor: pointer; transition: border-color .18s; }
  .legal-check-wrap.error { border-color: #EF4444; background: #FFF5F5; }
  .legal-check-wrap:hover { border-color: #EC4899; }
  .legal-checkbox { appearance: none; -webkit-appearance: none; width: 18px; height: 18px; border-radius: 5px; border: 2px solid #C8C4BC; flex-shrink: 0; margin: 1px 0 0; display: flex; align-items: center; justify-content: center; transition: background .15s, border-color .15s; background: white; cursor: pointer; }
  .legal-checkbox:checked { background: #EC4899; border-color: #EC4899; }
  .legal-checkbox:checked::after { content: "✓"; color: white; font-size: 12px; font-weight: 700; line-height: 1; }
  .legal-checkbox:focus-visible { outline: 2px solid #EC4899; outline-offset: 2px; }
  .legal-text  { font-size: 12px; color: #475569; line-height: 1.6; font-family: 'DM Sans', sans-serif; }
  .legal-link  { color: #EC4899; font-weight: 600; }
  .legal-link:hover { color: #9333EA; }
  .accept-error { font-size: 12px; color: #EF4444; margin-top: -8px; margin-bottom: 12px; font-family: 'DM Sans', sans-serif; }

  /* ─────────────────────────────────────────
     Legal modal
  ───────────────────────────────────────── */
  .legal-modal-overlay { position: fixed; inset: 0; z-index: 10001; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; padding: 20px; animation: overlayIn .2s ease; }
  .legal-modal         { background: white; border: none; padding: 0; border-radius: 20px; width: 100%; max-width: 560px; max-height: 82vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.28); overflow: hidden; animation: cardIn .3s ease; }
  .legal-modal::backdrop { background: rgba(0,0,0,0.55); }
  .doc-change-btn { margin-left: auto; font-size: 12px; color: #7C3AED; font-weight: 600; background: none; border: none; padding: 0; font-family: inherit; cursor: pointer; }
  .legal-modal-header  { padding: 18px 22px 14px; border-bottom: 1px solid #EDE9FE; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .legal-modal-title   { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #0F172A; }
  .legal-modal-close   { width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid #EDE9FE; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #64748B; transition: background .15s; }
  .legal-modal-close:hover { background: #FAF8FF; }
  .legal-modal-body    { padding: 18px 22px; overflow-y: auto; flex: 1; }
  .legal-modal-body pre { white-space: pre-wrap; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #475569; line-height: 1.8; margin: 0; }
  .legal-modal-footer  { padding: 14px 22px; border-top: 1px solid #EDE9FE; flex-shrink: 0; }
  .legal-accept-btn    { width: 100%; padding: 11px; background: #EC4899; color: white; border: none; border-radius: 11px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background .18s; }
  .legal-accept-btn:hover { background: #9333EA; }

  /* ─────────────────────────────────────────
     Plan cards
  ───────────────────────────────────────── */
  .plan-header    { padding: 24px 32px 16px; text-align: center; }
  .plan-header h2 { font-family: 'Cormorant Garamond', serif; font-size: 26px; color: #0F172A; margin-bottom: 4px; }
  .plan-header p  { font-size: 13px; color: #64748B; font-family: 'DM Sans', sans-serif; }
  .planes-grid    { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; padding: 0 24px 24px; }
  .plan-box         { border: 2px solid #EDE9FE; border-radius: 16px; padding: 20px 16px; cursor: pointer; transition: border-color .18s, transform .18s; position: relative; background: white; }
  .plan-box:hover   { border-color: #EC4899; transform: translateY(-2px); }
  .plan-box.selected  { border-color: #EC4899; background: #FDF2F8; }
  .plan-box.popular-box { border-color: #EC4899; }
  .plan-popular-badge { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: #EC4899; color: white; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 99px; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
  .plan-nombre  { font-size: 15px; font-weight: 700; color: #0F172A; font-family: 'DM Sans', sans-serif; margin-bottom: 4px; }
  .plan-precio  { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; color: #EC4899; margin-bottom: 4px; }
  .plan-desc    { font-size: 12px; color: #64748B; font-family: 'DM Sans', sans-serif; margin-bottom: 12px; }
  .plan-features { list-style: none; display: flex; flex-direction: column; gap: 7px; padding: 0; margin: 0; }
  .plan-feature  { font-size: 12px; color: #0F172A; font-family: 'DM Sans', sans-serif; display: flex; align-items: flex-start; gap: 6px; line-height: 1.4; }
  .plan-check    { color: #EC4899; flex-shrink: 0; }
  .plan-actions  { padding: 0 24px 24px; display: flex; gap: 12px; align-items: center; }
  .plan-back     { background: none; border: 1.5px solid #EDE9FE; color: #64748B; border-radius: 11px; padding: 11px 18px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: border-color .18s, color .18s; white-space: nowrap; }
  .plan-back:hover { border-color: #EC4899; color: #EC4899; }

  /* ─────────────────────────────────────────
     Success screen
  ───────────────────────────────────────── */
  .success-screen { padding: 48px 32px; text-align: center; animation: successIn .5s cubic-bezier(0.22,1,0.36,1); }
  .success-icon   { width: 80px; height: 80px; border-radius: 50%; background: #FDF2F8; border: 3px solid #EC4899; display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto 20px; animation: popIn .4s .2s cubic-bezier(0.34,1.56,0.64,1) both; }
  .success-title  { font-family: 'Cormorant Garamond', serif; font-size: 28px; color: #0F172A; margin-bottom: 8px; }
  .success-sub    { font-size: 14px; color: #64748B; font-family: 'DM Sans', sans-serif; line-height: 1.6; }

  /* ─────────────────────────────────────────
     Spinner
  ───────────────────────────────────────── */
  .spinner { width: 17px; height: 17px; border: 2px solid rgba(255,255,255,0.35); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0; }

  /* ─────────────────────────────────────────
     Session toast
  ───────────────────────────────────────── */
  .session-toast       { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); z-index: 509; display: flex; align-items: center; gap: 14px; background: white; border: 1.5px solid #FECACA; border-radius: 16px; padding: 14px 20px; box-shadow: 0 8px 32px rgba(185,28,28,0.12), 0 2px 8px rgba(0,0,0,0.06); font-family: 'DM Sans', sans-serif; min-width: min(300px, calc(100vw - 40px)); max-width: 420px; animation: toastIn .4s cubic-bezier(0.22,1,0.36,1); }
  .session-toast-icon  { width: 38px; height: 38px; border-radius: 50%; background: #FEF2F2; border: 1.5px solid #FECACA; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .session-toast-title { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 700; color: #B91C1C; margin-bottom: 2px; }
  .session-toast-sub   { font-size: 12px; color: #64748B; line-height: 1.5; }

  /* ─────────────────────────────────────────
     Misc utility classes
  ───────────────────────────────────────── */
  .auth-restrict-wrapper    { min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: 40px 20px; text-align: center; font-family: 'DM Sans', sans-serif; }
  .auth-restrict-icon       { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #FDF2F8, #FBCFE8); display: flex; align-items: center; justify-content: center; font-size: 36px; border: 2px solid rgba(236,72,153,0.20); }
  .auth-login-btn-primary   { background: #EC4899; color: white; border: none; border-radius: 14px; padding: 13px 32px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 14px rgba(236,72,153,0.28); transition: opacity .18s, transform .18s; }
  .auth-login-btn-primary:hover { opacity: .88; transform: translateY(-1px); }
  .auth-login-btn-secondary { background: white; color: #EC4899; border: 1.5px solid #EC4899; border-radius: 14px; padding: 13px 32px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background .18s; }
  .auth-login-btn-secondary:hover { background: #F0FBF9; }

  /* ─────────────────────────────────────────
     Sliding panel layout — técnica cortina
  ───────────────────────────────────────── */
  .auth-slide-container {
    position: relative;
    overflow: hidden;
    min-height: 640px;
  }

  /* Mitades del formulario — apiladas absolutas */
  .auth-form-half {
    position: absolute; top: 0; left: 0;
    height: 100%; width: 50%;
    box-sizing: border-box;
    background: #FFFFFF;
    display: flex; flex-direction: column;
    overflow: hidden;
    transition: transform 0.6s ease-in-out, opacity 0.6s ease-in-out;
  }

  .auth-form-half-login    { z-index: 2; }
  .auth-form-half-register { opacity: 0; z-index: 1; }

  .auth-form-half-login.auth-panel-active { transform: translateX(100%); }
  .auth-form-half-register.auth-panel-active {
    transform: translateX(100%);
    opacity: 1; z-index: 5;
    animation: showForm 0.6s forwards;
  }

  @keyframes showForm {
    0%,   49.99% { opacity: 0; z-index: 1; }
    50%, 100%    { opacity: 1; z-index: 5; }
  }

  /* Botón cerrar */
  .auth-close-btn {
    position: absolute; top: 12px; right: 12px; z-index: 200;
    width: 30px; height: 30px; border-radius: 50%;
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; color: #64748B; cursor: pointer; line-height: 1;
    transition: background .15s, color .15s, box-shadow .15s;
  }
  .auth-close-btn:hover { background: white; color: #0F172A; box-shadow: 0 2px 8px rgba(0,0,0,0.14); }

  /* ─────────────────────────────────────────
     Panel verde — técnica cortina (referencia)
  ───────────────────────────────────────── */

  /* Contenedor recortador (overflow:hidden) */
  .auth-slide-panel-wrapper {
    position: absolute; top: 0; left: 50%;
    width: 50%; height: 100%;
    overflow: hidden;
    transition: transform 0.6s ease-in-out;
    z-index: 100;
  }
  .auth-slide-panel-wrapper.auth-panel-active { transform: translateX(-100%); }

  /* Pista interior: 200% de ancho, expone su mitad derecha por defecto */
  .auth-slide-panel {
    background: linear-gradient(150deg, #0F2820 0%, #9333EA 40%, #257060 75%, #2E8A79 100%);
    position: relative; left: -100%;
    height: 100%; width: 200%;
    display: flex;
    transition: transform 0.6s ease-in-out;
  }
  .auth-slide-panel.auth-panel-active { transform: translateX(50%); }

  /* Círculos decorativos */
  .auth-slide-panel::before {
    content: ''; position: absolute; top: -100px; right: -100px;
    width: 320px; height: 320px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }
  .auth-slide-panel::after {
    content: ''; position: absolute; bottom: -80px; left: -80px;
    width: 240px; height: 240px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  /* Cada mitad del panel */
  .auth-panel-half {
    width: 50%; flex-shrink: 0; align-self: stretch;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 40px 32px 32px; box-sizing: border-box;
    position: relative; z-index: 1;
    transition: transform 0.6s ease-in-out;
  }
  /* Mitad izquierda: entra al activarse (modo registro) */
  .auth-panel-half-left  { transform: translateX(-20%); }
  .auth-slide-panel.auth-panel-active .auth-panel-half-left  { transform: translateX(0); }
  /* Mitad derecha: sale al activarse */
  .auth-slide-panel.auth-panel-active .auth-panel-half-right { transform: translateX(20%); }

  /* ─────────────────────────────────────────
     Panel content typography
  ───────────────────────────────────────── */
  .auth-panel-eyebrow {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(255,255,255,0.38); margin-bottom: 10px;
  }

  .auth-panel-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 38px; font-weight: 600; color: white;
    line-height: 1.12; margin-bottom: 14px;
    position: relative; z-index: 1;
  }

  .auth-panel-subtitle {
    font-size: 13px; color: rgba(255,255,255,0.58);
    font-family: 'DM Sans', sans-serif; line-height: 1.7;
    margin-bottom: 20px; position: relative; z-index: 1;
  }

  .auth-panel-divider {
    height: 1px;
    background: linear-gradient(to right, rgba(255,255,255,0.14), rgba(255,255,255,0.02));
    margin: 4px 0 20px;
  }

  .auth-side-feature {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: rgba(255,255,255,0.78);
    font-family: 'DM Sans', sans-serif; line-height: 1.4;
    margin-bottom: 11px; position: relative; z-index: 1;
  }

  .auth-side-feature-dot {
    width: 20px; height: 20px; border-radius: 50%;
    background: rgba(255,255,255,0.16);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: white; flex-shrink: 0;
  }

  /* Panel CTA — white button */
  .auth-panel-switch-btn {
    width: 100%; padding: 13px;
    background: white; color: #9333EA;
    border: none; border-radius: 12px;
    font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.01em;
    transition: background .18s, transform .18s, box-shadow .18s;
    margin-bottom: 10px; position: relative; z-index: 1;
  }
  .auth-panel-switch-btn:hover {
    background: #EDF9F6;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  }

  /* Panel secondary button */
  .auth-collab-btn {
    width: 100%; padding: 11px; border-radius: 11px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.6);
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: background .18s, color .18s, border-color .18s;
    position: relative; z-index: 1;
  }
  .auth-collab-btn:hover {
    background: rgba(255,255,255,0.11);
    color: rgba(255,255,255,0.88);
    border-color: rgba(255,255,255,0.3);
  }

  .auth-side-footer {
    font-size: 11px; color: rgba(255,255,255,0.28);
    font-family: 'DM Sans', sans-serif;
    margin-top: 14px; position: relative; z-index: 1;
    letter-spacing: 0.02em;
  }

  /* ─────────────────────────────────────────
     Responsive — tablet (≤ 860px)
  ───────────────────────────────────────── */
  @media (max-width: 860px) {
    .auth-overlay { padding: 20px; align-items: flex-start; }
    .auth-card    { max-width: 460px; border-radius: 20px; }
    .plan-card-wide { max-width: 560px !important; }
    .auth-mobile-header { display: block; padding: 16px 20px 12px; }
    .auth-right-col { max-height: 85dvh; overflow-y: auto; }
    .auth-body  { padding: 20px 24px 24px; }
    .auth-field { margin-bottom: 12px; }
    .auth-grid2 { grid-template-columns: 1fr 1fr; gap: 10px; }
    .planes-grid { grid-template-columns: 1fr; padding: 0 20px 20px; gap: 10px; }
    .plan-header { padding: 18px 20px 10px; }
    .plan-actions { padding: 0 20px 20px; }

    .auth-slide-container { display: block; min-height: unset; }
    .auth-form-half { position: static !important; width: 100%; height: auto; max-height: none; overflow: visible !important; background: #FFFFFF; flex: none; display: none; transform: none !important; opacity: 1 !important; }
    .auth-form-half.mode-active { display: flex; }
    .auth-slide-panel-wrapper { display: none !important; }
  }

  /* ─────────────────────────────────────────
     Responsive — mobile (≤ 600px)
  ───────────────────────────────────────── */
  @media (max-width: 600px) {
    .auth-overlay { align-items: flex-start; padding: 10px; overflow-y: auto; box-sizing: border-box; }
    .auth-card    { width: 100%; max-width: 100%; border-radius: 18px; max-height: none; overflow: visible; }
    .plan-card-wide { max-width: 100% !important; max-height: none; overflow: visible; }
    .auth-right-col { max-height: none; overflow: visible; }
    .auth-mobile-header { padding: 12px 16px 8px; }
    .auth-tagline { display: none; }
    .auth-tabs { margin: 0 12px 4px; }
    .auth-tab  { padding: 9px 4px; font-size: 12.5px; }
    .auth-body { padding: 12px 16px 20px; }
    .auth-field { margin-bottom: 10px; }
    .auth-label { font-size: 10px; margin-bottom: 4px; }
    .auth-grid2 { grid-template-columns: 1fr; gap: 0; }
    .auth-error { padding: 8px 10px; font-size: 12px; margin-bottom: 8px; }
    .auth-body input { padding: 10px 12px; font-size: 16px; border-radius: 10px; box-sizing: border-box; }
    .auth-btn  { padding: 13px; font-size: 15px; border-radius: 11px; margin-top: 6px; }
    .auth-footer-link { margin-top: 12px; font-size: 12px; }
    .legal-check-wrap { padding: 10px 12px; gap: 8px; }
    .legal-text { font-size: 12px; }
    .legal-modal { border-radius: 16px; max-height: 88dvh; width: calc(100vw - 24px); }
    .planes-grid { grid-template-columns: 1fr; padding: 0 16px 16px; gap: 10px; }
    .plan-header { padding: 14px 16px 8px; }
    .plan-header h2 { font-size: 20px; }
    .plan-actions { padding: 0 16px 20px; flex-direction: column; }
    .plan-back { width: 100%; text-align: center; }
    .success-screen { padding: 28px 16px; }
  }

  /* ─────────────────────────────────────────
     Responsive — very small (≤ 380px)
  ───────────────────────────────────────── */
  @media (max-width: 380px) {
    .auth-overlay { padding: 6px; }
    .auth-body  { padding: 10px 12px 16px; }
    .auth-body input { padding: 9px 10px; }
    .auth-btn   { font-size: 14px; padding: 12px; }
    .auth-tab   { font-size: 12px; padding: 8px 2px; }
    .auth-mobile-header { padding: 10px 12px 6px; }
  }
`


const AG_RESET_ICON_CIRCLE: React.CSSProperties = { width: 72, height: 72, borderRadius: "50%", background: "#FDF2F8", border: "3px solid #EC4899", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px" };
const AG_BACK_LINK_BTN: React.CSSProperties = { background: "none", border: "none", color: "#64748B", fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", marginBottom: 16, padding: 0, display: "flex", alignItems: "center", gap: 4 };
const AG_QUICKLOGIN_BTN: React.CSSProperties = { padding: "6px 12px", fontSize: 12, borderRadius: 6, border: "1px solid #C8E6E1", background: "#F4FAF9", color: "#9333EA", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, transition: "background-color 0.2s, color 0.2s, border-color 0.2s, transform 0.2s" };
const AG_MEDICO_OK_ICON: React.CSSProperties = { width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #7C3AED, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" };
const AG_ROL_BTN_BASE: React.CSSProperties = { flex: 1, padding: "9px 12px", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background-color 0.2s, color 0.2s, border-color 0.2s, transform 0.2s", textTransform: "capitalize" };
const AG_ADD_PERSONA_BTN: React.CSSProperties = { padding: "0 12px", borderRadius: 10, border: "1.5px solid #EC4899", background: "#FDF2F8", color: "#9333EA", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  border: "1.5px solid #DDD8CF",
  borderRadius: 11, fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  color: "#0F172A", background: "#FFFFFF",
  outline: "none",
  transition: "border-color .18s, box-shadow .18s",
  boxSizing: "border-box",
};
const focusInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "#EC4899";
  e.target.style.boxShadow   = "0 0 0 3px rgba(236,72,153,0.12)";
};
const blurInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "#DDD8CF";
  e.target.style.boxShadow   = "none";
};




type MedicoPlan = { id: number; nombre: string; precio: number; intervalo: string; caracteristicas: string[] };
type Persona = { key: number; nombre: string; apellidos: string; edad: string };

function useAuthGateState(pathname: string | null) {
  /* — Estado de sesión — */
  const [authed,        setAuthed]        = useState(false);
  const [checked,       setChecked]       = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  /* — Flujo auth — */
  const [mode,    setMode]    = useState<Mode>("login");
  const [step,    setStep]    = useState<"auth" | "forgot" | "reset-sent">("auth");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* — Planes — */
  const [planSel, setPlanSel] = useState("basico");
  const [medicoPayLoading, setMedicoPayLoading] = useState(false);
  const [medicoPayError, setMedicoPayError] = useState("");
  const [medicoPlan, setMedicoPlan] = useState<MedicoPlan | null>(null);

  /* — Campos login — */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass,  setLoginPass]  = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginTab,   setLoginTab]   = useState<"usuario" | "org">("usuario");
  const [orgNombre,  setOrgNombre]  = useState("");
  const [orgPass,    setOrgPass]    = useState("");

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setLoginError("");
    try {
      if (LOCAL_DEMO) {
        const user = await startLocalDemoLogin(loginEmail, loginPass);
        setAuthed(true);
        if (user.rol === "admin") window.location.href = "/admin";
        else closeAuthModalFn();
        return;
      }
      const r = await fetch("/api/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Credenciales inválidas");

      // Login exitoso: almacenar datos y notificar
      sessionStorage.setItem("r65_authed", "true");
      sessionStorage.setItem("r65_user:v1", JSON.stringify(d.user));
      setAuthed(true);
      window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
      window.dispatchEvent(new CustomEvent("r65:authed"));

      if (d.user.rol === "admin") {
        window.location.href = "/admin-marketplace";
      } else if (d.user.rol === "intermediario" && !d.user.onboarding_completado) {
        window.location.href = "/onboarding";
      } else {
        closeAuthModalFn();
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  /* — Olvidé contraseña — */
  const [forgotEmail,   setForgotEmail]   = useState("");
  const [forgotError,   setForgotError]   = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  /* — Campos registro — */
  const [regName,  setRegName]  = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass,  setRegPass]  = useState("");
  const [regPass2, setRegPass2] = useState("");
  const [regAge,   setRegAge]   = useState("");
  const [regSexo,  setRegSexo]  = useState("");
  const [regRol,              setRegRol]              = useState<"usuario"|"intermediario">("usuario");
  const [regEsMedico,         setRegEsMedico]         = useState(false);
  const [medicoStep,          setMedicoStep]          = useState<"codigo" | "perfil" | "docs" | "plan" | "ok">("codigo");
  const [regDocIdentidad,     setRegDocIdentidad]     = useState<string | null>(null);
  const [regDocAntecedentes,  setRegDocAntecedentes]  = useState<string | null>(null);
  const [regDocResidencia,    setRegDocResidencia]    = useState<string | null>(null);
  const [docUploading,        setDocUploading]        = useState<string | null>(null);
  const [docUploadError,      setDocUploadError]      = useState<string | null>(null);
  const [medicoRegistering,   setMedicoRegistering]   = useState(false);
  const [medicoRegError,      setMedicoRegError]      = useState<string | null>(null);
  const [regCodigoInvitacion, setRegCodigoInvitacion] = useState("");
  const [regMedicoTag,        setRegMedicoTag]        = useState("");
  const [regMedicoHorario,    setRegMedicoHorario]    = useState("");
  const [regMedicoTipo,       setRegMedicoTipo]       = useState("");
  const [regMedicoEsp,        setRegMedicoEsp]        = useState("");
  const [regError,            setRegError]            = useState("");
  const [regPersonas,         setRegPersonas]         = useState<Persona[]>([]);
  const [regPersonaNombre,    setRegPersonaNombre]    = useState("");
  const [regPersonaApellidos, setRegPersonaApellidos] = useState("");
  const [regPersonaEdad,      setRegPersonaEdad]      = useState("");
  const regPersonaKey = useRef(0);

  /* — Legal — */
  const [legalOpen,       setLegalOpen]       = useState<LegalKey>(null);
  const [legalOpenGlobal, setLegalOpenGlobal] = useState<LegalKey>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptError,   setAcceptError]   = useState(false);

  /* — Toasts — */
  const [sessionToast, setSessionToast] = useState(false);
  useEffect(() => {
    if (!sessionToast) return;
    const t = setTimeout(() => {
      setSessionToast(false);
      window.location.href = "/";
    }, 4000);
    return () => clearTimeout(t);
  }, [sessionToast]);

  useEffect(() => {
    if (medicoStep !== "plan" || medicoPlan) return;
    let cancelled = false;
    fetch("/api/planes")
      .then((r) => r.json())
      .then((planes: { id: number; nombre: string; precio: number; intervalo: string; caracteristicas: unknown }[]) => {
        if (cancelled) return;
        const found = planes.find((p) => p.nombre.toLowerCase().includes("médico") || p.nombre.toLowerCase().includes("medico")) ?? planes[0];
        if (found) {
          const features = Array.isArray(found.caracteristicas) ? (found.caracteristicas as string[]) : [];
          setMedicoPlan({ id: found.id, nombre: found.nombre, precio: Number(found.precio), intervalo: found.intervalo, caracteristicas: features });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [medicoStep, medicoPlan]);

  /* ── Efectos ── */
  useEffect(() => {
    const saved = sessionStorage.getItem("r65_authed");
    if (saved === "true") {
      setAuthed(true);
      setChecked(true);
      return;
    }

    if (LOCAL_DEMO) {
      const demoUser = localStorage.getItem("viveplus:demo:session:v1");
      if (demoUser) {
        try {
          const user = JSON.parse(demoUser);
          sessionStorage.setItem("r65_authed", "true");
          sessionStorage.setItem("r65_user:v1", JSON.stringify(user));
          setAuthed(true);
          setChecked(true);
          return;
        } catch (error) {
          console.warn("No se pudo recuperar la sesión demo guardada.", error);
          localStorage.removeItem("viveplus:demo:session:v1");
        }
      }
    }

    // La cookie r65_token ahora es HttpOnly (no legible desde JS), así que
    // rehidratamos la sesión preguntando al servidor, que la valida y devuelve
    // la identidad del usuario.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/verify-session");
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.user) {
            sessionStorage.setItem("r65_authed", "true");
            sessionStorage.setItem("r65_user:v1", JSON.stringify(data.user));
            window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
            setAuthed(true);
            setChecked(true);
            return;
          }
        }
      } catch { /* ignore */ }
      if (!cancelled) {
        setAuthed(false);
        setChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);


  useEffect(() => {
    if (!authed) return;
    const intent = sessionStorage.getItem('r65_checkout_intent');
    if (intent) {
      sessionStorage.removeItem('r65_checkout_intent');
      window.location.href = '/planes';
    }
  }, [authed]);


  useEffect(() => {
    if (authed) {
      window.dispatchEvent(new CustomEvent("r65:authed"));
      let cancelled = false;


      const verify = async () => {
        try {
          const res = await fetch("/api/verify-session");
          if (cancelled) return;
          if (res.ok) {
            const data = await res.json();
            if (cancelled) return;
            const saved = sessionStorage.getItem("r65_user:v1");
            if (saved) {
              try {
                const u = JSON.parse(saved);
                let changed = false;
                if (data.foto !== undefined && u.foto !== data.foto) { u.foto = data.foto; changed = true; }
                if (data.plan_id !== undefined && u.plan_id !== data.plan_id) { u.plan_id = data.plan_id; changed = true; }
                if (changed) {
                  sessionStorage.setItem("r65_user:v1", JSON.stringify(u));
                  window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
                }
              } catch {}
            }
          } else {
            const data = await res.json();
            if (cancelled) return;

            if (data.error && data.error.includes("dispositivo")) {
              sessionStorage.removeItem("r65_authed");
              sessionStorage.removeItem("r65_user:v1");
              // El servidor ya elimina la cookie HttpOnly en esta respuesta 403.
              window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
              setAuthed(false);
              setSessionToast(true);
            }
          }
        } catch {}
      };
      verify();

      const intervalTime = 300000;
      const interval = setInterval(verify, intervalTime);


      const onVisible = () => { if (document.visibilityState === "visible") verify(); };
      document.addEventListener("visibilitychange", onVisible);

      return () => {
        cancelled = true;
        clearInterval(interval);
        document.removeEventListener("visibilitychange", onVisible);
      };
    }
  }, [authed, pathname]);


  const openAuthModalRef = useRef<() => void>(() => {});
  useEffect(() => {
    openAuthModalRef.current = () => {
      setMode("login"); setStep("auth"); setSuccess(false);
      setLoginError(""); setRegError(""); setAcceptError(false);
      setShowAuthModal(true);
    };
  });
  useEffect(() => {
    const handler = () => openAuthModalRef.current();
    window.addEventListener("r65:open-auth", handler);
    return () => window.removeEventListener("r65:open-auth", handler);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('r65_open_auth') === '1') {
      sessionStorage.removeItem('r65_open_auth');
      const tid = setTimeout(() => openAuthModalRef.current(), 0);
      return () => clearTimeout(tid);
    }
  }, [pathname]);


  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("medico_pagado") !== "true") return;

    const sessionId = searchParams.get("session_id");
    const email = sessionStorage.getItem("pending_medico_email");
    const pass = sessionStorage.getItem("pending_medico_pass");
    if (!email || !pass || !sessionId) return;

    let cancelled = false;
    let successTid: ReturnType<typeof setTimeout> | undefined;
    let retryTid: ReturnType<typeof setTimeout> | undefined;

    setMode("login");
    setStep("auth");
    setShowAuthModal(true);
    setLoading(true);
    setLoginError("Procesando pago y creando cuenta, por favor espera...");

    // La espera entre reintentos es un timer del efecto, no una llamada que se
    // reprograma sola: al desmontar se cancela con el resto.
    const esperarReintento = () => new Promise<void>(resolve => { retryTid = setTimeout(resolve, 1500); });

    const run = async () => {
      if (cancelled) return;

      const confirmRes = await fetch(`/api/confirm-medico-plan?session_id=${sessionId}`);
      if (cancelled) return;
      if (!confirmRes.ok) {
        const data = await confirmRes.json().catch(() => ({}));
        setLoginError(data.error ?? "Error al confirmar el pago. Contacta con soporte.");
        setLoading(false);
        return;
      }

      for (let intento = 0; intento <= 3; intento++) {
        if (cancelled) return;
        try {
          const res = await fetch("/api/login", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password: pass }),
          });
          const data = await res.json();

          if (cancelled) return;
          if (res.ok) {
            // El servidor fija la cookie de sesión HttpOnly en la respuesta de /api/login.
            sessionStorage.setItem("r65_authed", "true");
            sessionStorage.setItem("r65_user:v1", JSON.stringify(data.user));
            sessionStorage.removeItem("pending_medico_email");
            sessionStorage.removeItem("pending_medico_pass");
            window.dispatchEvent(new CustomEvent("relatia-auth-changed"));

            setSuccess(true);
            successTid = setTimeout(() => {
              if (cancelled) return;
              setAuthed(true);
              setShowAuthModal(false);
              setSuccess(false);
              window.history.replaceState({}, document.title, window.location.pathname);
            }, 1800);
            return;
          }

          if (intento === 3) {
            setLoginError("Cuenta creada. Por favor, inicia sesión manualmente.");
            setLoading(false);
            return;
          }
        } catch {
          if (cancelled) return;
          if (intento === 3) {
            setLoginError("Error de conexión. Inténtalo de nuevo más tarde.");
            setLoading(false);
            return;
          }
        }

        await esperarReintento();
      }
    };

    run();
    return () => {
      cancelled = true;
      clearTimeout(successTid);
      clearTimeout(retryTid);
    };
  }, []);

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setMode("login");
    setStep("auth");
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const key = (e as CustomEvent<LegalKey>).detail;
      if (key) setLegalOpenGlobal(key);
    };
    window.addEventListener("r65:open-legal", handler);
    return () => window.removeEventListener("r65:open-legal", handler);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginEmail || !loginPass) { setLoginError("Rellena todos los campos."); return; }
    if (LOCAL_DEMO) {
      setLoading(true);
      try {
        const user = await startLocalDemoLogin(loginEmail, loginPass);
        setAuthed(true);
        setShowAuthModal(false);
        if (user.rol === "admin") window.location.href = "/admin";
      } catch (err) {
        setLoginError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.error ?? "Error al iniciar sesión."); return; }

      // La cookie de sesión HttpOnly la fija el servidor en la respuesta de /api/login.
      sessionStorage.setItem("r65_authed", "true");
      sessionStorage.setItem("r65_user:v1", JSON.stringify(data.user));
      window.dispatchEvent(new CustomEvent("relatia-auth-changed"));

      setAuthed(true);
      setShowAuthModal(false);

      if (data.user?.rol === "medico" && !data.user?.plan_activo) {
        window.location.href = "/panel-cuidador";
      } else if (data.user?.rol === "intermediario" && !data.user?.onboarding_completado) {
        window.location.href = "/onboarding";
      }
      return;
    } catch { setLoginError("Error de conexión. Inténtalo de nuevo."); }
    finally   { setLoading(false); }
  };

  const handleOrgLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!orgNombre || !orgPass) { setLoginError("Rellena todos los campos."); return; }
    if (LOCAL_DEMO) {
      startLocalDemoSession(orgNombre, orgNombre, "usuario_organizacion");
      setAuthed(true);
      setShowAuthModal(false);
      window.location.href = "/organizaciones";
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: orgNombre, password: orgPass }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.error ?? "Credenciales incorrectas."); return; }
      // La cookie de sesión HttpOnly la fija el servidor en la respuesta de /api/login.
      sessionStorage.setItem("r65_authed", "true");
      sessionStorage.setItem("r65_user:v1", JSON.stringify(data.user));
      window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
      setAuthed(true);
      setShowAuthModal(false);
      window.location.href = data.user?.plan_org_id ? "/organizaciones" : "/planes-organizacion";
    } catch { setLoginError("Error de conexión. Inténtalo de nuevo."); }
    finally { setLoading(false); }
  };

  const handleValidarCodigo = async () => {
    if (!regCodigoInvitacion.trim()) { setRegError("Introduce el código de invitación."); return; }
    setRegError(""); setLoading(true);
    try {
      const res = await fetch("/api/validar-codigo-medico", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: regCodigoInvitacion.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setRegError(data.error ?? "Código no válido."); return; }
      setMedicoStep("perfil");
    } catch { setRegError("Error de conexión."); }
    finally   { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(""); setAcceptError(false);
    if (!regName || !regEmail || !regPass || !regPass2 || !regAge) { setRegError("Rellena todos los campos."); return; }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(regEmail)) { setRegError("Email no válido."); return; }
    if (regRol === "intermediario") {
      if (Number(regAge) < 18) { setRegError("Debes ser mayor de edad (18+) para registrarte como intermediario."); return; }
    }
    if (regPass.length < 6)   { setRegError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (regPass !== regPass2)  { setRegError("Las contraseñas no coinciden."); return; }
    if (!acceptedTerms)        { setAcceptError(true); return; }

    if (LOCAL_DEMO && !regEsMedico) {
      const user = startLocalDemoSession(regEmail, regName, regRol);
      localStorage.setItem("viveplus:demo:registered-user:v1", JSON.stringify({
        email: user.email,
        username: user.username,
        rol: user.rol,
        registeredAt: new Date().toISOString(),
      }));
      setSuccess(true);
      setTimeout(() => {
        setAuthed(true);
        setShowAuthModal(false);
        setSuccess(false);
      }, 1200);
      return;
    }

    if (regEsMedico) {
      setMedicoStep("docs");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regName, email: regEmail, password: regPass, edad: Number(regAge), sexo: regSexo || null, rol: regRol,
          personas_responsables: regRol === "intermediario" ? regPersonas.map(p => ({ nombre: p.nombre, apellidos: p.apellidos, edad: p.edad ? Number(p.edad) : null })) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setRegError(data.error ?? "Error al crear la cuenta."); return; }
      const lr = await fetch("/api/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, password: regPass }),
      });
      if (lr.ok) {
        const ld = await lr.json();
        // La cookie de sesión HttpOnly la fija el servidor en la respuesta de /api/login.
        sessionStorage.setItem("r65_authed", "true");
        sessionStorage.setItem("r65_user:v1", JSON.stringify(ld.user));
        window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
        setSuccess(true);
        setTimeout(() => {
          setAuthed(true); setShowAuthModal(false); setSuccess(false);
          if (ld.user?.rol === "intermediario" && !ld.user?.onboarding_completado) window.location.href = "/onboarding";
        }, 1800);
      } else {
        setStep("auth"); setMode("login"); setLoginError("Cuenta creada. Inicia sesión.");
      }
    } catch { setRegError("Error de conexión."); }
    finally  { setLoading(false); }
  };

  const handleMedicoRegistrar = async () => {
    setMedicoRegistering(true);
    setMedicoRegError(null);
    try {
      const res = await fetch("/api/register-medico-directo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regName, email: regEmail, password: regPass,
          edad: Number(regAge), sexo: regSexo || null,
          codigoInvitacion: regCodigoInvitacion.trim(),
          medicoTag: regMedicoTag, medicoHorario: regMedicoHorario,
          medicoTipo: regMedicoTipo, medicoEspecialidad: regMedicoEsp,
          docIdentidadUrl: regDocIdentidad ?? "",
          docAntecedentesUrl: regDocAntecedentes ?? "",
          docResidenciaUrl: regDocResidencia ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar");
      setMedicoStep("ok");
    } catch (err: unknown) {
      setMedicoRegError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setMedicoRegistering(false);
    }
  };

  const handleMedicoPay = async () => {
    setMedicoPayLoading(true);
    setMedicoPayError("");
    try {

      sessionStorage.setItem("pending_medico_email", regEmail);
      sessionStorage.setItem("pending_medico_pass", regPass);

      const res = await fetch("/api/register-medico-pending", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regName, email: regEmail, password: regPass,
          edad: Number(regAge), sexo: regSexo || null,
          codigoInvitacion: regCodigoInvitacion.trim(),
          medicoTag: regMedicoTag, medicoHorario: regMedicoHorario,
          medicoTipo: regMedicoTipo, medicoEspecialidad: regMedicoEsp,
          docIdentidadUrl: regDocIdentidad ?? "",
          docAntecedentesUrl: regDocAntecedentes ?? "",
          docResidenciaUrl: regDocResidencia ?? "",
          planId: medicoPlan?.id,
          successUrl: `${window.location.origin}/?medico_pagado=true`,
          cancelUrl: `${window.location.origin}/?medico_cancelado=true`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar el pago");
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setMedicoPayError(err.message || "Error de conexión");
      setMedicoPayLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail) { setForgotError("Introduce tu correo electrónico."); return; }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(forgotEmail)) { setForgotError("Email no válido."); return; }
    setForgotLoading(true);
    try {
      await fetch("/api/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setStep("reset-sent");
    } catch {
      setForgotError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setForgotLoading(false);
    }
  };

  const openAuthModal = () => {
    setMode("login"); setStep("auth"); setSuccess(false);
    setLoginError(""); setRegError(""); setAcceptError(false);
    setShowAuthModal(true);
  };

  const closeAuthModalFn = () => {
    setShowAuthModal(false);
    setLegalOpen(null);
    setAcceptError(false);
    setSuccess(false);
    setStep("auth");
    setLoginError("");
    setRegError("");
  };

  return {
    authed, setAuthed, checked, showAuthModal, setShowAuthModal,
    mode, setMode, step, setStep, loading, success,
    planSel, setPlanSel, medicoPayLoading, medicoPayError, medicoPlan,
    loginEmail, setLoginEmail, loginPass, setLoginPass, loginError, setLoginError,
    loginTab, setLoginTab, orgNombre, setOrgNombre, orgPass, setOrgPass,
    doLogin,
    forgotEmail, setForgotEmail, forgotError, setForgotError, forgotLoading,
    regName, setRegName, regEmail, setRegEmail, regPass, setRegPass, regPass2, setRegPass2,
    regAge, setRegAge, regSexo, setRegSexo, regRol, setRegRol,
    regEsMedico, setRegEsMedico, medicoStep, setMedicoStep,
    regDocIdentidad, setRegDocIdentidad, regDocAntecedentes, setRegDocAntecedentes, regDocResidencia, setRegDocResidencia,
    docUploading, setDocUploading, docUploadError, setDocUploadError,
    medicoRegistering, medicoRegError,
    regCodigoInvitacion, setRegCodigoInvitacion,
    regMedicoTag, setRegMedicoTag, regMedicoHorario, setRegMedicoHorario, regMedicoTipo, setRegMedicoTipo, regMedicoEsp, setRegMedicoEsp,
    regError, setRegError,
    regPersonas, setRegPersonas, regPersonaNombre, setRegPersonaNombre, regPersonaApellidos, setRegPersonaApellidos, regPersonaEdad, setRegPersonaEdad,
    regPersonaKey,
    legalOpen, setLegalOpen, legalOpenGlobal, setLegalOpenGlobal,
    acceptedTerms, setAcceptedTerms, acceptError, setAcceptError,
    sessionToast, setSessionToast,
    closeAuthModal,
    handleLogin, handleOrgLogin, handleValidarCodigo, handleRegister, handleMedicoRegistrar, handleMedicoPay, handleForgot,
    openAuthModal, closeAuthModalFn,
  };
}

type AuthGateState = ReturnType<typeof useAuthGateState>;

function MedicoStepOk() {
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={AG_MEDICO_OK_ICON}>
        <span style={{ fontSize: 26 }}>✅</span>
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>Solicitud enviada</h2>
      <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>
        Tu documentación está siendo revisada por nuestro equipo.
      </p>
      <p style={{ fontSize: 13, color: "#94A3B8", fontFamily: "'DM Sans', sans-serif" }}>
        Te avisaremos cuando tu perfil sea activado. Mientras tanto no podrás iniciar sesión.
      </p>
    </div>
  );
}

function MedicoStepCodigo({ state }: { state: AuthGateState }) {
  const { regError, setRegEsMedico, setRegError, regCodigoInvitacion, setRegCodigoInvitacion, loading, handleValidarCodigo } = state;
  return (
    <div>
      {regError && <div className="auth-error">⚠️ {regError}</div>}
      <button
        type="button"
        onClick={() => { setRegEsMedico(false); setRegError(""); }}
        style={AG_BACK_LINK_BTN}
      >
        ← Volver al registro normal
      </button>
      <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: "#0F172A", marginBottom: 6 }}>Registro de Médico</h3>
      <p style={{ color: "#64748B", fontSize: 13, fontFamily: "'DM Sans',sans-serif", marginBottom: 18, lineHeight: 1.5 }}>
        Introduce el código de invitación proporcionado por el administrador.
      </p>
      <div className="auth-field">
        <label htmlFor="ag-med-code" className="auth-label">Código de invitación</label>
        <input id="ag-med-code"
          style={inputStyle}
          type="text"
          placeholder=""
          value={regCodigoInvitacion}
          onChange={e => setRegCodigoInvitacion(e.target.value)}
          onFocus={focusInput} onBlur={blurInput}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleValidarCodigo(); }}}
        />
      </div>
      <button
        type="button"
        className="auth-btn"
        disabled={loading}
        onClick={handleValidarCodigo}
        style={{ marginTop: 4 }}
      >
        {loading ? <><Spinner /> Validando…</> : "Validar código"}
      </button>
    </div>
  );
}

function MedicoStepPlan({ state }: { state: AuthGateState }) {
  const { medicoPlan, medicoPayError, medicoPayLoading, handleMedicoPay, setMedicoStep } = state;
  return (
    <div>
      <div className="plan-header">
        <h2>Tu plan profesional</h2>
        <p>Cuenta creada. Impulsa tu visibilidad con el plan médico.</p>
      </div>
      <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "center" }}>
        {medicoPlan ? (
          <div className="plan-box popular-box" style={{ cursor: "default", maxWidth: 300, width: "100%" }}>
            <div className="plan-popular-badge">Recomendado</div>
            <div style={{ fontSize: 30, marginBottom: 8, marginTop: 4 }}>🩺</div>
            <div className="plan-nombre">{medicoPlan.nombre}</div>
            <div className="plan-precio">
              {medicoPlan.precio}€
              <span style={{ fontSize: 14, color: "#64748B", fontFamily: "'DM Sans',sans-serif", fontWeight: 400 }}>
                /{medicoPlan.intervalo === "mensual" ? "mes" : "año"}
              </span>
            </div>
            {medicoPlan.caracteristicas.length > 0 && (
              <ul className="plan-features">
                {medicoPlan.caracteristicas.map((f) => (
                  <li key={f} className="plan-feature">
                    <span className="plan-check">✓</span> {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div style={{ padding: 20, color: "#64748B", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>Cargando plan…</div>
        )}
      </div>
      {medicoPayError && <div className="auth-error" style={{ margin: "0 24px 12px" }}>⚠️ {medicoPayError}</div>}
      <div className="plan-actions" style={{ flexDirection: "column" }}>
        <button
          type="button"
          className="auth-btn"
          disabled={medicoPayLoading || !medicoPlan}
          onClick={handleMedicoPay}
        >
          {medicoPayLoading
            ? <><Spinner /> Procesando…</>
            : medicoPlan
              ? `Contratar plan — ${medicoPlan.precio}€/${medicoPlan.intervalo === "mensual" ? "mes" : "año"}`
              : "Cargando…"}
        </button>
        <button
          type="button"
          className="plan-back"
          disabled={medicoPayLoading}
          onClick={() => setMedicoStep("docs")}
        >
          ← Volver a documentación
        </button>
        <p style={{ textAlign: "center", fontSize: 12, color: "#64748B", fontFamily: "'DM Sans',sans-serif", margin: "8px 0 0" }}>
          Pago seguro vía Stripe · Cancela cuando quieras
        </p>
      </div>
    </div>
  );
}

function MedicoStepDocs({ state }: { state: AuthGateState }) {
  const {
    setMedicoStep, docUploadError, setDocUploadError,
    regDocIdentidad, setRegDocIdentidad, regDocAntecedentes, setRegDocAntecedentes, regDocResidencia, setRegDocResidencia,
    docUploading, setDocUploading, medicoRegError, medicoRegistering, handleMedicoRegistrar,
  } = state;
  return (
    <div>
      <button type="button" onClick={() => { setMedicoStep("perfil"); setDocUploadError(null); }} style={{ ...AG_BACK_LINK_BTN, marginBottom: 14 }}>
        ← Volver al perfil
      </button>
      <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "10px 14px", marginBottom: 18, display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>🛡</span>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#1E40AF", margin: 0, lineHeight: 1.55 }}>
          Para garantizar la seguridad de nuestros usuarios, necesitamos verificar tu identidad y antecedentes antes de activar tu perfil.
        </p>
      </div>
      {docUploadError && <div className="auth-error">⚠️ {docUploadError}</div>}
      {(["identidad", "antecedentes", "residencia"] as const).map(tipo => {
        const labels: Record<string, string> = { identidad: "Documento de identidad (DNI / NIE / Pasaporte) *", antecedentes: "Certificado de antecedentes penales *", residencia: "Tarjeta de residente (si aplica)" };
        const urls: Record<string, string | null> = { identidad: regDocIdentidad, antecedentes: regDocAntecedentes, residencia: regDocResidencia };
        const uploaded = urls[tipo];
        const removeDoc = () => { if (tipo === "identidad") setRegDocIdentidad(null); else if (tipo === "antecedentes") setRegDocAntecedentes(null); else setRegDocResidencia(null); };
        return (
          <div key={tipo} className="auth-field">
            <label className="auth-label">{labels[tipo]}</label>
            <div style={{ position: "relative" }}>
              <input
                type="file"
                accept=".pdf,image/*"
                style={{ display: "none" }}
                id={`doc-${tipo}`}
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setDocUploadError(null);
                  setDocUploading(tipo);
                  try {
                    const fd = new FormData();
                    fd.append("documento", file);
                    const res = await fetch("/api/upload-documento", { method: "POST", body: fd });
                    const data = await res.json();
                    if (!res.ok) { setDocUploadError(data.error ?? "Error al subir"); return; }
                    if (tipo === "identidad") setRegDocIdentidad(data.url);
                    else if (tipo === "antecedentes") setRegDocAntecedentes(data.url);
                    else setRegDocResidencia(data.url);
                  } catch { setDocUploadError("Error de conexión al subir el archivo"); }
                  finally { setDocUploading(null); }
                }}
              />
              <label htmlFor={`doc-${tipo}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", border: `1.5px dashed ${uploaded ? "#86EFAC" : "#C4B5FD"}`, borderRadius: 11, background: uploaded ? "#F0FDF4" : "#FAF8FF", cursor: "pointer" }}>
                <span style={{ fontSize: 18 }}>{docUploading === tipo ? "⏳" : uploaded ? "✅" : "📄"}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: uploaded ? "#16A34A" : "#64748B" }}>
                  {docUploading === tipo ? "Subiendo…" : uploaded ? uploaded.split("/").pop() : "Seleccionar archivo (PDF o imagen, máx. 10 MB)"}
                </span>
                {uploaded && (
                  <button type="button" className="doc-change-btn"
                    onClick={e => { e.preventDefault(); removeDoc(); }}>
                    Cambiar
                  </button>
                )}
              </label>
            </div>
          </div>
        );
      })}
      {medicoRegError && <div className="auth-error" style={{ marginBottom: 10 }}>⚠️ {medicoRegError}</div>}
      <button
        type="button"
        className="auth-btn"
        disabled={!regDocIdentidad || !regDocAntecedentes || !!docUploading || medicoRegistering}
        onClick={handleMedicoRegistrar}
        style={{ marginTop: 4 }}
      >
        {medicoRegistering ? "Enviando solicitud…" : "Finalizar registro →"}
      </button>
    </div>
  );
}

function MedicoStepPerfil({ state }: { state: AuthGateState }) {
  const {
    handleRegister, regError, setMedicoStep, setRegError,
    regName, setRegName, regAge, setRegAge, regEmail, setRegEmail,
    regSexo, setRegSexo, regPass, setRegPass, regPass2, setRegPass2,
    regMedicoEsp, setRegMedicoEsp, regMedicoTipo, setRegMedicoTipo, regMedicoTag, setRegMedicoTag, regMedicoHorario, setRegMedicoHorario,
    acceptedTerms, acceptError, setAcceptedTerms, setAcceptError, setLegalOpen, loading,
  } = state;
  return (
    <form onSubmit={handleRegister}>
      {regError && <div className="auth-error">⚠️ {regError}</div>}
      <button
        type="button"
        onClick={() => { setMedicoStep("codigo"); setRegError(""); }}
        style={{ ...AG_BACK_LINK_BTN, marginBottom: 14 }}
      >
        ← Cambiar código
      </button>
      <div style={{ background: "#FDF2F8", borderRadius: 8, padding: "8px 12px", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#EC4899", fontSize: 13 }}>✓</span>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#9333EA", fontWeight: 600 }}>Código válido. Completa tu perfil médico.</span>
      </div>

      <div className="auth-field">
        <label htmlFor="ag-med-name" className="auth-label">Nombre de usuario</label>
        <input id="ag-med-name" style={inputStyle} type="text" placeholder="Tu nombre"
          value={regName} onChange={e => setRegName(e.target.value)}
          onFocus={focusInput} onBlur={blurInput} />
      </div>
      <div className="auth-grid2">
        <div className="auth-field">
          <label htmlFor="ag-med-age" className="auth-label">Edad</label>
          <input id="ag-med-age" style={inputStyle} type="number" placeholder="40" min="18" max="120"
            value={regAge} onChange={e => { const v = e.target.value; if (v === "" || (Number(v) >= 1 && Number(v) <= 120)) setRegAge(v); }}
            onFocus={focusInput} onBlur={blurInput} />
        </div>
        <div className="auth-field">
          <label htmlFor="ag-med-email" className="auth-label">Correo</label>
          <input id="ag-med-email" style={inputStyle} type="email" placeholder="tu@correo.es"
            value={regEmail} onChange={e => setRegEmail(e.target.value)}
            onFocus={focusInput} onBlur={blurInput} />
        </div>
      </div>
      <div className="auth-field">
        <p className="auth-label">Sexo</p>
        <div style={{ display: "flex", gap: 6 }}>
          {([
            { value: "", label: "No indicar" },
            { value: "hombre", label: "Hombre" },
            { value: "mujer", label: "Mujer" },
            { value: "otro", label: "Otro" },
          ] as const).map(op => (
            <button
              key={op.value}
              type="button"
              onClick={() => setRegSexo(op.value)}
              className="auth-sex-btn" style={{ border: `1.5px solid ${regSexo === op.value ? "#EC4899" : "#EDE9FE"}`, background: regSexo === op.value ? "#FDF2F8" : "white", color: regSexo === op.value ? "#EC4899" : "#64748B" }}
            >
              {regSexo === op.value ? "✓ " : ""}{op.label}
            </button>
          ))}
        </div>
      </div>
      <div className="auth-grid2">
        <div className="auth-field">
          <label htmlFor="ag-med-pass" className="auth-label">Contraseña</label>
          <input id="ag-med-pass" style={inputStyle} type="password" placeholder="Mín. 6 caracteres"
            value={regPass} onChange={e => setRegPass(e.target.value)}
            onFocus={focusInput} onBlur={blurInput} />
        </div>
        <div className="auth-field">
          <label htmlFor="ag-med-pass2" className="auth-label">Repetir</label>
          <input id="ag-med-pass2" style={inputStyle} type="password" placeholder="Repite la contraseña"
            value={regPass2} onChange={e => setRegPass2(e.target.value)}
            onFocus={focusInput} onBlur={blurInput} />
        </div>
      </div>

      <div style={{ height: 1, background: "#EDE9FE", margin: "12px 0" }} />
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#64748B", marginBottom: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Perfil profesional</p>

      <div className="auth-field">
        <label htmlFor="ag-med-esp" className="auth-label">Especialidad</label>
        <input id="ag-med-esp" style={inputStyle} type="text" placeholder="Ej: Cardiología, Geriatría…"
          value={regMedicoEsp} onChange={e => setRegMedicoEsp(e.target.value)}
          onFocus={focusInput} onBlur={blurInput} />
      </div>
      <div className="auth-grid2">
        <div className="auth-field">
          <label htmlFor="ag-med-tipo" className="auth-label">Tipo</label>
          <input id="ag-med-tipo" style={inputStyle} type="text" placeholder="Ej: Médico, Fisio…"
            value={regMedicoTipo} onChange={e => setRegMedicoTipo(e.target.value)}
            onFocus={focusInput} onBlur={blurInput} />
        </div>
        <div className="auth-field">
          <label htmlFor="ag-med-tag" className="auth-label">Tag / Etiqueta</label>
          <input id="ag-med-tag" style={inputStyle} type="text" placeholder="Ej: #corazon"
            value={regMedicoTag} onChange={e => setRegMedicoTag(e.target.value)}
            onFocus={focusInput} onBlur={blurInput} />
        </div>
      </div>
      <div className="auth-field">
        <label htmlFor="ag-med-horario" className="auth-label">Horario</label>
        <input id="ag-med-horario" style={inputStyle} type="text" placeholder="Ej: Lun–Vie 9:00–17:00"
          value={regMedicoHorario} onChange={e => setRegMedicoHorario(e.target.value)}
          onFocus={focusInput} onBlur={blurInput} />
      </div>

      <LegalCheckbox
        accepted={acceptedTerms} error={acceptError}
        onToggle={() => { setAcceptedTerms(v => !v); setAcceptError(false); }}
        onOpenDoc={setLegalOpen}
      />
      <button type="submit" className="auth-btn" disabled={loading}>
        {loading ? <><Spinner /> Validando…</> : "Continuar al plan"}
      </button>
    </form>
  );
}

function MedicoRegisterWizard({ state }: { state: AuthGateState }) {
  const { medicoStep } = state;
  if (medicoStep === "ok") return <MedicoStepOk />;
  if (medicoStep === "codigo") return <MedicoStepCodigo state={state} />;
  if (medicoStep === "plan") return <MedicoStepPlan state={state} />;
  if (medicoStep === "docs") return <MedicoStepDocs state={state} />;
  return <MedicoStepPerfil state={state} />;
}

function NormalRegisterForm({ state }: { state: AuthGateState }) {
  const {
    handleRegister, regError, regRol, setRegRol,
    regPersonaNombre, setRegPersonaNombre, regPersonaApellidos, setRegPersonaApellidos, regPersonaEdad, setRegPersonaEdad,
    regPersonaKey, regPersonas, setRegPersonas,
    regName, setRegName, regAge, setRegAge, regEmail, setRegEmail, regSexo, setRegSexo,
    regPass, setRegPass, regPass2, setRegPass2,
    acceptedTerms, acceptError, setAcceptedTerms, setAcceptError, setLegalOpen,
    loading, setMode, closeAuthModal,
  } = state;
  return (
    <form onSubmit={handleRegister}>
      {regError && <div className="auth-error">⚠️ {regError}</div>}
      <div className="auth-field">
        <p className="auth-label">Tipo de cuenta</p>
        <div style={{ display: "flex", gap: 8 }}>
          {(["usuario", "intermediario"] as const).map(rol => (
            <button key={rol} type="button"
              onClick={() => setRegRol(rol)}
              style={{ ...AG_ROL_BTN_BASE, border: `1.5px solid ${regRol === rol ? "var(--teal)" : "#EDE9FE"}`, background: regRol === rol ? "#FDF2F8" : "white", color: regRol === rol ? "var(--teal)" : "var(--muted)" }}>
              {regRol === rol ? "✓ " : ""}{rol === "usuario" ? "Usuario" : "Intermediario"}
            </button>
          ))}
        </div>
        {regRol === "intermediario" && (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
              Añade el nombre y apellidos de las personas de las que eres responsable.
            </p>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <input
                type="text"
                value={regPersonaNombre}
                onChange={e => { const v = e.target.value.replace(/[^a-zA-ZÀ-ÿñÑ\s]/g, ""); setRegPersonaNombre(v); }}
                placeholder="Nombre"
                style={{ ...inputStyle, flex: 1, minWidth: 80, marginBottom: 0 }}
                onFocus={focusInput} onBlur={blurInput}
              />
              <input
                type="text"
                value={regPersonaApellidos}
                onChange={e => { const v = e.target.value.replace(/[^a-zA-ZÀ-ÿñÑ\s]/g, ""); setRegPersonaApellidos(v); }}
                placeholder="Apellidos"
                style={{ ...inputStyle, flex: 1.4, minWidth: 100, marginBottom: 0 }}
                onFocus={focusInput} onBlur={blurInput}
              />
              <input
                type="number"
                value={regPersonaEdad}
                onChange={e => { const v = e.target.value; if (v === "" || (Number(v) >= 1 && Number(v) <= 120)) setRegPersonaEdad(v); }}
                placeholder="Edad"
                min="1" max="120"
                style={{ ...inputStyle, width: 68, minWidth: 68, marginBottom: 0 }}
                onFocus={focusInput} onBlur={blurInput}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const n = regPersonaNombre.trim();
                    const a = regPersonaApellidos.trim();
                    if (!n || !a) return;
                    const newKey = regPersonaKey.current++;
                    setRegPersonas(prev => [...prev, { key: newKey, nombre: n, apellidos: a, edad: regPersonaEdad.trim() }]);
                    setRegPersonaNombre(""); setRegPersonaApellidos(""); setRegPersonaEdad("");
                  }
                }}
              />
              <button type="button"
                onClick={() => {
                  const n = regPersonaNombre.trim();
                  const a = regPersonaApellidos.trim();
                  if (!n || !a) return;
                  const newKey = regPersonaKey.current++;
                  setRegPersonas(prev => [...prev, { key: newKey, nombre: n, apellidos: a, edad: regPersonaEdad.trim() }]);
                  setRegPersonaNombre(""); setRegPersonaApellidos(""); setRegPersonaEdad("");
                }}
                style={AG_ADD_PERSONA_BTN}>
                + Añadir
              </button>
            </div>
            {regPersonas.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {regPersonas.map(p => (
                  <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 5, background: "#FDF2F8", border: "1px solid #C8E6E1", borderRadius: 99, padding: "4px 10px 4px 12px" }}>
                    <span style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: "#9333EA", fontWeight: 600 }}>{p.nombre} {p.apellidos}{p.edad ? `, ${p.edad} años` : ""}</span>
                    <button type="button" onClick={() => setRegPersonas(prev => prev.filter(x => x.key !== p.key))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#6B9E94", fontSize: 14, lineHeight: 1, padding: 0 }}>
                      &#215;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="auth-field">
        <label htmlFor="ag-reg-name" className="auth-label">Nombre de usuario</label>
        <input id="ag-reg-name" style={inputStyle} type="text" placeholder="Tu nombre"
          value={regName} onChange={e => setRegName(e.target.value)}
          onFocus={focusInput} onBlur={blurInput} />
      </div>
      <div className="auth-grid2">
        <div className="auth-field">
          <label htmlFor="ag-reg-age" className="auth-label">Edad</label>
          <input id="ag-reg-age" style={inputStyle} type="number" placeholder="65" min="18" max="120"
            value={regAge}
            onChange={e => { const v = e.target.value; if (v === "" || (Number(v) >= 1 && Number(v) <= 120)) setRegAge(v); }}
            onFocus={focusInput} onBlur={blurInput} />
        </div>
        <div className="auth-field">
          <label htmlFor="ag-reg-email" className="auth-label">Correo</label>
          <input id="ag-reg-email" style={inputStyle} type="email" placeholder="tu@correo.es"
            value={regEmail} onChange={e => setRegEmail(e.target.value)}
            onFocus={focusInput} onBlur={blurInput} />
        </div>
      </div>
      <div className="auth-field">
        <p className="auth-label">Sexo</p>
        <div style={{ display: "flex", gap: 6 }}>
          {([
            { value: "", label: "No indicar" },
            { value: "hombre", label: "Hombre" },
            { value: "mujer", label: "Mujer" },
            { value: "otro", label: "Otro" },
          ] as const).map(op => (
            <button
              key={op.value}
              type="button"
              onClick={() => setRegSexo(op.value)}
              className="auth-sex-btn" style={{ border: `1.5px solid ${regSexo === op.value ? "#EC4899" : "#EDE9FE"}`, background: regSexo === op.value ? "#FDF2F8" : "white", color: regSexo === op.value ? "#EC4899" : "#64748B" }}
            >
              {regSexo === op.value ? "✓ " : ""}{op.label}
            </button>
          ))}
        </div>
      </div>
      <div className="auth-grid2">
        <div className="auth-field">
          <label htmlFor="ag-reg-pass" className="auth-label">Contraseña</label>
          <input id="ag-reg-pass" style={inputStyle} type="password" placeholder="Mín. 6 caracteres"
            value={regPass} onChange={e => setRegPass(e.target.value)}
            onFocus={focusInput} onBlur={blurInput} />
        </div>
        <div className="auth-field">
          <label htmlFor="ag-reg-pass2" className="auth-label">Repetir</label>
          <input id="ag-reg-pass2" style={inputStyle} type="password" placeholder="Repite la contraseña"
            value={regPass2} onChange={e => setRegPass2(e.target.value)}
            onFocus={focusInput} onBlur={blurInput} />
        </div>
      </div>
      <LegalCheckbox
        accepted={acceptedTerms} error={acceptError}
        onToggle={() => { setAcceptedTerms(v => !v); setAcceptError(false); }}
        onOpenDoc={setLegalOpen}
      />
      <button type="submit" className="auth-btn" disabled={loading}>
        {loading ? <><Spinner /> Creando…</> : "Crear cuenta"}
      </button>
      <div className="auth-footer-link">
        ¿Ya tienes cuenta? <button type="button" onClick={() => setMode("login")}>Inicia sesión</button> · <button type="button" onClick={closeAuthModal}>Volver</button>
      </div>
    </form>
  );
}

function LoginHalf({ state }: { state: AuthGateState }) {
  const {
    mode, setMode, setLoginError, setRegError,
    loginTab, setLoginTab, handleLogin, loginError,
    loginEmail, setLoginEmail, loginPass, setLoginPass,
    setForgotEmail, setForgotError, setStep, loading,
    closeAuthModalFn, handleOrgLogin, orgNombre, setOrgNombre, orgPass, setOrgPass,
  } = state;
  return (
    <div className={`auth-form-half auth-form-half-login${mode === "login" ? " mode-active" : ""}${mode === "register" ? " auth-panel-active" : ""}`}>
      <div className="auth-mobile-header">
        <div className="auth-logo">
          <div className="auth-logo-circle">
            <Image src="/logo.png" alt="Logo" width={32} height={32}
              style={{ borderRadius: "50%", objectFit: "cover" }} />
          </div>
          <span className="auth-logo-name">VIVE +</span>
        </div>
        <p className="auth-tagline">Conectando personas mayores en Santander</p>
      </div>
      <div style={{ padding: "28px 24px 12px", flexShrink: 0 }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 600, color: "#0F172A", margin: "0 0 3px", lineHeight: 1.2 }}>
          Bienvenido de nuevo
        </h3>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
          Accede a tu cuenta de VIVE+
        </p>
      </div>
      <div className="auth-tabs">
        <button type="button" className="auth-tab active">Iniciar sesión</button>
        <button type="button" className="auth-tab"
          onClick={() => { setMode("register"); setLoginError(""); setRegError(""); }}>
          Crear cuenta
        </button>
      </div>
      <div className="auth-body">
            <div style={{ display: "flex", borderBottom: "1.5px solid #EDE9FE", marginBottom: 16, gap: 0 }}>
              <button type="button" onClick={() => { setLoginTab("usuario"); setLoginError(""); }} className="auth-inner-tab" style={{ fontWeight: loginTab === "usuario" ? 700 : 500, color: loginTab === "usuario" ? "#EC4899" : "#94A3B8", borderBottom: loginTab === "usuario" ? "2.5px solid #EC4899" : "2.5px solid transparent" }}>Usuarios</button>
              <button type="button" onClick={() => { setLoginTab("org"); setLoginError(""); }} className="auth-inner-tab" style={{ fontWeight: loginTab === "org" ? 700 : 500, color: loginTab === "org" ? "#EC4899" : "#94A3B8", borderBottom: loginTab === "org" ? "2.5px solid #EC4899" : "2.5px solid transparent" }}>Organizaciones</button>
            </div>
            {loginTab === "usuario" ? (
              <form onSubmit={handleLogin}>
                {loginError && (
                  <div className="auth-error" style={loginError.includes("Procesando") ? { background: "#FDF2F8", borderColor: "#C8E6E1", color: "#9333EA" } : {}}>
                    {loginError.includes("Procesando") ? "⏳" : "⚠️"} {loginError}
                  </div>
                )}
                <div className="auth-field">
                  <label htmlFor="ag-login-email" className="auth-label">Correo electrónico</label>
                  <input id="ag-login-email" style={inputStyle} type="email" placeholder="tu@correo.es"
                    value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    onFocus={focusInput} onBlur={blurInput} />
                </div>
                <div className="auth-field">
                  <label htmlFor="ag-login-pass" className="auth-label">Contraseña</label>
                  <input id="ag-login-pass" style={inputStyle} type="password" placeholder="Tu contraseña"
                    value={loginPass} onChange={e => setLoginPass(e.target.value)}
                    onFocus={focusInput} onBlur={blurInput} />
                </div>
                <div style={{ textAlign: "right", marginBottom: 16, marginTop: -6 }}>
                  <button type="button" onClick={() => { setForgotEmail(loginEmail); setForgotError(""); setStep("forgot"); }} style={{ fontSize: 12, color: "#EC4899", cursor: "pointer", background: "none", border: "none", padding: 0, fontWeight: 500 }}>¿Olvidaste la contraseña?</button>
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? <><Spinner /> Entrando…</> : "Entrar a VIVE +"}
                </button>
                <div className="auth-footer-link">
                  ¿No tienes cuenta? <button type="button" onClick={() => setMode("register")}>Regístrate gratis</button> · <button type="button" onClick={closeAuthModalFn}>Volver</button>
                </div>

                {/* Botones de inicio de sesión rápido (Desarrollo) */}
                <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "center", borderTop: "1px solid #EDE9FE", paddingTop: 16 }}>
                  <button type="button" onClick={() => { setLoginEmail("admin@relatia55.com"); setLoginPass("Admin1234!"); }} style={AG_QUICKLOGIN_BTN} onMouseEnter={e => e.currentTarget.style.background = "#E0F2EF"} onMouseLeave={e => e.currentTarget.style.background = "#F4FAF9"}>Admin</button>
                  <button type="button" onClick={() => { setLoginEmail("javiecheva99@gmail.com"); setLoginPass("123456"); }} style={AG_QUICKLOGIN_BTN} onMouseEnter={e => e.currentTarget.style.background = "#E0F2EF"} onMouseLeave={e => e.currentTarget.style.background = "#F4FAF9"}>Usuario</button>
                  <button type="button" onClick={() => { setLoginEmail("medico@gmail.com"); setLoginPass("123456"); }} style={AG_QUICKLOGIN_BTN} onMouseEnter={e => e.currentTarget.style.background = "#E0F2EF"} onMouseLeave={e => e.currentTarget.style.background = "#F4FAF9"}>Médico</button>
                  <button type="button" onClick={() => { setLoginEmail("intermediario5@gmail.com"); setLoginPass("123456"); }} style={AG_QUICKLOGIN_BTN} onMouseEnter={e => e.currentTarget.style.background = "#E0F2EF"} onMouseLeave={e => e.currentTarget.style.background = "#F4FAF9"}>Inter</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleOrgLogin}>
                {loginError && <div className="auth-error">⚠️ {loginError}</div>}
                <div className="auth-field">
                  <label htmlFor="ag-org-name" className="auth-label">Nombre de la organización</label>
                  <input id="ag-org-name" style={inputStyle} type="text" placeholder="Nombre de empresa"
                    value={orgNombre} onChange={e => setOrgNombre(e.target.value)}
                    onFocus={focusInput} onBlur={blurInput} />
                </div>
                <div className="auth-field">
                  <label htmlFor="ag-org-pass" className="auth-label">Contraseña</label>
                  <input id="ag-org-pass" style={inputStyle} type="password" placeholder="Contraseña asignada"
                    value={orgPass} onChange={e => setOrgPass(e.target.value)}
                    onFocus={focusInput} onBlur={blurInput} />
                </div>
                <button type="submit" className="auth-btn" disabled={loading} style={{ marginTop: 8 }}>
                  {loading ? <><Spinner /> Entrando…</> : "Entrar como Organización"}
                </button>
                <div className="auth-footer-link">
                  <button type="button" onClick={closeAuthModalFn}>Cancelar</button>
                </div>
              </form>
            )}
      </div>
    </div>
  );
}

function RegisterHalf({ state }: { state: AuthGateState }) {
  const { mode, setMode, setLoginError, setRegError, regEsMedico } = state;
  return (
    <div className={`auth-form-half auth-form-half-register${mode === "register" ? " mode-active auth-panel-active" : ""}`}>
      <div className="auth-mobile-header">
        <div className="auth-logo">
          <div className="auth-logo-circle">
            <Image src="/logo.png" alt="Logo" width={32} height={32}
              style={{ borderRadius: "50%", objectFit: "cover" }} />
          </div>
          <span className="auth-logo-name">VIVE +</span>
        </div>
        <p className="auth-tagline">Conectando personas mayores en Santander</p>
      </div>
      <div style={{ padding: "28px 24px 12px", flexShrink: 0 }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 600, color: "#0F172A", margin: "0 0 3px", lineHeight: 1.2 }}>
          Crear cuenta
        </h3>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
          Únete a la comunidad +55 de Santander
        </p>
      </div>
      <div className="auth-tabs">
        <button type="button" className="auth-tab"
          onClick={() => { setMode("login"); setLoginError(""); setRegError(""); }}>
          Iniciar sesión
        </button>
        <button type="button" className="auth-tab active">Crear cuenta</button>
      </div>
      <div className="auth-body">
        {regEsMedico ? <MedicoRegisterWizard state={state} /> : <NormalRegisterForm state={state} />}
      </div>
    </div>
  );
}

function AuthSlidePanel({ state }: { state: AuthGateState }) {
  const { mode, setMode, setLoginError, setRegError, setRegEsMedico, setMedicoStep, setRegCodigoInvitacion } = state;
  return (
    <div className={`auth-slide-panel-wrapper${mode === "register" ? " auth-panel-active" : ""}`}>
      <div className={`auth-slide-panel${mode === "register" ? " auth-panel-active" : ""}`}>

        {/* Mitad izquierda: visible en modo registro (panel a la izquierda) */}
        <div className="auth-panel-half auth-panel-half-left">
          <div className="auth-panel-top">
            <div className="auth-logo" style={{ marginBottom: 22 }}>
              <div className="auth-logo-circle" style={{ width: 44, height: 44, borderColor: "rgba(255,255,255,0.45)", borderWidth: 2 }}>
                <Image src="/logo.png" alt="Logo" width={30} height={30}
                  style={{ borderRadius: "50%", objectFit: "cover" }} />
              </div>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: "white", letterSpacing: "0.02em" }}>VIVE +</span>
            </div>
            <p className="auth-panel-eyebrow">Ya formas parte</p>
            <h2 className="auth-panel-title">Bienvenido<br/>de vuelta</h2>
            <p className="auth-panel-subtitle">Inicia sesión para retomar donde lo dejaste</p>
            <div className="auth-panel-divider" />
            {[
              { text: "Chat en tiempo real con vecinos" },
              { text: "Cuidadores certificados" },
              { text: "Comunidad activa +55" },
              { text: "Plataforma segura y privada" },
            ].map(f => (
              <div key={f.text} className="auth-side-feature">
                <div className="auth-side-feature-dot">{"✓"}</div>
                {f.text}
              </div>
            ))}
          </div>
          <div className="auth-panel-bottom">
            <button type="button" className="auth-panel-switch-btn"
              onClick={() => { setMode("login"); setLoginError(""); setRegError(""); }}>
              {"Ya tengo cuenta"}
            </button>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.32)", margin: "16px 0 0", letterSpacing: "0.03em" }}>
              © 2026 VIVE+ · Santander
            </p>
          </div>
        </div>

        {/* Mitad derecha: visible en modo login (panel a la derecha) */}
        <div className="auth-panel-half auth-panel-half-right">
          <div className="auth-panel-top">
            <div className="auth-logo" style={{ marginBottom: 22 }}>
              <div className="auth-logo-circle" style={{ width: 44, height: 44, borderColor: "rgba(255,255,255,0.45)", borderWidth: 2 }}>
                <Image src="/logo.png" alt="Logo" width={30} height={30}
                  style={{ borderRadius: "50%", objectFit: "cover" }} />
              </div>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: "white", letterSpacing: "0.02em" }}>VIVE +</span>
            </div>
            <p className="auth-panel-eyebrow">Empieza hoy mismo</p>
            <h2 className="auth-panel-title">{"Únete a la"}<br/>{"comunidad"}</h2>
            <p className="auth-panel-subtitle">La plataforma +55 de cuidado, compañía y cercanía en Santander</p>
            <div className="auth-panel-divider" />
            {[
              { text: "Registro gratuito en 2 minutos" },
              { text: "Chatea con personas de tu zona" },
              { text: "Acceso a cuidadores y médicos" },
              { text: "100% seguro y privado" },
            ].map(f => (
              <div key={f.text} className="auth-side-feature">
                <div className="auth-side-feature-dot">{"✓"}</div>
                {f.text}
              </div>
            ))}
          </div>
          <div className="auth-panel-bottom">
            <button type="button" className="auth-panel-switch-btn"
              onClick={() => { setMode("register"); setLoginError(""); setRegError(""); }}>
              {"Crear cuenta gratis"}
            </button>
            <button type="button"
              onClick={() => { setMode("register"); setRegEsMedico(true); setMedicoStep("codigo"); setRegError(""); setRegCodigoInvitacion(""); }}
              className="auth-collab-btn">
              {"¿Eres profesional de salud? Regístrate"}
            </button>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.32)", margin: "16px 0 0", letterSpacing: "0.03em" }}>
              © 2026 VIVE+ · Santander
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function ResetSentCard({ state }: { state: AuthGateState }) {
  const { setStep, setForgotEmail } = state;
  return (
    <div className="auth-card">
      <div className="auth-header"><AuthLogo /></div>
      <div className="auth-body" style={{ textAlign: "center", padding: "28px 24px" }}>
        <div style={AG_RESET_ICON_CIRCLE}>📫</div>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: "#0F172A", marginBottom: 12 }}>Revisa tu correo</h3>
        <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.7, fontFamily: "'DM Sans',sans-serif", marginBottom: 28 }}>
          Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
        </p>
        <button type="button" className="auth-btn" onClick={() => { setStep("auth"); setForgotEmail(""); }}>
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}

function ForgotCard({ state }: { state: AuthGateState }) {
  const { setStep, forgotError, handleForgot, forgotEmail, setForgotEmail, forgotLoading } = state;
  return (
    <div className="auth-card">
      <div className="auth-header"><AuthLogo /><p className="auth-tagline">Recupera el acceso a tu cuenta</p></div>
      <div className="auth-body">
        <button type="button" onClick={() => setStep("auth")} style={AG_BACK_LINK_BTN}>← Volver al inicio de sesión</button>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: "#0F172A", marginBottom: 8 }}>¿Olvidaste tu contraseña?</h3>
        <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif", marginBottom: 20 }}>Introduce tu correo y te enviaremos un enlace para crear una nueva contraseña.</p>
        <form onSubmit={handleForgot}>
          {forgotError && <div className="auth-error">⚠️ {forgotError}</div>}
          <div className="auth-field">
            <label htmlFor="ag-forgot-email" className="auth-label">Correo electrónico</label>
            <input id="ag-forgot-email" style={inputStyle} type="email" placeholder="tu@correo.es" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} onFocus={focusInput} onBlur={blurInput} />
          </div>
          <button type="submit" className="auth-btn" disabled={forgotLoading} style={{ marginTop: 8 }}>
            {forgotLoading ? <><Spinner /> Enviando…</> : "Enviar enlace de recuperación"}
          </button>
        </form>
      </div>
    </div>
  );
}

function MainAuthCard({ state }: { state: AuthGateState }) {
  const { closeAuthModalFn } = state;
  return (
    <div className="auth-card">
      <button type="button" aria-label="Cerrar" onClick={closeAuthModalFn} className="auth-close-btn">×</button>
      <div className="auth-slide-container">
        <LoginHalf state={state} />
        <RegisterHalf state={state} />
        <AuthSlidePanel state={state} />
      </div>
    </div>
  );
}

function AuthModal({ state }: { state: AuthGateState }) {
  const { showAuthModal, success, step, legalOpen, setLegalOpen, setAcceptedTerms } = state;
  if (!showAuthModal) return null;
  return (
    <div className="auth-overlay">
      <div className="auth-bg-pattern" />

      <LegalModal
        docKey={legalOpen}
        onClose={() => setLegalOpen(null)}
        onAccept={() => { setAcceptedTerms(true); setLegalOpen(null); }}
      />

      <div role="presentation" onClick={e => e.stopPropagation()} style={{ width: "100%" }}>
        {success ? <SuccessScreen /> :
         step === "reset-sent" ? <ResetSentCard state={state} /> :
         step === "forgot" ? <ForgotCard state={state} /> :
         <MainAuthCard state={state} />}
      </div>
    </div>
  );
}

function SessionToastBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="session-toast">
      <div className="session-toast-icon">⚠️</div>
      <div className="google-toast-body">
        <div className="session-toast-title">Sesión cerrada</div>
        <div className="session-toast-sub">Tu sesión se ha iniciado en otro dispositivo. Serás redirigido…</div>
      </div>
      <button type="button" aria-label="Cerrar aviso" className="google-toast-close" onClick={onClose}>✕</button>
    </div>
  );
}

// Devuelve tambien el email porque el panel que se monta al bloquear lo pide:
// aqui ya esta leido, y asi esa pantalla no vuelve a buscarlo por su cuenta.
function useMedicoPaymentGate(authed: boolean): { blocked: boolean; email: string } {
  const [gate, setGate] = useState({ blocked: false, email: "" });

  useEffect(() => {
    const libre = { blocked: false, email: "" };
    const check = () => {
      if (!authed) { setGate(libre); return; }
      try {
        const raw = sessionStorage.getItem("r65_user:v1");
        if (!raw) { setGate(libre); return; }
        const u = JSON.parse(raw);
        setGate({ blocked: u?.rol === "medico" && !u?.plan_activo, email: u?.email ?? "" });
      } catch { setGate(libre); }
    };
    check();
    window.addEventListener("relatia-auth-changed", check);
    window.addEventListener("r65:authed", check);
    return () => {
      window.removeEventListener("relatia-auth-changed", check);
      window.removeEventListener("r65:authed", check);
    };
  }, [authed]);

  return gate;
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const state = useAuthGateState(pathname);
  const { checked, authed, sessionToast, setSessionToast, legalOpenGlobal, setLegalOpenGlobal, openAuthModal } = state;
  const medicoGate = useMedicoPaymentGate(authed);

  if (!checked) return null;

  if (medicoGate.blocked) {
    return (
      <>
        <style>{STYLES}</style>
        <Suspense>
          {/* Si esta bloqueado es justo porque no tiene plan activo. */}
          <PanelCuidadorPage initialUser={{ email: medicoGate.email, planActivo: false }} />
        </Suspense>
      </>
    );
  }

  if (pathname?.startsWith("/mis-chats")) return <>{children}</>;

  const isProtected = PROTECTED_ROUTES.some(r => pathname?.startsWith(r));

  return (
    <>
      <style>{STYLES}</style>

      {sessionToast && (
        <SessionToastBanner onClose={() => { setSessionToast(false); window.location.href = "/"; }} />
      )}

      <NavBar />
      <main style={{ minHeight: "calc(100vh - 80px)" }}>
        {/* Ruta protegida sin sesión */}
        {isProtected && !authed
          ? <RequireLoginScreen onLogin={openAuthModal} />
          : children
        }
      </main>
      {!pathname?.startsWith("/comunidad") && !pathname?.startsWith("/planes") && <Footer />}

      {/* Modal legal global (footer) */}
      <LegalModal
        docKey={legalOpenGlobal}
        onClose={() => setLegalOpenGlobal(null)}
        onAccept={() => setLegalOpenGlobal(null)}
        showAccept={false}
      />

      {/* Modal de login/registro */}
      <AuthModal state={state} />
    </>
  );
}
