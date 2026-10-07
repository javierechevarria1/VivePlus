import httpClient, { extractApiError } from '../api/httpClient';

export type CatActividadDB = {
  id: number;
  nombre: string;
  color: string;
  icono: string;
  orden: number;
};

export type Actividad = {
  id: number;
  nombre: string;
  descripcion: string;
  actividades_categoria_id: number | null;
  categoria: string;
  fecha: string;
  lugar: string;
  plazas_max: number;
  inscritos?: number;
  url?: string | null;
  url_lugar?: string | null;
  duracion_min?: number | null;
  imagen?: string | null;
};

export type ActividadAdmin = {
  id: number;
  nombre: string;
  descripcion: string;
  actividades_categoria_id: number | null;
  categoria: string;
  fecha: string;
  lugar: string;
  plazas_max: number;
  inscritos: number;
  url: string | null;
  url_lugar: string | null;
  duracion_min: number | null;
  activa: boolean;
  creado_en: string | null;
  imagen: string | null;
};

type ActividadBody = {
  nombre: string;
  descripcion: string;
  actividades_categoria_id: number | null;
  fecha: string;
  lugar: string;
  plazas_max: number;
  duracion_min: number | null;
  url_lugar: string | null;
  url: string | null;
  activa: boolean;
  imagen: string | null;
};

export const actividadesService = {
  async getCategoriasActividades(): Promise<CatActividadDB[]> {
    const { data } = await httpClient.get('/categorias?tipo=actividades');
    return data.categorias ?? [];
  },

  async getActividades(usuarioId?: number): Promise<{ actividades: Actividad[]; inscritas: number[] }> {
    const url = usuarioId ? `/recursos?usuario_id=${usuarioId}` : '/recursos';
    const { data } = await httpClient.get(url);
    return { actividades: data.actividades ?? [], inscritas: data.inscritas ?? [] };
  },

  async getActividadesAdmin(): Promise<ActividadAdmin[]> {
    const { data } = await httpClient.get('/admin-actividades');
    return data.actividades ?? [];
  },

  async crearActividad(body: ActividadBody): Promise<void> {
    try {
      await httpClient.post('/admin-actividades', body);
    } catch (e) {
      extractApiError(e, 'Error al crear actividad');
    }
  },

  async editarActividad(id: number, body: ActividadBody): Promise<void> {
    try {
      await httpClient.put('/admin-actividades', { id, ...body });
    } catch (e) {
      extractApiError(e, 'Error al editar actividad');
    }
  },

  async toggleActivaActividad(actividad: ActividadAdmin): Promise<void> {
    try {
      await httpClient.put('/admin-actividades', { ...actividad, activa: !actividad.activa });
    } catch (e) {
      extractApiError(e, 'Error al actualizar actividad');
    }
  },

  async eliminarActividad(id: number): Promise<void> {
    try {
      await httpClient.delete(`/admin-actividades?id=${id}`);
    } catch (e) {
      extractApiError(e, 'Error al eliminar actividad');
    }
  },

  async inscribirse(body: object): Promise<void> {
    try {
      await httpClient.post('/recursos', body);
    } catch (e) {
      extractApiError(e, 'Error al inscribirse');
    }
  },

  async desinscribirse(body: object): Promise<{ inscritos?: number }> {
    const { data } = await httpClient.delete('/recursos', { data: body });
    return data ?? {};
  },

  async getPersonasInscritas(
    intermediarioId: number,
    actividadId: number,
  ): Promise<{ personas: { id: number; username: string }[]; selfInscrito: boolean }> {
    const { data } = await httpClient.get(
      `/recursos?intermediario_id=${intermediarioId}&actividad_id=${actividadId}`,
    );
    return { personas: data.personas ?? [], selfInscrito: !!data.selfInscrito };
  },

  async getMisUsuarios(intermediarioId: number): Promise<{ id: number; username: string }[]> {
    const { data } = await httpClient.get(`/mis-usuarios?intermediario_id=${intermediarioId}`);
    return data.users ?? [];
  },
};
