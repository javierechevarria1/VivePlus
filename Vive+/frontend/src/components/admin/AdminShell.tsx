"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Home, ShieldCheck } from "lucide-react";
import { C, T, R, FONT, SOMBRA, carta, type Tono, TONOS } from "./ui";
import { SECCIONES_ADMIN, TODAS_LAS_SECCIONES } from "./secciones";

export type Kpi = {
  etiqueta: string;
  valor: React.ReactNode;
  tono?: Tono;
  pie?: string;
  // Distintivo corto arriba a la derecha («Urgente», «+18 %»…).
  marca?: { texto: string; tono: Tono };
};

const ANCHO_LATERAL = 244;

const CSS = `
.adm-raiz *, .adm-raiz *::before, .adm-raiz *::after { box-sizing: border-box; }

.adm-nav-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 9px 11px; border-radius: 10px;
  font-size: 13.5px; font-weight: 600; color: ${C.suave};
  text-decoration: none; white-space: nowrap;
  transition: background-color .15s, color .15s;
}
.adm-nav-item:hover { background: ${C.marcaSuave}; color: ${C.marca}; }
.adm-nav-item[aria-current="page"] { background: ${C.marcaSuave}; color: ${C.marca}; }

.adm-fila { transition: border-color .15s, box-shadow .15s; }
.adm-fila:hover { box-shadow: ${SOMBRA.alzada}; }

.adm-icono:hover:not(:disabled) { background: ${C.marcaSuave}; color: ${C.marca}; border-color: ${C.marcaBorde}; }
.adm-icono-peligro:hover:not(:disabled) { background: ${C.errorSuave}; color: ${C.error}; border-color: #FBD5D5; }

.adm-raiz button:focus-visible,
.adm-raiz a:focus-visible,
.adm-raiz input:focus-visible,
.adm-raiz select:focus-visible,
.adm-raiz textarea:focus-visible {
  outline: 2px solid ${C.marca}; outline-offset: 2px;
}
.adm-raiz input:focus, .adm-raiz select:focus, .adm-raiz textarea:focus {
  border-color: ${C.marca}; box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
}

.adm-latido { background: ${C.bordeTenue}; animation: adm-latido 1.4s ease-in-out infinite; }
@keyframes adm-latido { 0%, 100% { opacity: 1 } 50% { opacity: .45 } }
@keyframes adm-giro { to { transform: rotate(360deg) } }
.adm-giro { animation: adm-giro .8s linear infinite; }
@keyframes adm-entra { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
.adm-entra { animation: adm-entra .25s ease both; }

@media (prefers-reduced-motion: reduce) {
  .adm-latido, .adm-giro, .adm-entra { animation: none; }
}

/* Por debajo de 1000px la columna lateral pasa a ser una tira horizontal
   con scroll sobre el contenido. */
@media (max-width: 1000px) {
  .adm-marco { flex-direction: column !important; }
  .adm-lateral {
    width: 100% !important; position: static !important; height: auto !important;
    border-right: none !important; border-bottom: 1px solid ${C.borde} !important;
    padding: 14px 16px !important; gap: 14px !important;
  }
  .adm-nav { flex-direction: row !important; gap: 6px !important; overflow-x: auto; padding-bottom: 4px; }
  .adm-nav-grupo { display: contents; }
  .adm-nav-titulo, .adm-pie-lateral { display: none !important; }
}

@media (max-width: 860px) {
  .adm-metricas { gap: 14px !important; }
}

@media (max-width: 640px) {
  .adm-cabecera { flex-direction: column; align-items: flex-start !important; }
  .adm-acciones { width: 100%; }
  .adm-fila-interior { flex-wrap: wrap; }
  .adm-fila-principal { flex-basis: 100% !important; }
  .adm-metricas { gap: 20px !important; margin-left: auto; }
}
`;

function Lateral({ activo }: { activo: string }) {
  return (
    <aside
      className="adm-lateral"
      style={{
        width: ANCHO_LATERAL, flexShrink: 0, alignSelf: "stretch",
        background: C.superficie, borderRight: `1px solid ${C.borde}`,
        display: "flex", flexDirection: "column", gap: 22,
        padding: "22px 16px 24px",
        position: "sticky", top: 0, height: "100vh",
      }}
    >
      <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 6px", textDecoration: "none" }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: `linear-gradient(135deg, ${C.marca}, ${C.accion})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ShieldCheck size={19} color="#fff" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: C.texto, letterSpacing: "-0.01em" }}>Relatia 55</div>
          <div style={{ fontSize: 11.5, color: C.tenue, fontWeight: 500 }}>Panel de administración</div>
        </div>
      </Link>

      <nav className="adm-nav" aria-label="Secciones de administración" style={{ display: "flex", flexDirection: "column", gap: 3, overflowY: "auto" }}>
        <Link href="/admin" className="adm-nav-item" aria-current={activo === "/admin" ? "page" : undefined}>
          <Home size={16} style={{ flexShrink: 0 }} />
          Inicio
        </Link>

        {SECCIONES_ADMIN.map(({ grupo, entradas }) => (
          <div key={grupo} className="adm-nav-grupo" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div className="adm-nav-titulo" style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#B4A7D6", padding: "14px 10px 6px",
            }}>
              {grupo}
            </div>
            {entradas.map(({ href, texto, Icono }) => (
              <Link key={href} href={href} className="adm-nav-item" aria-current={href === activo ? "page" : undefined}>
                <Icono size={16} style={{ flexShrink: 0 }} />
                {texto}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="adm-pie-lateral" style={{ marginTop: "auto" }}>
        <Link
          href="/"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            background: C.velo, border: `1px solid ${C.borde}`, borderRadius: 13,
            padding: "11px 14px", fontSize: 12.5, fontWeight: 600,
            color: C.suave, textDecoration: "none",
          }}
        >
          Volver al sitio <ExternalLink size={13} />
        </Link>
      </div>
    </aside>
  );
}

function FilaKpis({ kpis }: { kpis: Kpi[] }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(196px, 1fr))",
      gap: 14,
      marginBottom: 22,
    }}>
      {kpis.map(k => (
        <div key={k.etiqueta} style={{ ...carta, padding: "16px 17px", display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.suave }}>{k.etiqueta}</span>
            {k.marca && (
              <span style={{
                fontSize: 11, fontWeight: 700, borderRadius: R.pildora, padding: "2px 8px",
                background: TONOS[k.marca.tono].bg, color: TONOS[k.marca.tono].color, whiteSpace: "nowrap",
              }}>
                {k.marca.texto}
              </span>
            )}
          </div>
          <div style={{
            fontSize: 29, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
            color: k.tono ? TONOS[k.tono].color : C.texto,
          }}>
            {k.valor}
          </div>
          {k.pie && <div style={{ fontSize: 12, color: C.tenue }}>{k.pie}</div>}
        </div>
      ))}
    </div>
  );
}

