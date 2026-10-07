import { requireAdminPage } from "@/lib/auth";
import AdminPedidosPage from "@/frontend/src/pages/admin-pedidos";

export default async function Page() {
  await requireAdminPage();
  return <AdminPedidosPage />;
}
