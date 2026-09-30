import httpClient, { extractApiError } from '../api/httpClient';

export type CatSaludDB = { id: number; nombre: string; color: string; orden: number; activa: boolean };

export type Medico = {
  id: number;
  usuario_medico_id: number;
  name: string;
  especialidad: string;
  tag: string;
  horario: string;
  categorias_salud_id: number | null;
  tipo: string;
  categoria_color: string;
  photo_url: string | null;
  rating: number;
  reviews: number;
  verificado?: boolean;
  doc_identidad_url?: string | null;
  doc_antecedentes_url?: string | null;
  doc_residencia_url?: string | null;
};

type MedicoBody = {
  especialidad: string;
  tag: string | null;
  horario: string | null;
  categorias_salud_id: number | null;
  photo_url: string | null;
};

export const saludService = {
  async getMedicos(): Promise<Medico[]> {
    const { data } = await httpClient.get('/admin-salud');
    return data.medicos ?? [];
  },

  async getCategorias(): Promise<CatSaludDB[]> {
    const { data } = await httpClient.get('/admin-categorias?tipo=salud');
    return (data.categorias ?? []) as CatSaludDB[];
  },

  async crearMedico(body: MedicoBody & { usuario_medico_id: number }): Promise<void> {
    try {
      await httpClient.post('/admin-salud', body);
    } catch (e) {
      extractApiError(e, 'Error al crear profesional');
    }
  },

  async editarMedico(id: number, body: MedicoBody): Promise<void> {
    try {
      await httpClient.put('/admin-salud', { id, ...body });
    } catch (e) {
      extractApiError(e, 'Error al editar profesional');
    }
  },

  async eliminarMedico(id: number): Promise<void> {
    try {
      await httpClient.delete(`/admin-salud?id=${id}`);
    } catch (e) {
      extractApiError(e, 'Error al eliminar profesional');
    }
  },
};
