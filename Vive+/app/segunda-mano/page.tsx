import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import SegundaManoPage from "@/frontend/src/pages/segunda-mano";

export default async function Page() {
  const user = await getSessionUser();
  let initialConnectConnected: boolean | null = null;

  if (user) {
    try {
      const token = (await cookies()).get("r65_token")?.value ?? "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/connect-onboard?userId=${user.id}`, {
        headers: { Cookie: `r65_token=${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        initialConnectConnected = data.connected ?? false;
      }
    } catch { /* deja initialConnectConnected en null, el cliente lo resolverá */ }
  }

  return <SegundaManoPage initialConnectConnected={initialConnectConnected} />;
}
