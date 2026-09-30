// Consentimiento de cookies: quién lo guarda y quién lo lee.
//
// Antes solo había lo primero. El banner escribía la elección en localStorage
// y no la leía nadie: las analíticas de Vercel se cargaban igual, hubiera
// aceptado o rechazado, mientras la política de cookies prometía lo contrario.
//
// Vive aquí y no dentro del banner para que quien decide y quien obedece no
// sean el mismo archivo.

export const CLAVE_CONSENTIMIENTO = "relatie65_cookies:v1";

// Se emite al guardar para que lo que dependa del consentimiento reaccione en
// el momento y no en la siguiente recarga.
export const EVENTO_CONSENTIMIENTO = "r65:consentimiento";

export type Consentimiento = {
  necesarias: true;
  analiticas: boolean;
  marketing: boolean;
};

// Sin respuesta todavía: hasta que la haya no se carga nada opcional, que es
// lo que exige la norma y lo que dice nuestra propia política.
export const SIN_RESPUESTA: Consentimiento = { necesarias: true, analiticas: false, marketing: false };

export function parsearConsentimiento(guardado: string): Consentimiento | null {
  if (!guardado) return null;
  try {
    const datos = JSON.parse(guardado);
    return {
      necesarias: true,
      analiticas: datos?.analiticas === true,
      marketing: datos?.marketing === true,
    };
  } catch {
    // Valor corrupto: se trata como si no hubiera respondido, que es la
    // opción que no carga nada.
    return null;
  }
}

export function leerConsentimiento(): Consentimiento | null {
  return parsearConsentimiento(snapshotConsentimiento());
}

// Las dos piezas que pide `useSyncExternalStore`, que es la forma correcta de
// leer algo que vive fuera de React —aquí, el almacenamiento del navegador—
// sin efectos que escriban estado en cada render.
//
// Devuelve la cadena cruda y no el objeto ya parseado a propósito: React
// compara el resultado por identidad, y un objeto nuevo en cada lectura sería
// un bucle infinito de renders.
export function snapshotConsentimiento(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(CLAVE_CONSENTIMIENTO) ?? "";
  } catch {
    // Modo privado o almacenamiento bloqueado.
    return "";
  }
}

// En el servidor no hay consentimiento posible, así que nada opcional se
// renderiza en el HTML inicial.
export const snapshotServidor = () => "";

export function subscribirConsentimiento(alCambiar: () => void): () => void {
  window.addEventListener(EVENTO_CONSENTIMIENTO, alCambiar);
  // `storage` cubre el caso de responder en otra pestaña abierta.
  window.addEventListener("storage", alCambiar);
  return () => {
    window.removeEventListener(EVENTO_CONSENTIMIENTO, alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}

export function guardarConsentimiento(consentimiento: Consentimiento): void {
  try {
    localStorage.setItem(CLAVE_CONSENTIMIENTO, JSON.stringify(consentimiento));
  } catch {
    // Si no se puede guardar, al menos que la sesión actual lo respete.
  }
  window.dispatchEvent(new CustomEvent(EVENTO_CONSENTIMIENTO, { detail: consentimiento }));
}
