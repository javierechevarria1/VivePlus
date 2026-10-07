import httpClient, { extractApiError } from '../api/httpClient';

const LOCAL_DEMO = process.env.NEXT_PUBLIC_LOCAL_DEMO === 'true';
const DEMO_SIGNUPS_KEY = 'viveplus:demo:actividad-inscripciones:v1';

function readDemoSignups(): Record<string, number[]> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(DEMO_SIGNUPS_KEY) ?? '{}');
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, number[]>
      : {};
  } catch (error) {
    console.warn('No se pudieron leer las inscripciones demo guardadas.', error);
    return {};
  }
}

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
    const inscritas = LOCAL_DEMO && usuarioId
      ? readDemoSignups()[String(usuarioId)] ?? []
      : data.inscritas ?? [];
    return { actividades: data.actividades ?? [], inscritas };
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
    if (LOCAL_DEMO) {
      const signup = body as { actividad_id?: number; usuario_id?: number };
      if (!signup.actividad_id || !signup.usuario_id) throw new Error('Faltan datos para la inscripción demo.');
      const signups = readDemoSignups();
      const key = String(signup.usuario_id);
      signups[key] = [...new Set([...(signups[key] ?? []), signup.actividad_id])];
      localStorage.setItem(DEMO_SIGNUPS_KEY, JSON.stringify(signups));
      return;
    }
    try {
      await httpClient.post('/recursos', body);
    } catch (e) {
      extractApiError(e, 'Error al inscribirse');
    }
  },

  async desinscribirse(body: object): Promise<{ inscritos?: number }> {
    if (LOCAL_DEMO) {
      const signup = body as { actividad_id?: number; usuario_id?: number };
      if (!signup.actividad_id || !signup.usuario_id) throw new Error('Faltan datos para cancelar la inscripción demo.');
      const signups = readDemoSignups();
      const key = String(signup.usuario_id);
      signups[key] = (signups[key] ?? []).filter(id => id !== signup.actividad_id);
      localStorage.setItem(DEMO_SIGNUPS_KEY, JSON.stringify(signups));
      return {};
    }
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
