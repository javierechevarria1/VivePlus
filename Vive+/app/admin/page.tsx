import { requireAdminPage } from "@/lib/auth";
import AdminInicioPage from "@/frontend/src/pages/admin-inicio";

export default async function Page() {
  await requireAdminPage();
  return <AdminInicioPage />;
}
