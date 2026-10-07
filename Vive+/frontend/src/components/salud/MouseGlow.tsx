"use client";

import { useRef, useEffect } from "react";

// Resplandor que sigue al cursor (extraído de salud.tsx).
const SL_MOUSE_GLOW: React.CSSProperties = { position: "fixed", pointerEvents: "none", zIndex: 0, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)", transform: "translate(-50%,-50%)", transition: "none" };

export function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let ticking = false;
    const move = (evento: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (ref.current) Object.assign(ref.current.style, { left: evento.clientX + "px", top: evento.clientY + "px" });
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={ref} style={SL_MOUSE_GLOW} />;
}
