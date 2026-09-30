"use client";

import Image from "next/image";
import { X, Star, CheckCircle } from "lucide-react";
import { type ValorarTarget } from "./helpers";

// Modal de valoración del cuidador (extraído de salud.tsx).
const SL_CLOSE_BTN: React.CSSProperties = { position: "absolute", top: 16, right: 16, background: "var(--sand)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const SL_VALOR_SUBMIT_BASE: React.CSSProperties = { width: "100%", padding: "13px", borderRadius: 14, border: "none", color: "white", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };

export function ValorarModal({
  valorarOpen,
  valorModalRef,
  setValorarOpen,
  valorForm,
  setValorForm,
  submittingValor,
  valorSuccess,
  setValorSuccess,
  handleValoracion,
}: {
  valorarOpen: ValorarTarget;
  valorModalRef: React.RefObject<HTMLDialogElement | null>;
  setValorarOpen: (v: ValorarTarget | null) => void;
  valorForm: { rating: number; comentario: string };
  setValorForm: React.Dispatch<React.SetStateAction<{ rating: number; comentario: string }>>;
  submittingValor: boolean;
  valorSuccess: boolean;
  setValorSuccess: (v: boolean) => void;
  handleValoracion: () => void;
}) {
  const close = () => { setValorarOpen(null); setValorForm({ rating: 0, comentario: "" }); setValorSuccess(false); };

  return (
    <dialog ref={valorModalRef} aria-label={`Valorar a ${valorarOpen.name}`}
      className="salud-valorar-dialog"
      onCancel={e => { e.preventDefault(); close(); }}
    >
      <button type="button" onClick={close}
        aria-label="Cerrar" style={SL_CLOSE_BTN}>
        <X size={15} color="var(--muted)" />
      </button>

      {valorSuccess ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <CheckCircle size={48} color="#EC4899" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--slate)", marginBottom: 8 }}>¡Gracias por tu valoración!</h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "var(--muted)" }}>Tu opinión ayuda a mejorar nuestro servicio.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <Image src={valorarOpen.photo} alt={valorarOpen.name} width={52} height={52} style={{ borderRadius: "50%", objectFit: "cover", border: `3px solid ${valorarOpen.color}30` }} />
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--slate)", margin: 0 }}>{valorarOpen.name}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--muted)", margin: 0 }}>{valorarOpen.specialty}</p>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>TU VALORACIÓN</p>
            <div style={{ display: "flex", gap: 8 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setValorForm(f => ({ ...f, rating: s }))}
                  aria-label={`Valorar con ${s} estrella${s === 1 ? "" : "s"}`}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, transition: "transform 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.2)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}>
                  <Star size={32} fill={s <= valorForm.rating ? "#F5A623" : "none"} color={s <= valorForm.rating ? "#F5A623" : "#DDD"} />
                </button>
              ))}
            </div>
            {valorForm.rating === 0 && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#E74C3C", marginTop: 6 }}>Selecciona una valoración</p>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="salud-valor-comentario" style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>COMENTARIO (opcional)</label>
            <textarea
              id="salud-valor-comentario"
              value={valorForm.comentario}
              onChange={e => setValorForm(f => ({ ...f, comentario: e.target.value }))}
              placeholder="Cuéntanos tu experiencia con este profesional..."
              rows={4}
              className="salud-textarea"
            />
          </div>

          <button
            type="button"
            onClick={handleValoracion}
            disabled={submittingValor || valorForm.rating === 0}
            style={{ ...SL_VALOR_SUBMIT_BASE, background: valorForm.rating === 0 ? "var(--sand)" : valorarOpen.color, cursor: valorForm.rating === 0 ? "default" : "pointer", boxShadow: valorForm.rating === 0 ? "none" : `0 6px 20px ${valorarOpen.color}40` }}
          >
            {submittingValor ? "Enviando…" : <><Star size={15} fill="white" color="white" /> Enviar valoración</>}
          </button>
        </>
      )}
    </dialog>
  );
}
