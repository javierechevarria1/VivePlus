// Tipos y helpers de la página Comunidad (extraídos de comunidad.tsx).

export type Msg = { id: number; from: "me" | "other"; text: string | null; audio_id?: string | null; time: string };
export type CurrentUser = { id: number; email: string; username: string };
export type Person = {
  id: number; name: string; age: number;
  distance: string; distancia_km: number;
  photo: string; status: "online" | "away" | "offline";
  bio: string; barrio: string; unread: number; messages: Msg[];
  ultimo_no_leido?: string;
};
export type Solicitud = { id: number; from_user: number; username: string; creado_en: string };
export type SolicitudesIniciales = { recibidas: Solicitud[]; amigos: number[]; enviadas: number[] };

export const QUICK_REPLIES = ["Buenos días", "Quedamos esta tarde?", "Me parece bien", "Como está hoy?", "Hasta luego"];
export const statusColor = (s: string) => s === "online" ? "#00C87A" : s === "away" ? "#FFB800" : "#C5C5C5";
export const statusLabel = (s: string) => s === "online" ? "En línea" : s === "away" ? "Ausente" : "Desconectado";
export const fmt = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
export const formatDuration = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

export function safeParseLatLng(raw: string): { lat: number; lng: number } | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat === "number" && typeof parsed?.lng === "number") {
      return { lat: parsed.lat, lng: parsed.lng };
    }
  } catch { /* malformed cache, ignore */ }
  return null;
}
