import httpClient from '../api/httpClient';

const LOCAL_DEMO = process.env.NEXT_PUBLIC_LOCAL_DEMO === 'true';

export const perfilService = {
  async updateFoto(userId: number, foto: string, rol?: string): Promise<string> {
    if (LOCAL_DEMO) {
      const storageKeys = [
        [sessionStorage, 'r65_user:v1'],
        [localStorage, 'viveplus:demo:session:v1'],
      ] as const;
      let updated = false;

      for (const [storage, key] of storageKeys) {
        const stored = storage.getItem(key);
        if (!stored) continue;

        const user: unknown = JSON.parse(stored);
        if (typeof user !== 'object' || user === null || !('id' in user) || user.id !== userId) continue;

        storage.setItem(key, JSON.stringify({ ...user, foto }));
        updated = true;
      }

      if (!updated) throw new Error('No se encontró la sesión demo para guardar el avatar.');
      return foto;
    }

    const { data } = await httpClient.post('/perfil', { userId, action: 'update_foto', foto, rol });
    if (!data.ok) throw new Error(data.error || 'Error al guardar');
    return data.photoUrl ?? foto;
  },

  async updatePassword(userId: number, passActual: string, passNueva: string): Promise<void> {
    const { data } = await httpClient.post('/perfil', { userId, action: 'update_password', passActual, passNueva });
    if (!data.ok) throw new Error(data.error || 'Error al actualizar contraseña');
  },
};
