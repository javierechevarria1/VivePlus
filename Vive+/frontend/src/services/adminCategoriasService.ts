import httpClient, { extractApiError } from '../api/httpClient';

export type CatTipo = 'actividades' | 'productos' | 'organizaciones' | 'salud';

export type CatBase = { id: number; color: string; icono?: string; orden: number; activa: boolean };
export type CatNombre = CatBase & { nombre: string };
export type CatProducto = CatBase & { nombre: string; gradiente: string };
export type CatOrg = CatBase & { key: string; label: string; bg_color: string; text_color: string };
export type Categoria = CatNombre | CatProducto | CatOrg;

export const adminCategoriasService = {
  async getCategorias(tipo: CatTipo): Promise<Categoria[]> {
    const { data } = await httpClient.get(`/admin-categorias?tipo=${tipo}`);
    return data.categorias ?? [];
  },

  async crearCategoria(tipo: CatTipo, body: Record<string, unknown>): Promise<void> {
    try {
      await httpClient.post(`/admin-categorias?tipo=${tipo}`, body);
    } catch (e) {
      extractApiError(e, 'Error al crear categoría');
    }
  },

  async editarCategoria(tipo: CatTipo, body: Record<string, unknown>): Promise<void> {
    try {
      await httpClient.put(`/admin-categorias?tipo=${tipo}`, body);
    } catch (e) {
      extractApiError(e, 'Error al editar categoría');
    }
  },

  async eliminarCategoria(tipo: CatTipo, id: number): Promise<void> {
    try {
      await httpClient.delete(`/admin-categorias?tipo=${tipo}&id=${id}`);
    } catch (e) {
      extractApiError(e, 'Error al eliminar categoría');
    }
  },
};
