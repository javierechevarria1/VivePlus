import { requireAdminPage } from "@/lib/auth";
import AdminAnunciosPage from "@/frontend/src/pages/admin-anuncios";

export default async function Page() {
  await requireAdminPage();
  return <AdminAnunciosPage />;
}
