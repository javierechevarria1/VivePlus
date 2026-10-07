"use client";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown, Menu, X,
  Heart, Package, Phone,
  ShoppingCart, LogOut, LogIn, MessageSquare,
} from "lucide-react";
import { useCart } from "./useCart";
import { CartDrawer } from "./CartDrawer";
import ProfileModal from "./ProfileModal";
import { usuarioService } from "@/frontend/src/services/usuarioService";

const NAV_LINKS = [
  { href: "/salud",        label: "Salud y bienestar" },
  { href: "/comunidad",    label: "Comunidad"         },
  { href: "/segunda-mano", label: "Segunda Mano"      },
];

// La cuenta de médico es una cuenta de trabajo: atiende consultas, no compra ni
// vende. Con ella la tienda entera —marketplace, segunda mano, carrito y sus
// pedidos— sobra en la navegación.
const usaLaTienda = (rol?: string) => rol !== "medico";


const NB_HEADER_BASE: React.CSSProperties = { position: "fixed", top: 16, left: 0, right: 0, zIndex: 40, height: 60, background: "transparent", transition: "transform 0.35s cubic-bezier(.22,1,.36,1)", padding: "0 16px" };
const NB_INNER_NAV: React.CSSProperties = { maxWidth: 1300, margin: "4px auto", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0, borderRadius: "999px", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 8px 32px -8px rgba(31,38,135,0.18), inset 0 1px 0 rgba(255,255,255,0.5)" };
const NB_CART_BADGE: React.CSSProperties = { position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: "#EC4899", color: "white", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", border: "2px solid white" };
const NB_MOB_USER_ROW: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#FDF2F8", borderRadius: 12, border: "1.5px solid #FBCFE8", margin: "8px 0 4px", cursor: "pointer" };
const NB_MOB_AVATAR: React.CSSProperties = { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #9333EA, #0F172A)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, fontWeight: 700, flexShrink: 0, overflow: "hidden", position: "relative" };
const NB_ADMIN_HDR: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px 20px", background: "#FFF8EC", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13.5, color: "#7A5C00", textDecoration: "none" };
const NB_MOB_BTN_BASE: React.CSSProperties = { borderRadius: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };
const NB_MOB_CART_BTN: React.CSSProperties = { ...NB_MOB_BTN_BASE, flex: 1, padding: "12px 16px", border: "1.5px solid #E9D8FD", background: "white", color: "rgba(15,23,42,0.55)" };
const NB_MOB_NOTIF_BTN: React.CSSProperties = { ...NB_MOB_BTN_BASE, padding: "12px 20px", border: "1.5px solid #E9D8FD", background: "white", color: "#1E1B4B" };
const NB_MOB_LOGOUT_BTN: React.CSSProperties = { ...NB_MOB_BTN_BASE, padding: "12px 20px", border: "1.5px solid #FFCDD5", background: "#FFF5F5", color: "#E74C3C" };
const NB_MOB_LOGIN_BTN: React.CSSProperties = { ...NB_MOB_BTN_BASE, padding: "13px 20px", border: "none", background: "#0F172A", color: "white" };


const openAuthModal = () => window.dispatchEvent(new CustomEvent("r65:open-auth"));

const NAV_BAR_STYLES = `
  /* ── Nav links ── */
  .nb-link {
    position: relative; display: inline-flex; align-items: center;
    font-size: 11px; font-weight: 700; text-decoration: none; color: #334155;
    padding: 6px 9px; white-space: nowrap; font-family: 'DM Sans', sans-serif;
    text-transform: uppercase; letter-spacing: 0.1em;
    transition: color .18s ease;
  }
  .nb-link:hover { color: #0F172A; }
  .nb-link.active { color: #0F172A; font-weight: 700; }

  /* ── Dropdown button ── */
  .nb-drop-btn {
    position: relative; display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 700; color: #334155;
    background: none; border: none; cursor: pointer;
    padding: 6px 9px; white-space: nowrap; font-family: 'DM Sans', sans-serif;
    text-transform: uppercase; letter-spacing: 0.1em;
    transition: color .18s ease;
  }
  .nb-drop-btn:hover, .nb-drop-btn.active { color: #0F172A; }
  .nb-chevron { transition: transform .25s cubic-bezier(0.22,1,0.36,1); }
  .nb-chevron.open { transform: rotate(180deg); }

  /* ── Dropdown panel ── */
  .nb-dropdown {
    background: rgba(255,255,255,0.65); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.6); border-radius: 14px;
    box-shadow: 0 12px 40px rgba(31,38,135,0.16), inset 0 1px 0 rgba(255,255,255,0.5);
    padding: 6px; animation: dropIn .18s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes dropIn { from { opacity:0; transform: translateY(-6px) scale(.98) } to { opacity:1; transform: none } }
  .nb-drop-item {
    display: flex; align-items: center; gap: 9px; padding: 9px 12px;
    border-radius: 8px; font-size: 13.5px; color: #475569;
    text-decoration: none; font-family: 'DM Sans', sans-serif; font-weight: 500;
    transition: background .12s, color .12s;
  }
  .nb-drop-item:hover { background: #F5F0FF; color: #9333EA; }
  .nb-drop-icon { color: #94A3B8; flex-shrink: 0; transition: color .12s; }
  .nb-drop-item:hover .nb-drop-icon { color: #9333EA; }

  /* ── CTA principal (Contacto) ── */
  .nb-cta {
    background: #0F172A; color: white; border-radius: 99px;
    padding: 7px 14px; font-size: 11px; font-weight: 700;
    text-decoration: none; font-family: 'DM Sans', sans-serif;
    transition: background .2s, box-shadow .2s, transform .2s;
    display: inline-flex; align-items: center; gap: 5px;
    box-shadow: 0 2px 10px rgba(15,23,42,0.20);
    white-space: nowrap; border: none; cursor: pointer;
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .nb-cta:hover { background: #9333EA; box-shadow: 0 4px 18px rgba(147,51,234,0.35); transform: translateY(-1px); }
  .nb-cta::after { display: none !important; }

  /* ── Mis chats (outline secundario) ── */
  .nb-secondary {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 99px;
    border: 1.5px solid #E9D8FD; background: white;
    font-size: 11px; font-weight: 600; color: #9333EA;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    text-decoration: none; transition: all .2s; white-space: nowrap;
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .nb-secondary:hover { border-color: #9333EA; background: #F5F0FF; }
  .nb-secondary::after { display: none !important; }

  /* ── Avatar + menú usuario ── */
  .nb-user-wrap {
    display: flex; align-items: center; gap: 6px;
    padding: 3px 3px 3px 6px;
    border-radius: 99px; border: 1.5px solid #EDE9FE;
    background: white; transition: border-color .2s;
    cursor: pointer;
  }
  .nb-user-wrap:hover { border-color: #E9D8FD; }
  .nb-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, #9333EA, #0F172A);
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 11px; font-weight: 700;
    flex-shrink: 0; user-select: none; overflow: hidden; position: relative;
  }
  .nb-username {
    font-size: 12px; font-weight: 600; color: #0F172A;
    font-family: 'DM Sans', sans-serif; max-width: 72px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .nb-logout {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 4px 8px; border-radius: 99px;
    border: none; background: transparent;
    font-size: 11px; font-weight: 500; color: #94A3B8;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: all .2s;
  }
  .nb-logout:hover { color: #E74C3C; background: #FFF0F0; }
  .nb-user-open {
    display: flex; align-items: center; gap: 6px;
    border: none; background: none; padding: 0; margin: 0;
    cursor: pointer; font: inherit; color: inherit;
  }

  /* ── Login ── */
  .nb-login {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 14px; border-radius: 99px;
    border: 1.5px solid #E9D8FD; background: white;
    font-size: 11px; font-weight: 600; color: #9333EA;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: all .2s; white-space: nowrap;
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .nb-login:hover { border-color: #9333EA; background: #F5F0FF; }

  /* ── Carrito ── */
  .nb-cart {
    position: relative; background: none; border: none;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; padding: 4px;
  }
  .nb-cart:hover { opacity: 0.7; }

  /* ── Separador ── */
  .nb-sep { width: 1px; height: 22px; background: #EDE9FE; flex-shrink: 0; }

  /* ── Logo ── */
  .nb-logo-circle { transition: transform .3s cubic-bezier(0.34,1.56,0.64,1); }
  .nb-logo:hover .nb-logo-circle { transform: scale(1.06); }

  /* ── Burger ── */
  .nb-burger {
    display: none !important; background: none; border: none;
    cursor: pointer; padding: 6px; border-radius: 8px; transition: background .2s;
  }
  .nb-burger:hover { background: #EDE9FE; }

  /* ── Mobile menu ── */
  .nb-mobile-menu { animation: mobileIn .22s cubic-bezier(.22,1,.36,1) both; }
  @keyframes mobileIn { from { opacity:0; transform: translateY(-8px) } to { opacity:1; transform: none } }
  .nb-mobile-link {
    display: flex; align-items: center; padding: 14px 4px;
    font-size: 13px; font-weight: 600; text-decoration: none;
    border-bottom: 1px solid #F2EEE8; font-family: 'DM Sans', sans-serif;
    color: #1E1B4B; text-transform: uppercase; letter-spacing: 0.1em;
    transition: color .15s, padding-left .15s;
  }
  .nb-mobile-link:hover, .nb-mobile-link.active { color: #0F172A; padding-left: 8px; }
  .nb-mobile-link.active { font-weight: 700; }
  .nb-mobile-acc {
    display: flex; justify-content: space-between; align-items: center;
    width: 100%; padding: 14px 4px; font-size: 13px; font-weight: 600;
    color: #1E1B4B; background: none; border: none; border-bottom: 1px solid #F2EEE8;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: color .15s;
    text-transform: uppercase; letter-spacing: 0.1em;
  }
  .nb-mobile-acc:hover, .nb-mobile-acc.active { color: #0F172A; }
  .nb-mobile-sub { padding-left: 20px; overflow: hidden; transition: max-height 0.3s ease; }
  .nb-mobile-sub-link {
    display: flex; align-items: center; gap: 10px; padding: 12px 0;
    font-size: 13px; font-weight: 500; text-decoration: none;
    color: #475569; border-bottom: 1px dashed #F2EEE8;
    font-family: 'DM Sans', sans-serif; transition: color .15s;
  }
  .nb-mobile-sub-link:hover { color: #9333EA; }
  .nb-mobile-sub-link:last-child { border-bottom: none; }

  @media (max-width: 1024px) {
    .nb-desktop { display: none !important; }
    .nb-burger { display: block !important; }
    .nb-burger-wrap { display: flex !important; }
  }
  @media (max-width: 480px) {
    .nb-logo span { display: none !important; }
  }

  /* Oculto durante el hero cinemático; reaparece en escena 08 */
  body.vt-hero-active header {
    height: 0 !important;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
  }
`;

type NavUser = { rol?: string; username?: string; id?: number; foto?: string; email?: string; plan_id?: number | null; plan_org_id?: number | null } | null;

function NavMobileMenu({
  authed, user, mobileOpen, notifPerm, count, isActive, isDropActive,
  close, requestNotif, handleLogout, setProfileOpen, setMobileOpen, setCartOpen,
}: {
  authed: boolean; user: NavUser; mobileOpen: boolean;
  notifPerm: NotificationPermission | "unsupported"; count: number;
  isActive: (href: string) => boolean; isDropActive: (paths: string[]) => boolean;
  close: () => void; requestNotif: () => void; handleLogout: () => void;
  setProfileOpen: (v: boolean) => void; setMobileOpen: (v: boolean) => void; setCartOpen: (v: boolean) => void;
}) {
  if (!mobileOpen) return null;
  return (
    <div className="nb-mobile-menu" style={{ background: "#FDFAFF", borderTop: "1px solid #EDE9FE", padding: "8px 20px 28px", maxHeight: "85vh", overflowY: "auto" }}>

      {authed && user?.username && (
        <div role="button" tabIndex={0} onClick={() => { setProfileOpen(true); setMobileOpen(false); }} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setProfileOpen(true); setMobileOpen(false); } }} style={NB_MOB_USER_ROW}>
          <div style={NB_MOB_AVATAR}>
            {user?.foto ? (
              <Image fill sizes="100vw" src={user.foto} alt="Avatar" style={{ objectFit: "cover" }} />
            ) : (
              user.username[0].toUpperCase()
            )}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", fontFamily: "'DM Sans', sans-serif" }}>{user.username}</div>
            <div style={{ fontSize: 12, color: "rgba(15,23,42,0.55)", fontFamily: "'DM Sans', sans-serif" }}>{user.rol === "medico" ? "Médico" : user.rol === "admin" ? "Administrador" : "Usuario"}</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 4 }}>
        {user?.rol === "usuario_organizacion" ? (
          <>
            <Link href="/salud" onClick={close} className={`nb-mobile-link ${isActive("/salud") ? "active" : ""}`}>Salud y bienestar</Link>
            <Link href="/marketplace" onClick={close} className={`nb-mobile-link ${isActive("/marketplace") ? "active" : ""}`}>Marketplace</Link>
            <Link href="/organizaciones" onClick={close} className={`nb-mobile-link ${isDropActive(["/organizaciones"]) ? "active" : ""}`}>Organizaciones</Link>
            <Link href="/sobre-nosotros" onClick={close} className={`nb-mobile-link ${isActive("/sobre-nosotros") ? "active" : ""}`}>Sobre nosotros</Link>
          </>
        ) : !authed ? (
          <>
            <Link href="/sobre-nosotros" onClick={close} className={`nb-mobile-link ${isActive("/sobre-nosotros") ? "active" : ""}`}>Sobre nosotros</Link>
            <Link href="/segunda-mano" onClick={close} className={`nb-mobile-link ${isActive("/segunda-mano") ? "active" : ""}`}>Segunda Mano</Link>
            <Link href="/marketplace" onClick={close} className={`nb-mobile-link ${isActive("/marketplace") ? "active" : ""}`}>Marketplace</Link>
            <Link href="/organizaciones" onClick={close} className={`nb-mobile-link ${isDropActive(["/organizaciones"]) ? "active" : ""}`}>Organizaciones</Link>
          </>
        ) : (
          <>
            {NAV_LINKS
              .filter(l => l.label !== "Comunidad" || (user?.rol !== "medico" && user?.rol !== "admin"))
              .filter(l => l.label !== "Segunda Mano" || usaLaTienda(user?.rol))
              .map(l => (
                <Link key={l.href} href={l.href} onClick={close} className={`nb-mobile-link ${isActive(l.href) ? "active" : ""}`}>{l.label}</Link>
              ))}
            {usaLaTienda(user?.rol) && <Link href="/marketplace" onClick={close} className={`nb-mobile-link ${isActive("/marketplace") ? "active" : ""}`}>Marketplace</Link>}
            {user?.rol !== "medico" && <Link href="/recursos" onClick={close} className={`nb-mobile-link ${isActive("/recursos") ? "active" : ""}`}>Actividades</Link>}
            <Link href="/organizaciones" onClick={close} className={`nb-mobile-link ${isDropActive(["/organizaciones"]) ? "active" : ""}`}>Organizaciones</Link>
            {user?.rol === "medico" && <Link href="/sobre-nosotros" onClick={close} className={`nb-mobile-link ${isActive("/sobre-nosotros") ? "active" : ""}`}>Sobre nosotros</Link>}
          </>
        )}
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {authed && user?.rol === "medico" && (
          <Link href="/mis-chats" onClick={close} className="nb-cta" style={{ justifyContent: "center", borderRadius: 12, padding: "12px 20px" }}>
            <MessageSquare size={14} /> Mis chats
          </Link>
        )}

        {authed && user?.rol !== "admin" && user?.rol !== "usuario_organizacion" && usaLaTienda(user?.rol) && (
          <Link href="/mis-pedidos" onClick={close} className="nb-cta" style={{ justifyContent: "center", borderRadius: 12, padding: "12px 20px" }}>
            <Package size={14} /> Mis pedidos
          </Link>
        )}

        {authed && user?.rol === "admin" && (
          <div style={{ border: "1px solid rgba(245,200,66,0.35)", borderRadius: 12, overflow: "hidden" }}>
            <Link href="/admin" onClick={close} style={NB_ADMIN_HDR}>
              ⚙ Panel de administración
            </Link>
          </div>
        )}

        {authed && user?.rol !== "admin" && user?.rol !== "medico" && !user?.plan_id && (
          <Link href="/planes" onClick={close} className="nb-cta" style={{ justifyContent: "center", borderRadius: 12, padding: "12px 20px", background: "#9333EA" }}>
            <Heart size={14} /> Hazte Pro
          </Link>
        )}

        {user?.rol !== "admin" && (
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/contacto" onClick={close} className="nb-cta" style={{ flex: 1, justifyContent: "center", borderRadius: 12, padding: "12px 16px", background: "#F5F0FF", color: "#334155", border: "1px solid #E9D8FD" }}>
                <Phone size={14} />
              </Link>
              {usaLaTienda(user?.rol) && (
                <button type="button" onClick={() => { close(); setCartOpen(true); }}
                  style={NB_MOB_CART_BTN}>
                  <ShoppingCart size={15} /> Carrito {count > 0 && `(${count})`}
                </button>
              )}
            </div>
          )}

        {authed ? (
          <>
            {notifPerm === "default" && (
              <button type="button" onClick={requestNotif} style={NB_MOB_NOTIF_BTN}>
                🔔 Activar alertas
              </button>
            )}
            <button type="button" onClick={() => { close(); handleLogout(); }}
              style={NB_MOB_LOGOUT_BTN}>
              <LogOut size={15} /> Cerrar sesión
            </button>
          </>
        ) : (
          <button type="button" onClick={() => { close(); openAuthModal(); }}
            style={NB_MOB_LOGIN_BTN}>
            <LogIn size={15} /> Iniciar sesión
          </button>
        )}
      </div>
    </div>
  );
}

