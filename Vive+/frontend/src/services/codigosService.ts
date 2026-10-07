import httpClient, { extractApiError } from '../api/httpClient';

export type Codigo = { id: number; codigo: string; estado: boolean };

export const codigosService = {
  async getCodigos(): Promise<Codigo[]> {
    const { data } = await httpClient.get('/admin-codigos');
    return data.codigos ?? [];
  },

  async generarCodigo(): Promise<void> {
    try {
      await httpClient.post('/admin-codigos', {});
    } catch (e) {
      extractApiError(e, 'Error al generar código');
    }
  },

  async eliminarCodigo(id: number): Promise<void> {
    try {
      await httpClient.delete(`/admin-codigos?id=${id}`);
    } catch (e) {
      extractApiError(e, 'Error al eliminar código');
    }
  },
};
