"use client";

import { useMemo, useSyncExternalStore } from "react";

const CLAVE = "r65_user:v1";

// La sesion vive en sessionStorage, que para React es un almacen externo. Leerla
// con useSyncExternalStore quita el render de mas que hacia el efecto —primero
// sin plan, luego con el— y evita descuadres al hidratar: el servidor no tiene
// sessionStorage, asi que el primer render de cliente tiene que coincidir con el.
function suscribir(alCambiar: () => void) {
  window.addEventListener("relatia-auth-changed", alCambiar);
  return () => window.removeEventListener("relatia-auth-changed", alCambiar);
}

// La instantanea es la cadena cruda y no el objeto ya parseado: comparar cadenas
// da un valor estable entre renders, mientras que devolver un objeto nuevo cada
// vez haria que React no parase de re-renderizar.
function leerCrudo(): string | null {
  try {
    return sessionStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

const sinSesion = () => null;

// `ready` distingue «aun no hemos hidratado» de «no hay plan», que es lo que
// mira PlanGate para no enseñar el candado a un suscriptor.
const noSuscribir = () => () => {};
const yaHidratado = () => true;
const todaviaNo = () => false;

export function usePlan() {
  const crudo = useSyncExternalStore(suscribir, leerCrudo, sinSesion);
  const ready = useSyncExternalStore(noSuscribir, yaHidratado, todaviaNo);

  const user = useMemo(() => {
    if (!crudo) return null;
    try {
      return JSON.parse(crudo) as { plan_id?: number | null; rol?: string };
    } catch {
      return null;
    }
  }, [crudo]);

  const planId = user?.plan_id ?? null;
  const isAdmin = user?.rol === "admin" || user?.rol === "medico";

  return { planId, hasPlan: isAdmin || planId !== null, isAuthed: user !== null, ready };
}
