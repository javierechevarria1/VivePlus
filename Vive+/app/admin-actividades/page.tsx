import { requireAdminPage } from "@/lib/auth";
import AdminActividadesPage from "@/frontend/src/pages/admin-actividades";

export default async function Page() {
  await requireAdminPage();
  return <AdminActividadesPage />;
}
