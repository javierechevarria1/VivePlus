// Tipos y helpers compartidos de la página Mis Chats (extraídos de mis-chats.tsx).

export interface Conversacion {
  usuario_id: number;
  username: string;
  ultimo_mensaje: string;
  ultimo_at: string;
  status?: string;
  no_leidos: number;
}

export interface Mensaje {
  id: number;
  from: string;
  text: string | null;
  audio_id?: string | null;
  creado_en: string;
}

export const statusColor = (s: string) =>
  s === "online" ? "#00C87A" : s === "away" ? "#FFB800" : "#C5C5C5";
export const statusLabel = (s: string) =>
  s === "online" ? "En línea" : s === "away" ? "Ausente" : "Desconectado";

export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  ["#C8E6E1", "#9333EA"],
  ["#D4E8C2", "#2D5016"],
  ["#E8D4C2", "#5C3010"],
  ["#C2D4E8", "#103C5C"],
  ["#E8C2D4", "#5C1030"],
  ["#D4C2E8", "#30105C"],
];

export function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

export const formatDuration = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

export const formatHora = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
};

export const formatFecha = (iso: string) => {
  const d = new Date(iso);
  const hoy = new Date();
  const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
  if (d.toDateString() === hoy.toDateString()) return "Hoy";
  if (d.toDateString() === ayer.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
};
