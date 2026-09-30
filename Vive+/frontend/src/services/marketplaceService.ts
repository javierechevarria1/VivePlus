import httpClient, { extractApiError } from '../api/httpClient';

export type CatProductoDB = {
  id: number;
  nombre: string;
  color: string;
  gradiente: string;
  icono: string;
  orden: number;
};

export type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  productos_categoria_id: number | null;
  categoria: string;
  imagen: string;
  stock: number;
  tamano_paquete: string | null;
  specs: { label: string; value: string }[];
  destacados: string[];
};

type ProductoBody = {
  nombre: string;
  descripcion: string;
  precio: number;
  productos_categoria_id: number | null;
  imagen: string;
  stock: number;
  tamano_paquete: string | null;
  specs: { label: string; value: string }[];
  destacados: string[];
};

export const marketplaceService = {
  async getProductos(): Promise<Producto[]> {
    const { data } = await httpClient.get('/marketplace');
    return Array.isArray(data) ? data : [];
  },

  async getTecnologias(): Promise<Producto[]> {
    const { data } = await httpClient.get('/tecnologias');
    return Array.isArray(data) ? data : [];
  },

  async crearTecnologia(body: ProductoBody): Promise<void> {
    try {
      await httpClient.post('/tecnologias', body);
    } catch (e) {
      extractApiError(e, 'Error al crear tecnología');
    }
  },

  async editarTecnologia(id: number, body: ProductoBody): Promise<void> {
    try {
      await httpClient.put('/tecnologias', { id, ...body });
    } catch (e) {
      extractApiError(e, 'Error al editar tecnología');
    }
  },

  async eliminarTecnologia(id: number): Promise<void> {
    try {
      await httpClient.delete(`/tecnologias?id=${id}`);
    } catch (e) {
      extractApiError(e, 'Error al eliminar tecnología');
    }
  },

  async getCategoriasProductos(): Promise<CatProductoDB[]> {
    const { data } = await httpClient.get('/categorias?tipo=productos');
    return data.categorias ?? [];
  },

  async crearProducto(body: ProductoBody): Promise<void> {
    try {
      await httpClient.post('/marketplace', body);
    } catch (e) {
      extractApiError(e, 'Error al crear producto');
    }
  },

  async editarProducto(id: number, body: ProductoBody): Promise<void> {
    try {
      await httpClient.put('/marketplace', { id, ...body });
    } catch (e) {
      extractApiError(e, 'Error al editar producto');
    }
  },

  async eliminarProducto(id: number): Promise<void> {
    try {
      await httpClient.delete(`/marketplace?id=${id}`);
    } catch (e) {
      extractApiError(e, 'Error al eliminar producto');
    }
  },
};
