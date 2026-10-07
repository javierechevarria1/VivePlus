import { requireAdminPage } from "@/lib/auth";
import AdminCodigosPage from "@/frontend/src/pages/admin-codigos";

export default async function Page() {
  await requireAdminPage();
  return <AdminCodigosPage />;
}
