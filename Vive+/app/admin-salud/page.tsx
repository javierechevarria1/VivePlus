import { requireAdminPage } from "@/lib/auth";
import AdminSaludPage from "@/frontend/src/pages/admin-salud";

export default async function Page() {
  await requireAdminPage();
  return <AdminSaludPage />;
}
