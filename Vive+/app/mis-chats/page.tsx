import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import MisChatsPage, { type Conversacion } from "@/frontend/src/pages/mis-chats";

export default async function Page() {
  const user = await getSessionUser();
  if (!user || user.rol !== "medico") redirect("/");

  let initialConvs: Conversacion[] = [];
  try {
    const token = (await cookies()).get("r65_token")?.value ?? "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/chat-history?cuidador_id=${user.id}`, {
      headers: { Cookie: `r65_token=${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      initialConvs = data.conversaciones ?? [];
    }
  } catch { /* deja initialConvs vacío, el usuario verá la lista vacía hasta refrescar */ }

  return (
    <MisChatsPage
      initialUser={{ id: user.id, username: user.username ?? "", rol: user.rol }}
      initialConvs={initialConvs}
    />
  );
}
