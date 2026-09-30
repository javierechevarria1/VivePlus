"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", border: "1.5px solid #EDE9FE",
  borderRadius: 12, fontSize: 15, fontFamily: "'DM Sans', sans-serif",
  color: "#0F172A", background: "#FAF8FF", outline: "none",
  transition: "border-color 0.2s", boxSizing: "border-box",
};

function ResetPasswordInner({ token, initialStatus }: { token: string; initialStatus: "valid" | "invalid" }) {
  const { push } = useRouter();

  const [status,   setStatus]   = useState<"valid" | "invalid" | "success">(initialStatus);
  const [pass,     setPass]     = useState("");
  const [pass2,    setPass2]    = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pass.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (pass !== pass2)   { setError("Las contraseñas no coinciden."); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al restablecer la contraseña."); return; }
      setStatus("success");
      setTimeout(() => push("/"), 2500);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        
        * { box-sizing: border-box; }
        body { margin:0; background: linear-gradient(135deg,#9333EA 0%,#EC4899 100%); min-height:100vh; }
        .card { background:white; border-radius:24px; width:100%; max-width:440px; box-shadow:0 32px 80px rgba(0,0,0,0.3); overflow:hidden; animation:cardIn .4s cubic-bezier(0.22,1,0.36,1); }
        @keyframes cardIn { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:none} }
        .card-header { background:linear-gradient(135deg,#9333EA 0%,#EC4899 100%); padding:28px 24px 20px; text-align:center; }
        .card-body { padding:28px 24px; }
        .btn { width:100%; padding:14px; background:#EC4899; color:white; border:none; border-radius:14px; font-size:15px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background-color .2s, transform .2s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .btn:hover:not(:disabled) { background:#9333EA; transform:translateY(-1px); }
        .btn:disabled { background:#FBCFE8; cursor:not-allowed; }
        .err { background:#FFF0F0; border:1px solid #FFCDD5; color:#C0392B; font-size:13px; border-radius:10px; padding:10px 14px; margin-bottom:16px; font-family:'DM Sans',sans-serif; }
        .spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,0.4); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
        .success-icon { width:72px; height:72px; border-radius:50%; background:#FDF2F8; border:3px solid #EC4899; display:flex; align-items:center; justify-content:center; font-size:32px; margin:0 auto 20px; }
        @keyframes spin { to{transform:rotate(360deg)} }
        @media (max-width: 480px) {
          .card { border-radius:16px; }
          .card-header { padding:20px 18px 16px; }
          .card-body { padding:20px 18px; }
          .btn { font-size:14px; padding:13px; }
          .wrap { align-items:flex-start !important; padding-top:24px !important; }
        }
      `}</style>

      <div className="wrap" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <div className="card">
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.6)", overflow: "hidden" }}>
                <Image src="/logo.png" alt="Logo" width={40} height={40} style={{ objectFit: "cover" }} />
              </div>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 600, color: "white" }}>VIVE +</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 16, fontFamily: "'DM Sans',sans-serif", margin: 0 }}>
              Restablecer contraseña
            </p>
          </div>

          <div className="card-body">
            {status === "invalid" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: "#0F172A", marginBottom: 12 }}>
                  Enlace no válido
                </h3>
                <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.7, fontFamily: "'DM Sans',sans-serif", marginBottom: 24 }}>
                  Este enlace ha caducado o ya fue utilizado. Solicita uno nuevo desde el login.
                </p>
                <button type="button" className="btn" onClick={() => push("/")}>
                  Volver al inicio
                </button>
              </div>
            )}

            {status === "success" && (
              <div style={{ textAlign: "center" }}>
                <div className="success-icon">✅</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: "#0F172A", marginBottom: 12 }}>
                  ¡Contraseña actualizada!
                </h3>
                <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.7, fontFamily: "'DM Sans',sans-serif" }}>
                  Tu contraseña se ha cambiado correctamente. Redirigiendo al inicio…
                </p>
              </div>
            )}

            {status === "valid" && (
              <form onSubmit={handleSubmit}>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: "#0F172A", marginBottom: 6, marginTop: 0 }}>
                  Crea una nueva contraseña
                </h3>
                <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif", marginBottom: 22 }}>
                  Elige una contraseña segura de al menos 6 caracteres.
                </p>
                {error && <div className="err">⚠️ {error}</div>}
                <div style={{ marginBottom: 14 }}>
                  <label htmlFor="rp-pass" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 7, fontFamily: "'DM Sans',sans-serif" }}>
                    Nueva contraseña
                  </label>
                  <input style={inputStyle} type="password" placeholder="Mínimo 6 caracteres"
                    id="rp-pass" value={pass} onChange={e => setPass(e.target.value)}
                    onFocus={ev => ev.target.style.borderColor = "#EC4899"}
                    onBlur={ev => ev.target.style.borderColor = "#EDE9FE"}
                    />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label htmlFor="rp-pass2" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 7, fontFamily: "'DM Sans',sans-serif" }}>
                    Repetir contraseña
                  </label>
                  <input style={inputStyle} type="password" placeholder="Repite la contraseña"
                    id="rp-pass2" value={pass2} onChange={e => setPass2(e.target.value)}
                    onFocus={ev => ev.target.style.borderColor = "#EC4899"}
                    onBlur={ev => ev.target.style.borderColor = "#EDE9FE"} />
                </div>
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? <><div className="spinner" /> Guardando…</> : "Guardar nueva contraseña"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage({ token, initialStatus }: { token: string; initialStatus: "valid" | "invalid" }) {
  return <ResetPasswordInner token={token} initialStatus={initialStatus} />;
}
