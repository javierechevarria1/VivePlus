import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import PlanesOrganizacionPage from "@/frontend/src/pages/planes-organizacion";

export const metadata = {
  title: "Planes para organizaciones - VIVE+",
};

export default async function Page() {
  // La puerta vive aqui y no en el cliente: comprobarlo despues de montar
  // enseñaba la pantalla de planes durante un instante a quien no le toca, y
  // se fiaba de un sessionStorage que el usuario puede editar.
  const user = await getSessionUser();
  if (!user || user.rol !== "usuario_organizacion") redirect("/");

  // El plan contratado no viaja en el token, asi que se lee de la tabla, igual
  // que hace el login al sembrar la sesion.
  const { rows } = await pool.query(
    `SELECT plan_org_id FROM organizaciones WHERE usuario_organizacion_id = $1 LIMIT 1`,
    [user.id]
  );
  if (rows[0]?.plan_org_id) redirect("/organizaciones");

  return (
    <Suspense>
      <PlanesOrganizacionPage />
    </Suspense>
  );
}
