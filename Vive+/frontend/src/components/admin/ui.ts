// Sistema de diseño del panel de administración.
//
// Antes cada página admin repetía sus propios `btnPrimaryStyle`, `inputStyle`,
// `labelStyle`… palabra por palabra. Aquí viven una sola vez para que un cambio
// de radio o de color no haya que perseguirlo por nueve archivos.

export const FONT = "'DM Sans', sans-serif";

// ── Color ─────────────────────────────────────────────────────────────────────
// Cada tono tiene un papel: el violeta es navegación y estado, el rosa se
// reserva para la acción principal y las cifras de dinero. Cuando el rosa lo
// pinta todo deja de significar «esto es lo importante».
export const C = {
  lienzo:     "#F7F6FB",
  superficie: "#FFFFFF",
  velo:       "#FBFAFE",

  texto:    "#0F172A",
  suave:    "#64748B",
  tenue:    "#94A3B8",

  borde:     "#E9E6F2",
  bordeTenue:"#F1EEF9",

  marca:      "#7C3AED",
  marcaSuave: "#F3EEFF",
  marcaBorde: "#E4DAFB",

  accion:      "#EC4899",
  accionHover: "#DB2777",
  accionSuave: "#FDF2F8",

  ok:        "#059669",
  okSuave:   "#ECFDF5",
  aviso:     "#B45309",
  avisoSuave:"#FFFBEB",
  error:     "#DC2626",
  errorSuave:"#FEF2F2",
  info:      "#0369A1",
  infoSuave: "#F0F9FF",
} as const;

// ── Escala ────────────────────────────────────────────────────────────────────
// Cinco tamaños, no diez. El ruido de 11/11,5/12/12,5/13/13,5 no aportaba
// jerarquía, solo desalineaba las filas entre sí.
export const T = {
  titulo:  24,
  seccion: 16,
  cuerpo:  14,
  dato:    13,
  micro:   12,
} as const;

export const R = { chico: 8, medio: 12, grande: 16, pildora: 999 } as const;

export const SOMBRA = {
  carta:  "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.03)",
  alzada: "0 4px 16px rgba(15,23,42,0.06), 0 12px 32px rgba(15,23,42,0.05)",
  modal:  "0 24px 64px rgba(15,23,42,0.18)",
} as const;

// ── Superficies ───────────────────────────────────────────────────────────────

export const carta: React.CSSProperties = {
  background: C.superficie,
  border: `1px solid ${C.borde}`,
  borderRadius: R.grande,
  boxShadow: SOMBRA.carta,
};

export const seccionTitulo: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: T.micro,
  fontWeight: 700,
  color: C.tenue,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

// ── Botones ───────────────────────────────────────────────────────────────────

const botonBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  borderRadius: R.chico,
  padding: "9px 15px",
  fontSize: T.dato,
  fontWeight: 700,
  fontFamily: FONT,
  cursor: "pointer",
  textDecoration: "none",
  whiteSpace: "nowrap",
  border: "1px solid transparent",
  transition: "background-color .15s, border-color .15s, color .15s",
};

export const btnPrimario: React.CSSProperties = {
  ...botonBase,
  background: C.accion,
  color: "#FFFFFF",
};

export const btnSecundario: React.CSSProperties = {
  ...botonBase,
  background: C.superficie,
  color: C.suave,
  borderColor: C.borde,
};

export const btnFantasma: React.CSSProperties = {
  ...botonBase,
  background: "transparent",
  color: C.marca,
  padding: "9px 10px",
};

export const btnPeligro: React.CSSProperties = {
  ...botonBase,
  background: C.error,
  color: "#FFFFFF",
};

export const btnMini: React.CSSProperties = {
  ...botonBase,
  gap: 5,
  padding: "6px 11px",
  fontSize: T.micro,
  background: C.marcaSuave,
  color: C.marca,
};

export const btnIcono: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: R.chico,
  background: "transparent",
  color: C.suave,
  border: `1px solid ${C.borde}`,
  cursor: "pointer",
  transition: "background-color .15s, color .15s, border-color .15s",
};

// ── Formulario ────────────────────────────────────────────────────────────────

export const campo: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: `1px solid ${C.borde}`,
  borderRadius: R.chico,
  fontSize: T.dato,
  fontFamily: FONT,
  color: C.texto,
  background: C.superficie,
  outline: "none",
  transition: "border-color .15s, box-shadow .15s",
};

export const etiqueta: React.CSSProperties = {
  display: "block",
  fontSize: T.micro,
  fontWeight: 600,
  color: C.suave,
  marginBottom: 6,
};

// Los formularios usaban `1fr 1fr` fijo, que en móvil deja los campos a la
// mitad de ancho. `auto-fit` los apila solos cuando no caben.
export const rejillaCampos: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

export const anchoCompleto: React.CSSProperties = { gridColumn: "1 / -1" };

// ── Distintivos ───────────────────────────────────────────────────────────────

export type Tono = "neutro" | "marca" | "ok" | "aviso" | "error" | "info";

export const TONOS: Record<Tono, { bg: string; color: string }> = {
  neutro: { bg: "#F1F5F9",     color: C.suave },
  marca:  { bg: C.marcaSuave,  color: C.marca },
  ok:     { bg: C.okSuave,     color: C.ok },
  aviso:  { bg: C.avisoSuave,  color: C.aviso },
  error:  { bg: C.errorSuave,  color: C.error },
  info:   { bg: C.infoSuave,   color: C.info },
};

export const distintivo = (tono: Tono = "neutro"): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: TONOS[tono].bg,
  color: TONOS[tono].color,
  borderRadius: R.pildora,
  padding: "3px 9px",
  fontSize: T.micro,
  fontWeight: 700,
  lineHeight: 1.4,
  whiteSpace: "nowrap",
});

// Las cifras en columna solo se leen si comparten ancho de dígito.
export const cifra: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };

export const dinero: React.CSSProperties = {
  ...cifra,
  fontWeight: 700,
  color: C.accion,
};