export default function NavBar() {
  const pathname  = usePathname();
  const { count } = useCart();

  const isComunidad = pathname?.startsWith("/comunidad");
  const [hidden,         setHidden]         = useState(false);
  const [comunidadNavVisible, setComunidadNavVisible] = useState(false);

  // Cada vez que se entra en comunidad la barra vuelve a arrancar plegada. Se
  // ajusta aquí, durante el render, y no con un efecto: así React lo resuelve
  // antes de pintar, sin el fotograma con el menú abierto que se corregía justo
  // después.
  const [comunidadPrevia, setComunidadPrevia] = useState(isComunidad);
  if (comunidadPrevia !== isComunidad) {
    setComunidadPrevia(isComunidad);
    if (isComunidad) setComunidadNavVisible(false);
  }

  const lastScrollY = useRef(0);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [cartOpen,       setCartOpen]       = useState(false);
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [authed,         setAuthed]         = useState(false);
  const [user, setUser] = useState<{ rol?: string; username?: string; id?: number; foto?: string; email?: string; plan_id?: number | null; plan_org_id?: number | null } | null>(null);
  const [notifPerm,      setNotifPerm]      = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    const handlePagoCompletado = () => {
      setCartOpen(true);
    };
    // Comprar un artículo de segunda mano suelto abre el mismo panel; el propio
    // drawer se encarga de saltar al paso de envío con ese artículo.
    window.addEventListener("pago-completado", handlePagoCompletado);
    window.addEventListener("r65:comprar-ahora", handlePagoCompletado);
    return () => {
      window.removeEventListener("pago-completado", handlePagoCompletado);
      window.removeEventListener("r65:comprar-ahora", handlePagoCompletado);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const perm = "Notification" in window ? Notification.permission : "unsupported";
      Promise.resolve().then(() => {
        setNotifPerm(prev => prev !== perm ? perm : prev);
      });
    }
    const check = () => {
      setAuthed(sessionStorage.getItem("r65_authed") === "true");
      const savedUser = sessionStorage.getItem("r65_user:v1");
      if (savedUser) {
        try { setUser(JSON.parse(savedUser)); } catch { setUser(null); }
      } else { setUser(null); }
    };
    check();
    window.addEventListener("storage", check);
    window.addEventListener("r65:authed", check);
    window.addEventListener("relatia-auth-changed", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("r65:authed", check);
      window.removeEventListener("relatia-auth-changed", check);
    };
  }, []);

  const handleLogout = async () => {
    if (user?.id && process.env.NEXT_PUBLIC_LOCAL_DEMO !== "true") {
      usuarioService.pingOffline(user.id);
    }
    sessionStorage.removeItem("r65_authed");
    sessionStorage.removeItem("r65_user:v1");
    localStorage.removeItem("viveplus:demo:session:v1");
    // La cookie es HttpOnly: solo el servidor puede borrarla.
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    window.dispatchEvent(new CustomEvent("relatia-auth-changed"));
    setAuthed(false);
    window.location.reload();
  };

  useEffect(() => {
    let ticking = false;
    const fn = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;

          if (currentY < 80) {
            setHidden(false);
          } else if (currentY > lastScrollY.current + 4) {
            setHidden(true);
          } else if (currentY < lastScrollY.current - 4) {
            setHidden(false);
          }

          lastScrollY.current = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { const tid = setTimeout(() => setMobileOpen(false), 0); return () => clearTimeout(tid); }, [pathname]);

  useEffect(() => {
    if (user?.rol === "usuario_organizacion" && !user.plan_org_id && pathname !== "/planes-organizacion") {
      window.location.href = "/planes-organizacion";
    }
  }, [user, pathname]);

  const requestNotif = () => {
    if ("Notification" in window) Notification.requestPermission().then(p => setNotifPerm(p));
  };

  const close    = () => { setMobileOpen(false); };
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };
  const isDropActive = (paths: string[]) => paths.some(p => pathname.startsWith(p));

  const orgSinPlan = user?.rol === "usuario_organizacion" && !user.plan_org_id;

  if (orgSinPlan) return null;

  // El panel de administración es una vista a pantalla completa con su propia
  // barra lateral y su cabecera; la navegación pública le robaría el sitio.
  if (pathname.startsWith("/admin")) return null;

  const navHidden = isComunidad ? !comunidadNavVisible : hidden;

  return (
    <>
      <style>{NAV_BAR_STYLES}</style>

      {isComunidad && (
        <button
          type="button"
          onClick={() => setComunidadNavVisible(v => !v)}
          aria-label={comunidadNavVisible ? "Ocultar menú" : "Mostrar menú"}
          style={{
            position: "fixed", top: 10, left: "50%", transform: "translateX(-50%)",
            zIndex: 41, width: 34, height: 34, borderRadius: "50%",
            background: "white", border: "1px solid #EDE9FE",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", boxShadow: "0 2px 10px rgba(31,38,135,0.18)",
          }}
        >
          <ChevronDown size={17} color="#334155" style={{ transition: "transform .25s", transform: comunidadNavVisible ? "rotate(180deg)" : "none" }} />
        </button>
      )}

      <header style={{ ...NB_HEADER_BASE, transform: navHidden ? "translateY(-130%)" : "translateY(0)" }}>
        <div style={NB_INNER_NAV}>

          {/* ── LOGO (izquierda) ── */}
          <Link href="/" className="nb-logo" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
            <div className="nb-logo-circle" style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", boxShadow: "0 2px 10px rgba(236,72,153,0.15)" }}>
              <Image src="/logo.png" alt="Logo" width={44} height={44} priority style={{ borderRadius: "50%", objectFit: "cover" }} />
            </div>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.01em" }}>
              VIVE<span style={{ color: "#EC4899" }}>+</span>
            </span>
          </Link>

          {/* ── NAV CENTRAL (centrada) ── */}
          <nav className="nb-desktop" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
            {user?.rol === "usuario_organizacion" ? (
              <>
                <Link href="/salud" className={`nb-link ${isActive("/salud") ? "active" : ""}`}>Salud y bienestar</Link>
                <Link href="/marketplace" className={`nb-link ${isActive("/marketplace") ? "active" : ""}`}>Marketplace</Link>
                <Link href="/organizaciones" className={`nb-link ${isDropActive(["/organizaciones"]) ? "active" : ""}`}>Organizaciones</Link>
                <Link href="/sobre-nosotros" className={`nb-link ${isActive("/sobre-nosotros") ? "active" : ""}`}>Sobre nosotros</Link>
              </>
            ) : !authed ? (
              <>
                <Link href="/segunda-mano" className={`nb-link ${isActive("/segunda-mano") ? "active" : ""}`}>Segunda Mano</Link>
                <Link href="/marketplace" className={`nb-link ${isActive("/marketplace") ? "active" : ""}`}>Marketplace</Link>
                <Link href="/organizaciones" className={`nb-link ${isDropActive(["/organizaciones"]) ? "active" : ""}`}>Organizaciones</Link>
                <Link href="/sobre-nosotros" className={`nb-link ${isActive("/sobre-nosotros") ? "active" : ""}`}>Sobre nosotros</Link>
              </>
            ) : (
              <>
                {NAV_LINKS
                  .filter(l => l.label !== "Comunidad" || (user?.rol !== "medico" && user?.rol !== "admin"))
                  .filter(l => l.label !== "Segunda Mano" || usaLaTienda(user?.rol))
                  .map(l => (
                    <Link key={l.href} href={l.href} className={`nb-link ${isActive(l.href) ? "active" : ""}`}>{l.label}</Link>
                  ))}
                {usaLaTienda(user?.rol) && <Link href="/marketplace" className={`nb-link ${isActive("/marketplace") ? "active" : ""}`}>Marketplace</Link>}
                {user?.rol !== "medico" && <Link href="/recursos" className={`nb-link ${isActive("/recursos") ? "active" : ""}`}>Actividades</Link>}
                <Link href="/organizaciones" className={`nb-link ${isDropActive(["/organizaciones"]) ? "active" : ""}`}>Organizaciones</Link>
                {user?.rol === "medico" && <Link href="/sobre-nosotros" className={`nb-link ${isActive("/sobre-nosotros") ? "active" : ""}`}>Sobre nosotros</Link>}
              </>
            )}
          </nav>

          {/* ── ACCIONES DERECHA ── */}
          <div className="nb-desktop" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>

            {user?.rol !== "admin" && user?.rol !== "usuario_organizacion" && usaLaTienda(user?.rol) && (
              <button type="button" className="nb-cart" onClick={() => setCartOpen(true)} title="Carrito">
                <ShoppingCart size={15} color="#64748B" />
                {count > 0 && (
                  <span style={NB_CART_BADGE}>
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>
            )}

            {user?.rol !== "admin" && user?.rol !== "usuario_organizacion" && usaLaTienda(user?.rol) && <div className="nb-sep" />}

            {user?.rol !== "admin" && user?.rol !== "usuario_organizacion" && (
              <Link href="/contacto" className="nb-cta">
                <Phone size={13} />
              </Link>
            )}

            <div className="nb-sep" />

            {authed ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {user?.rol === "medico" && (
                  <Link href="/mis-chats" className="nb-secondary">
                    <MessageSquare size={13} /> Mis chats
                  </Link>
                )}

                {user?.rol !== "admin" && user?.rol !== "usuario_organizacion" && usaLaTienda(user?.rol) && (
                  <Link href="/mis-pedidos" className="nb-secondary">
                    <Package size={13} /> Mis pedidos
                  </Link>
                )}

                {/* El panel tiene su propia barra lateral con las nueve
                    secciones: aquí basta con la puerta de entrada. */}
                {user?.rol === "admin" && (
                  <Link href="/admin" className="nb-secondary" style={{ borderColor: "#F5C842", color: "#E67E22", fontSize: 12, gap: 5 }}>
                    ⚙ Admin
                  </Link>
                )}

                {user?.rol !== "admin" && user?.rol !== "medico" && user?.rol !== "usuario_organizacion" && !user?.plan_id && (
                  <Link href="/planes" className="nb-secondary" style={{ borderColor: "#FBCFE8", color: "#9333EA", fontSize: 13, gap: 5 }}>
                    <Heart size={13} color="#EC4899" /> Hazte Pro
                  </Link>
                )}

                {notifPerm === "default" && (
                  <button type="button" onClick={requestNotif} title="Activar notificaciones"
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "4px 6px", borderRadius: 8, transition: "background .2s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F5F0FF")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    🔔
                  </button>
                )}

                {/* Chip usuario: avatar + nombre + salir */}
                <div className="nb-user-wrap">
                  <button type="button" className="nb-user-open" onClick={() => setProfileOpen(true)} title={user?.username}>
                    <div className="nb-avatar">
                      {user?.foto ? (
                        <Image fill sizes="100vw" src={user.foto} alt="Avatar" style={{ objectFit: "cover" }} />
                      ) : (
                        user?.username?.[0]?.toUpperCase()
                      )}
                    </div>
                    {user?.username && (
                      <span className="nb-username">{user.username}</span>
                    )}
                  </button>
                  <button type="button" className="nb-logout" onClick={handleLogout} title="Cerrar sesión">
                    <LogOut size={12} /> Salir
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="nb-login" onClick={openAuthModal}>
                <LogIn size={13} /> Iniciar sesión
              </button>
            )}
          </div>

          {/* ── BURGER (móvil) ── */}
          <div className="nb-burger-wrap" style={{ display: "flex", alignItems: "center" }}>
            <button type="button" className="nb-burger" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}>
              {mobileOpen ? <X size={22} color="#0F172A" /> : <Menu size={22} color="#0F172A" />}
            </button>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        <NavMobileMenu
          authed={authed} user={user} mobileOpen={mobileOpen} notifPerm={notifPerm} count={count}
          isActive={isActive} isDropActive={isDropActive}
          close={close} requestNotif={requestNotif} handleLogout={handleLogout}
          setProfileOpen={setProfileOpen} setMobileOpen={setMobileOpen} setCartOpen={setCartOpen}
        />
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <ProfileModal key={`${user?.id ?? "none"}:${profileOpen}`} open={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </>
  );
}
