"use client";

import Link from "next/link";
import { usePlan } from "./usePlan";

interface PlanGateProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

const GATE_CONTAINER: React.CSSProperties = {
  minHeight: "60vh", display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
  gap: 20, padding: "140px 24px 60px", textAlign: "center",
  background: "linear-gradient(160deg, #faf5ff 0%, #fff0f6 100%)",
};

const GATE_ICON: React.CSSProperties = {
  width: 72, height: 72, borderRadius: "50%",
  background: "linear-gradient(135deg, #9333EA 0%, #EC4899 100%)",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 12px 36px rgba(147,51,234,0.25)",
  fontSize: 32,
};

const GATE_LINK: React.CSSProperties = {
  marginTop: 8,
  background: "linear-gradient(135deg, #9333EA 0%, #EC4899 100%)",
  color: "white",
  padding: "13px 36px", borderRadius: 99, fontWeight: 600,
  fontSize: 15, textDecoration: "none", fontFamily: "'DM Sans', sans-serif",
  boxShadow: "0 8px 28px rgba(236,72,153,0.30)",
  display: "inline-block",
};

// La pantalla explica por que no se ve la seccion y ofrece el enlace a planes.
// Antes ademas saltaba sola a /planes a los diez segundos: eso apartaba al
// usuario mientras leia, y como era un push, volver atras le devolvia aqui para
// echarlo otra vez. Ahora la navegacion la decide el, con el boton.
export default function PlanGate({ children, fallback }: PlanGateProps) {
  const { hasPlan, isAuthed, ready } = usePlan();

  if (!ready) return null;

  if (!hasPlan) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div style={GATE_CONTAINER}>
        <div style={GATE_ICON}>🔒</div>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#1F1B17", margin: 0, fontFamily: "'Cormorant Garamond', serif" }}>
          Contenido exclusivo para suscriptores
        </p>
        <p style={{ fontSize: 15, color: "#64748B", margin: 0, maxWidth: 380, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>
          {isAuthed
            ? "Activa un plan para acceder a esta sección y disfrutar de todas las funcionalidades de Relatia55."
            : "Crea una cuenta gratuita o inicia sesión para acceder a esta sección."}
        </p>
        <Link href="/planes" style={GATE_LINK}>
          Ver planes y precios
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
