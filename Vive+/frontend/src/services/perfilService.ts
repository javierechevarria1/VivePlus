import httpClient from '../api/httpClient';

export const perfilService = {
  async updateFoto(userId: number, foto: string, rol?: string): Promise<string> {
    const { data } = await httpClient.post('/perfil', { userId, action: 'update_foto', foto, rol });
    if (!data.ok) throw new Error(data.error || 'Error al guardar');
    return data.photoUrl ?? foto;
  },

  async updatePassword(userId: number, passActual: string, passNueva: string): Promise<void> {
    const { data } = await httpClient.post('/perfil', { userId, action: 'update_password', passActual, passNueva });
    if (!data.ok) throw new Error(data.error || 'Error al actualizar contraseña');
  },
};
