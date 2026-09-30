"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, ShoppingBag, ArrowLeft } from "lucide-react";

const CC_ICON_BOX: React.CSSProperties = {
  width: 72, height: 72, borderRadius: "50%", background: "#FFF0F0",
  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
};

const CC_STORE_LINK: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  background: "linear-gradient(135deg, #EC4899 0%, #9333EA 100%)",
  color: "white", borderRadius: 12, padding: "13px 20px",
  fontSize: 14, fontWeight: 700, textDecoration: "none",
  boxShadow: "0 6px 20px rgba(236,72,153,0.28)",
};

export default function CompraCancelado() {
  const searchParams = useSearchParams();
  const ordenId = searchParams.get("orden_id");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!ordenId) { setDone(true); return; }
    let cancelled = false;
    fetch(`/api/ordenes?id=${ordenId}`, { method: "DELETE" })
      .finally(() => { if (!cancelled) setDone(true); });
    return () => { cancelled = true; };
  }, [ordenId]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#FAF8FF", fontFamily: "'DM Sans', sans-serif", padding: "24px",
    }}>
      <div style={{
        background: "white", borderRadius: 20, padding: "48px 40px", maxWidth: 440, width: "100%",
        textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
      }}>
        <div style={CC_ICON_BOX}>
          <XCircle size={36} color="#E74C3C" />
        </div>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600,
          color: "#0F172A", margin: "0 0 12px",
        }}>
          Pago cancelado
        </h1>

        <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, margin: "0 0 32px" }}>
          Has cancelado el proceso de pago.{" "}
          {done ? "Tu reserva ha sido eliminada." : "Eliminando tu reserva…"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link href="/marketplace" style={CC_STORE_LINK}>
            <ShoppingBag size={15} /> Volver a la tienda
          </Link>

          <Link href="/" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            color: "#64748B", fontSize: 13, textDecoration: "none",
          }}>
            <ArrowLeft size={13} /> Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
