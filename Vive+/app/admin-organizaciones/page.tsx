import { requireAdminPage } from "@/lib/auth";
import AdminOrganizacionesPage from "@/frontend/src/pages/admin-organizaciones";

export default async function Page() {
  await requireAdminPage();
  return <AdminOrganizacionesPage />;
}
