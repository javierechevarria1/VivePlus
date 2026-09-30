"use client";

import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";
import {
  parsearConsentimiento,
  snapshotConsentimiento,
  snapshotServidor,
  subscribirConsentimiento,
} from "@/frontend/src/lib/consentimiento";

// Las analíticas solo se cargan si el visitante las ha aceptado.
//
// Antes `<Analytics />` estaba puesto directamente en el layout y se cargaba
// siempre, mientras la política de cookies decía que solo se activaban con
// permiso. Ahora es verdad: sin respuesta o con un «rechazar», este componente
// no monta nada.
//
// Lee el consentimiento con `useSyncExternalStore` y no con un efecto, así que
// reacciona al momento en que se acepta —sin recargar la página— y también si
// se responde en otra pestaña.

export default function AnaliticaConsentida() {
  const guardado = useSyncExternalStore(
    subscribirConsentimiento,
    snapshotConsentimiento,
    snapshotServidor
  );

  if (!parsearConsentimiento(guardado)?.analiticas) return null;
  return <Analytics />;
}
