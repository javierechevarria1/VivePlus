"use client";

import Link from "next/link";
import { DOCUMENTOS, type Bloque, type Documento } from "@/frontend/src/content/legal";

// Una sola pantalla para los cinco documentos legales. Antes solo se podían
// leer dentro del modal del registro, en un <pre> a cuerpo 12: quien no se
// registraba no los veía, y quien los abría no los leía.
//
// El público de esta plataforma tiene 55 años o más, así que aquí el tamaño de
// letra y el interlineado no son decoración: son la diferencia entre que se
// lea y que no.

const OTROS: { slug: string; texto: string }[] = [
  { slug: "devoluciones", texto: "Devoluciones y reembolsos" },
  { slug: "privacidad",   texto: "Privacidad" },
  { slug: "cookies",      texto: "Cookies" },
  { slug: "terminos",     texto: "Términos de uso" },
  { slug: "aviso-legal",  texto: "Aviso legal" },
];

// Los textos llevan **negritas** para marcar lo que no se puede pasar por alto.
// Se resuelven aquí y no con una librería de markdown: es lo único que hace
// falta y añadir una dependencia por esto no sale a cuenta.
// Cada trozo se identifica por donde empieza dentro del texto: dos trozos
// pueden decir lo mismo, o quedar vacios cuando el texto abre o cierra con
// negrita, pero nunca comparten posicion.
function partirEnTrozos(texto: string) {
  const trozos: { contenido: string; desde: number; negrita: boolean }[] = [];
  let desde = 0;
  texto.split("**").forEach((contenido, i) => {
    trozos.push({ contenido, desde, negrita: i % 2 === 1 });
    desde += contenido.length + 2;
  });
  return trozos;
}

function ConNegritas({ texto }: { texto: string }) {
  const trozos = partirEnTrozos(texto);

  return (
    <>
      {trozos.map(t =>
        t.negrita
          ? <strong key={t.desde} style={{ fontWeight: 700, color: "#0F172A" }}>{t.contenido}</strong>
          : <span key={t.desde}>{t.contenido}</span>
      )}
    </>
  );
}

// Los bloques no llevan identificador propio: dentro de una seccion los
// distingue su contenido.
const claveBloque = (b: Bloque) =>
  b.tipo === "parrafo" || b.tipo === "destacado"
    ? `${b.tipo}:${b.texto}`
    : `${b.tipo}:${b.puntos.join("|")}`;

function BloqueLegal({ bloque }: { bloque: Bloque }) {
  if (bloque.tipo === "parrafo") {
    return (
      <p style={{ margin: "0 0 16px", fontSize: 17, lineHeight: 1.75, color: "#334155", whiteSpace: "pre-line" }}>
        <ConNegritas texto={bloque.texto} />
      </p>
    );
  }

  if (bloque.tipo === "destacado") {
    return (
      <div style={{
        background: "#FDF2F8", border: "1.5px solid #FBCFE8", borderRadius: 14,
        padding: "16px 20px", margin: "0 0 20px",
        fontSize: 17, lineHeight: 1.7, color: "#9D174D",
      }}>
        <ConNegritas texto={bloque.texto} />
      </div>
    );
  }

  if (bloque.tipo === "lista") {
    return (
      <ul style={{ margin: "0 0 18px", padding: "0 0 0 4px", listStyle: "none", display: "flex", flexDirection: "column", gap: 11 }}>
        {bloque.puntos.map(p => (
          <li key={p} style={{ display: "flex", gap: 12, fontSize: 17, lineHeight: 1.7, color: "#334155" }}>
            <span aria-hidden style={{ color: "#EC4899", fontWeight: 700, flexShrink: 0 }}>•</span>
            <span><ConNegritas texto={p} /></span>
          </li>
        ))}
      </ul>
    );
  }

  // Pasos: numerados y bien separados, porque se leen con el paquete delante.
  return (
    <ol style={{ margin: "0 0 20px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
      {bloque.puntos.map((p, i) => (
        <li key={p} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <span
            aria-hidden
            style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg, #EC4899 0%, #9333EA 100%)",
              color: "white", fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginTop: 2,
            }}
          >
            {i + 1}
          </span>
          <span style={{ fontSize: 17, lineHeight: 1.7, color: "#334155", paddingTop: 3 }}>
            <ConNegritas texto={p} />
          </span>
        </li>
      ))}
    </ol>
  );
}

export function PaginaLegal({ slug }: { slug: string }) {
  const doc: Documento | undefined = DOCUMENTOS[slug];
  if (!doc) return null;

  return (
    // La barra de navegación va fija (top 16 + 60 de alto) por encima del
    // contenido, así que el relleno superior va aquí, en el elemento exterior
    // —el mismo sitio donde lo tiene «Mis pedidos»— y no en el interior, donde
    // un margen del hijo puede colapsar y dejar el título debajo de la barra.
    <div
      style={{
        background: "#FBFAFE",
        minHeight: "100vh",
        fontFamily: "'DM Sans', sans-serif",
        padding: "140px 24px 80px",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        <header style={{ marginBottom: 40 }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(34px, 6vw, 48px)", fontWeight: 600,
            color: "#0F172A", margin: "0 0 14px", lineHeight: 1.15,
          }}>
            {doc.titulo}
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.65, color: "#475569", margin: "0 0 20px" }}>
            {doc.resumen}
          </p>
          <p style={{ fontSize: 14, color: "#94A3B8", margin: 0, paddingTop: 18, borderTop: "1px solid #E9E6F2" }}>
            Última actualización: {doc.actualizado}
          </p>
        </header>

        {doc.secciones.map((seccion) => (
          <section key={seccion.titulo} style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 22, fontWeight: 700, color: "#0F172A",
              margin: "0 0 16px", lineHeight: 1.3,
            }}>
              {seccion.titulo}
            </h2>
            {seccion.bloques.map(bloque => <BloqueLegal key={claveBloque(bloque)} bloque={bloque} />)}
          </section>
        ))}

        <nav style={{ paddingTop: 32, borderTop: "1px solid #E9E6F2" }}>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8", margin: "0 0 16px" }}>
            Otras páginas
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: 10 }}>
            {OTROS.filter(o => o.slug !== slug).map(o => (
              <li key={o.slug}>
                <Link
                  href={`/${o.slug}`}
                  style={{
                    display: "inline-block", padding: "9px 16px", borderRadius: 999,
                    background: "white", border: "1.5px solid #EDE9FE",
                    fontSize: 15, fontWeight: 600, color: "#7C3AED", textDecoration: "none",
                  }}
                >
                  {o.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

      </div>
    </div>
  );
}
