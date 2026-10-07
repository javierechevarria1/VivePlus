import type { NextRequest } from "next/server";

type Registro = { count: number; resetAt: number };

// Ventana deslizante simple en memoria. 
const store = new Map<string, Registro>();

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

/**
 * Devuelve true si la clave supera el límite. `key` debería incluir el nombre

 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const reg = store.get(key);

  if (!reg || now > reg.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  reg.count += 1;
  if (reg.count > limit) return true;
  return false;
}

// Limpieza periódica para que el Map no crezca sin límite.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now > v.resetAt) store.delete(k);
    }
  }, 10 * 60 * 1000).unref?.();
}
