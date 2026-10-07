// Tipos y helpers de formato de la página Salud (extraídos de salud.tsx).

export type CatSaludDB = { id: number; nombre: string; color: string; orden: number };
export type Msg = { id?: number; from: "user" | "care"; text: string | null; audio_id?: string | null; creado_en?: string };
export type CurrentUser = { id: number; username: string; rol?: string } | null;
export type ValorarTarget = { id: number; name: string; specialty: string; photo: string; color: string };

export const formatAudioDuration = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

export const formatTime = (ts?: string) => {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
};

export const formatDateLabel = (ts?: string) => {
  if (!ts) return null;
  const d = new Date(ts);
  const hoy = new Date();
  const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
  if (d.toDateString() === hoy.toDateString()) return "Hoy";
  if (d.toDateString() === ayer.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
};

export const getDayKey = (ts?: string) => {
  if (!ts) return "";
  return new Date(ts).toDateString();
};

export const lockScroll = () => {
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
};
export const unlockScroll = () => {
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
};
