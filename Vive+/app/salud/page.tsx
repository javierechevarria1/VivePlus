import type { Metadata } from 'next';
import { getSessionUser } from '@/lib/auth';
import SaludPage from '@/frontend/src/pages/salud';

export const metadata: Metadata = {
  title: 'Salud para personas mayores | Recursos médicos y consejos - VIVE+',
  description: 'Accede a recursos de salud, guías médicas y consejos de bienestar pensados para personas mayores de 55 años en Santander.',
  alternates: { canonical: '/salud' },
};

export default async function Page() {
  const user = await getSessionUser();
  const initialUser = user ? { id: user.id, username: user.username ?? '', rol: user.rol } : null;
  return <SaludPage initialUser={initialUser} />;
}
