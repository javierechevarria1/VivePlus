import { requireAdminPage } from "@/lib/auth";
import AdminMarketplacePage, { type ProductoSegundaMano } from "@/frontend/src/pages/admin-marketplace";

export default async function Page() {
  await requireAdminPage();

  let initialSegundaMano: ProductoSegundaMano[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/segunda-mano`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.ok) initialSegundaMano = json.data;
    }
  } catch { /* deja initialSegundaMano vacío, el cliente reintentará */ }

  return <AdminMarketplacePage initialSegundaMano={initialSegundaMano} />;
}
