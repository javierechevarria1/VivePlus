import {
  Package, ShoppingBag, Calendar, Building2, Megaphone,
  ShieldCheck, HeartPulse, KeyRound, CreditCard, type LucideIcon,
} from "lucide-react";

export type SeccionAdmin = {
  href: string;
  texto: string;
  Icono: LucideIcon;
  emoji: string;
};

// Fuente única del mapa de administración: lo consumen la barra lateral del
// panel y los dos menús del navbar. Estaba escrito a mano en cada sitio y ya
// habían divergido — al de escritorio le faltaban Anuncios y Códigos, y al de
// móvil además Pedidos.
export const SECCIONES_ADMIN: { grupo: string; entradas: SeccionAdmin[] }[] = [
  {
    grupo: "Tienda",
    entradas: [
      { href: "/admin-pedidos",     texto: "Pedidos",     Icono: Package,     emoji: "🧾" },
      { href: "/admin-marketplace", texto: "Marketplace", Icono: ShoppingBag, emoji: "📦" },
    ],
  },
  {
    grupo: "Contenido",
    entradas: [
      { href: "/admin-actividades",    texto: "Actividades",    Icono: Calendar,  emoji: "📅" },
      { href: "/admin-organizaciones", texto: "Organizaciones", Icono: Building2, emoji: "🏢" },
      { href: "/admin-anuncios",       texto: "Anuncios",       Icono: Megaphone, emoji: "📣" },
    ],
  },
  {
    grupo: "Personas",
    entradas: [
      { href: "/admin-cuidadores", texto: "Cuidadores", Icono: ShieldCheck, emoji: "🛡" },
      { href: "/admin-salud",      texto: "Salud",      Icono: HeartPulse,  emoji: "🩺" },
      { href: "/admin-codigos",    texto: "Códigos",    Icono: KeyRound,    emoji: "🔑" },
    ],
  },
  {
    grupo: "Negocio",
    entradas: [
      { href: "/admin-planes", texto: "Planes", Icono: CreditCard, emoji: "💳" },
    ],
  },
];

export const TODAS_LAS_SECCIONES = SECCIONES_ADMIN.flatMap(g => g.entradas);