// Solo para saludar por su nombre a quien entra; la autorización ya la resolvió
// el Server Component antes de renderizar nada de esto. Se lee con
// `useSyncExternalStore` porque sessionStorage no existe en el servidor: así el
// primer render coincide con el del servidor y no hace falta corregirlo después.
const SIN_SUSCRIPCION = () => () => {};
const leerUsuario = () => sessionStorage.getItem("r65_user:v1") ?? "";
const sinUsuario = () => "";

function Identidad() {
  const bruto = useSyncExternalStore(SIN_SUSCRIPCION, leerUsuario, sinUsuario);

  const nombre = useMemo(() => {
    if (!bruto) return "";
    try {
      return (JSON.parse(bruto)?.username as string) ?? "";
    } catch {
      return "";
    }
  }, [bruto]);

  const iniciales = nombre
    .split(" ").filter(Boolean).slice(0, 2)
    .map(p => p.charAt(0).toUpperCase()).join("");

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      background: C.superficie, border: `1px solid ${C.borde}`, borderRadius: 11,
      padding: "6px 12px 6px 7px",
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, #DDD6FE, #FBCFE8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11.5, fontWeight: 700, color: "#5B21B6",
      }}>
        {iniciales || "AD"}
      </span>
      <div style={{ lineHeight: 1.25 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.texto }}>{nombre || "Administración"}</div>
        <div style={{ fontSize: 11, color: C.tenue }}>Administrador</div>
      </div>
    </div>
  );
}

export function AdminShell({
  titulo, descripcion, acciones, kpis, enlacePublico, serif, children,
}: {
  titulo: string;
  descripcion?: React.ReactNode;
  acciones?: React.ReactNode;
  kpis?: Kpi[];
  enlacePublico?: { href: string; texto: string };
  /** El inicio usa la serif de la marca; los listados, la de trabajo. */
  serif?: boolean;
  children: React.ReactNode;
}) {
  const ruta = usePathname() ?? "";
  const actual = ruta === "/admin"
    ? { href: "/admin", texto: "Inicio" }
    : TODAS_LAS_SECCIONES.find(e => ruta.startsWith(e.href));

  return (
    <div className="adm-raiz" style={{ minHeight: "100vh", background: C.lienzo, fontFamily: FONT, color: C.texto }}>
      <style>{CSS}</style>

      <div className="adm-marco" style={{ display: "flex", alignItems: "flex-start", minHeight: "100vh" }}>
        <Lateral activo={actual?.href ?? ""} />

        <main style={{ flex: 1, minWidth: 0, paddingBottom: 56 }}>
          <header style={{
            position: "sticky", top: 0, zIndex: 5,
            background: "rgba(247,246,251,0.92)", backdropFilter: "blur(8px)",
            borderBottom: `1px solid ${C.borde}`,
            display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
            padding: "12px clamp(16px,3vw,32px)",
          }}>
            <span style={{ fontSize: T.micro, color: C.tenue, flex: 1, minWidth: 120 }}>
              Administración{actual ? ` · ${actual.texto}` : ""}
            </span>
            {enlacePublico && (
              <Link
                href={enlacePublico.href}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: C.superficie, border: `1px solid ${C.borde}`, borderRadius: 11,
                  padding: "8px 13px", fontSize: T.dato, fontWeight: 600,
                  color: C.suave, textDecoration: "none",
                }}
              >
                {enlacePublico.texto} <ExternalLink size={13} />
              </Link>
            )}
            <Identidad />
          </header>

          <div className="adm-entra" style={{ padding: "clamp(20px,3vw,30px) clamp(16px,3vw,32px) 0" }}>
            <div
              className="adm-cabecera"
              style={{
                display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                gap: 16, flexWrap: "wrap", marginBottom: 22,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h1 style={{
                  margin: "0 0 4px",
                  color: C.texto,
                  letterSpacing: "-0.01em",
                  ...(serif
                    ? { fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem,3.4vw,2.3rem)", fontWeight: 600 }
                    : { fontSize: T.titulo, fontWeight: 700 }),
                }}>
                  {titulo}
                </h1>
                {descripcion && (
                  <p style={{ fontSize: 13.5, color: C.suave, margin: 0, lineHeight: 1.6 }}>
                    {descripcion}
                  </p>
                )}
              </div>

              {acciones && (
                <div className="adm-acciones" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {acciones}
                </div>
              )}
            </div>

            {kpis && kpis.length > 0 && <FilaKpis kpis={kpis} />}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export { R, T, C };
