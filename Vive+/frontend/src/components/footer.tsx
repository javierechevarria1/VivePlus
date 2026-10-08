"use client";
import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin, Heart } from "lucide-react";
import { useState, useEffect } from "react";

const SERVICES = [
  { href: "/salud",          label: "Salud y bienestar" },
  { href: "/comunidad",      label: "Comunidad" },
  { href: "/marketplace",    label: "Marketplace" },
  { href: "/segunda-mano",   label: "Segunda Mano" },
  { href: "/recursos",       label: "Actividades" },
  { href: "/organizaciones", label: "Organizaciones" },
  { href: "/cotizador",      label: "Cotizador de hogar" },
];

const COMPANY_BASE = [
  { href: "/sobre-nosotros", label: "Sobre nosotros" },
  { href: "/contacto",       label: "Contacto" },
  { href: "/comunidad",      label: "Comunidad" },
];

// Páginas de verdad, no ventanas emergentes: un texto legal tiene que poder
// leerse sin registrarse, enlazarse y guardarse. «Política de cookies» ya
// apuntaba a /cookies, que no existía y daba 404 desde el pie y desde el
// banner de cookies.
const LEGAL: { label: string; href: string }[] = [
  { label: "Devoluciones",        href: "/devoluciones" },
  { label: "Aviso Legal",         href: "/aviso-legal" },
  { label: "Privacidad",          href: "/privacidad" },
  { label: "Términos de uso",     href: "/terminos" },
  { label: "Política de cookies", href: "/cookies" },
];



const SOCIALS = [
  { href: "https://www.linkedin.com/in/javier-echevarría-traspuesto-ab3755258/", icon: Linkedin, label: "LinkedIn" },
  { href: "https://github.com/javierechevarria1", icon: Github, label: "GitHub" },
];

export default function Footer() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("r65_user:v1");
    if (raw) {
      try { setIsAdmin(JSON.parse(raw)?.rol === "admin"); } catch { /* noop */ }
    }
  }, []);

  const COMPANY = isAdmin
    ? COMPANY_BASE.filter((l) => l.href !== "/contacto")
    : COMPANY_BASE;

  return (
    <>
      <style>{`
        

        .ft-root {
          background: #0D0A1E;
          color: white;
          padding: 64px 40px 28px;
          font-family: 'DM Sans', sans-serif;
        }

        .ft-link {
          font-size: 15px;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          transition: color 0.2s ease, padding-left 0.2s ease;
          display: inline-block;
        }
        .ft-link:hover {
          color: rgba(255,255,255,0.9);
          padding-left: 4px;
        }

        .ft-heading {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          margin: 0 0 18px;
        }

        .ft-social {
          width: 42px; height: 42px; border-radius: 10px;
          background: rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
          flex-shrink: 0;
        }
        .ft-social:hover {
          background: #EC4899;
          color: white;
          transform: translateY(-3px);
        }

        .ft-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 48px 0 24px;
        }

        .ft-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .ft-bottom p { font-size: 14px; color: rgba(255,255,255,0.25); margin: 0; }

        @media (max-width: 900px) {
          .ft-grid { grid-template-columns: 1fr 1fr 1fr !important; }
          .ft-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 560px) {
          .ft-grid { grid-template-columns: 1fr 1fr !important; }
          .ft-root  { padding: 48px 24px 24px; }
        }
        @media (max-width: 360px) {
          .ft-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <footer className="ft-root">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          <div className="ft-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "40px 48px" }}>

            <div className="ft-brand">
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.15)", overflow: "hidden", flexShrink: 0 }}>
                  <Image src="/logo.png" alt="Logo" width={44} height={44} priority style={{ borderRadius: "50%", objectFit: "cover" }} />
                </div>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                  VIVE +
                </span>
              </Link>

              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.38)", lineHeight: 1.75, maxWidth: 260, margin: "0 0 24px" }}>
                Conectamos a personas mayores con su comunidad para vivir con más energía, disfrute y conexión real en Santander.
              </p>

              <div style={{ display: "flex", gap: 8 }}>
                {SOCIALS.map(({ href, icon: Icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="ft-social">
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: "Servicios", links: SERVICES },
              { title: "Empresa",   links: COMPANY },
              { title: "Legal",     links: LEGAL },
            ].map((col) => (
              <div key={col.title}>
                <p className="ft-heading">{col.title}</p>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="ft-link">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>

          <div className="ft-divider" />

          <div className="ft-bottom">
            <p suppressHydrationWarning>© {new Date().getFullYear()} Vive +. Todos los derechos reservados.</p>
            <p>Hecho con <Heart size={11} style={{ display: "inline", color: "#E74C3C", verticalAlign: "middle" }} /> en Santander</p>
          </div>

        </div>
      </footer>
    </>
  );
}
