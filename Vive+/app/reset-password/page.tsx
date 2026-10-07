import ResetPasswordPage from "@/frontend/src/pages/reset-password";

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  let initialStatus: "valid" | "invalid" = "invalid";

  if (token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/reset-password?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      const data = await res.json();
      initialStatus = data.valid ? "valid" : "invalid";
    } catch { /* deja initialStatus en "invalid" */ }
  }

  return <ResetPasswordPage token={token ?? ""} initialStatus={initialStatus} />;
}
