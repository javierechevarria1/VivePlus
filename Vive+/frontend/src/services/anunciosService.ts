import httpClient from '../api/httpClient';

export type Anuncio = {
  id?: number;
  empresa: string;
  imagen: string;
  url_destino: string;
  ubicacion: string;
  clics?: number;
  impresiones?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo?: boolean;
};

export const anunciosService = {
  async getAnunciosAdmin(): Promise<Anuncio[]> {
    const { data } = await httpClient.get('/admin-anuncios');
    return data.anuncios ?? [];
  },

  async getAnunciosPorUbicacion(ubicacion: string): Promise<Anuncio[]> {
    try {
      const { data } = await httpClient.get(`/anuncios?ubicacion=${ubicacion}&all=true`);
      return Array.isArray(data) ? data : (data ? [data] : []);
    } catch {
      return [];
    }
  },

  async getAnuncio(ubicacion: string): Promise<Anuncio | null> {
    try {
      const { data } = await httpClient.get(`/anuncios?ubicacion=${ubicacion}`);
      return data || null;
    } catch {
      return null;
    }
  },

  async registrarClic(id: number): Promise<void> {
    try {
      await httpClient.get(`/anuncios?id=${id}`);
    } catch {}
  },

  async crearAnuncio(anuncio: Omit<Anuncio, 'id'>): Promise<Anuncio> {
    const { data } = await httpClient.post('/anuncios', anuncio);
    return data;
  },

  async actualizarAnuncio(id: number, anuncio: Partial<Anuncio>): Promise<Anuncio> {
    const { data } = await httpClient.put('/anuncios', { ...anuncio, id });
    return data;
  },

  async eliminarAnuncio(id: number): Promise<void> {
    await httpClient.delete(`/anuncios?id=${id}`);
  }
};