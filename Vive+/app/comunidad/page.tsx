import type { Metadata } from 'next';
import { getSessionUser } from '@/lib/auth';
import ComunidadPage, { type CurrentUser, type SolicitudesIniciales } from '@/frontend/src/pages/comunidad';

export const metadata: Metadata = {
  title: 'Comunidad para personas mayores en Santander | VIVE+',
  description: 'Únete a una comunidad activa de personas mayores en Santander. Comparte experiencias, participa en actividades y conecta con personas cercanas.',
  alternates: { canonical: '/comunidad' },
};

export default async function Page() {
  const user = await getSessionUser();
  // Los médicos son expulsados de Comunidad por el propio cliente (useCurrentUser);
  // no les sembramos sesión ni solicitudes para no mostrarles contenido antes del redirect.
  const isMedico = user?.rol === "medico";

  let initialSolicitudes: SolicitudesIniciales = { recibidas: [], amigos: [], enviadas: [] };
  if (user && !isMedico) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/solicitudes?user_id=${user.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        initialSolicitudes = {
          recibidas: data.recibidas ?? [],
          amigos: data.amigos ?? [],
          enviadas: data.enviadas ?? [],
        };
      }
    } catch { /* deja initialSolicitudes vacío, el cliente lo carga tras la geolocalización */ }
  }

  const initialUser: CurrentUser | null = user && !isMedico
    ? { id: user.id, email: user.email ?? "", username: user.username ?? "" }
    : null;

  return <ComunidadPage initialUser={initialUser} initialSolicitudes={initialSolicitudes} />;
}
