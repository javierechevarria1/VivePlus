import httpClient, { extractApiError } from '../api/httpClient';

export type CatOrgDB = {
  id: number;
  key: string;
  label: string;
  color: string;
};

type Servicio = { nombre: string; descripcion: string };

export type Organizacion = {
  id: number;
  nombre: string;
  usuario_organizacion_id: number | null;
  organizaciones_categoria_id: number | null;
  tipo: string;
  descripcion: string;
  web: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  logo_url: string | null;
  estado: string | null;
  servicios: Servicio[];
};

type OrganizacionBody = {
  nombre: string;
  organizaciones_categoria_id: number | null;
  descripcion: string;
  web: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  estado: string | null;
  logo_url: string | null;
  servicios: Servicio[];
};

type UserOrgBody = {
  nombre: string;
  password: string;
  photo_url: string | null;
  descripcion: string;
  organizaciones_categoria_id: number | null;
  web: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  estado: string | null;
};

export const organizacionesService = {
  async getCategoriasOrganizaciones(): Promise<CatOrgDB[]> {
    const { data } = await httpClient.get('/categorias?tipo=organizaciones');
    return data.categorias ?? [];
  },

  async getOrganizacionesAdmin(): Promise<Organizacion[]> {
    const { data } = await httpClient.get('/admin-organizaciones');
    return data.organizaciones ?? [];
  },

  async crearOrganizacion(body: OrganizacionBody): Promise<void> {
    try {
      await httpClient.post('/admin-organizaciones', body);
    } catch (e) {
      extractApiError(e, 'Error al crear organización');
    }
  },

  async editarOrganizacion(id: number, body: OrganizacionBody): Promise<void> {
    try {
      await httpClient.put('/admin-organizaciones', { id, ...body });
    } catch (e) {
      extractApiError(e, 'Error al editar organización');
    }
  },

  async eliminarOrganizacion(id: number): Promise<void> {
    try {
      await httpClient.delete(`/admin-organizaciones?id=${id}`);
    } catch (e) {
      extractApiError(e, 'Error al eliminar organización');
    }
  },

  async crearUsuarioOrganizacion(body: UserOrgBody): Promise<{ id: number; usuario_id: number }> {
    try {
      const { data } = await httpClient.patch('/admin-organizaciones', body);
      return data;
    } catch (e) {
      return extractApiError(e, 'Error al crear cuenta de organización');
    }
  },
};
