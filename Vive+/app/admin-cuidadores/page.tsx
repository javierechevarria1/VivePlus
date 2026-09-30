import { requireAdminPage } from "@/lib/auth";
import AdminCuidadoresPage from "@/frontend/src/pages/admin-cuidadores";

export default async function Page() {
  await requireAdminPage();
  return <AdminCuidadoresPage />;
}
