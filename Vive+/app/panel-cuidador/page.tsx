import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth";
import PanelCuidadorPage from "@/frontend/src/pages/panel-cuidador";

// El email y el estado del plan viajan en el token, asi que se siembran desde
// aqui: leerlos del sessionStorage al montar obligaba a pintar una pantalla de
// carga antes de saber si el cuidador tiene plan. Quien no trae sesion valida
// no llega hasta aqui, lo aparta la guarda de proxy.ts.
export default async function Page() {
  const user = await getSessionUser();

  return (
    <Suspense>
      <PanelCuidadorPage
        initialUser={user ? { email: user.email ?? "", planActivo: !!user.plan_activo } : null}
      />
    </Suspense>
  );
}
