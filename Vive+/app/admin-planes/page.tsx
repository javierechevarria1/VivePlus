import { requireAdminPage } from "@/lib/auth";
import AdminPlanesPage, { type Plan } from "@/frontend/src/pages/admin-planes";

export default async function Page() {
  await requireAdminPage();

  let initialPlanes: Plan[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/planes`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      initialPlanes = Array.isArray(data) ? data : [];
    }
  } catch { /* deja initialPlanes vacío, el cliente reintentará */ }

  return <AdminPlanesPage initialPlanes={initialPlanes} />;
}
