import httpClient from '../api/httpClient';

export type CartItem = {
  id?: number;
  nombre: string;
  precio: string;
  imagen: string;
  categoria: string;
  cantidad: number;
  expires_at?: string;
  // Solo relevante en segunda mano: el envío se cobra una vez por vendedor.
  id_vendedor?: number | null;
  // Decide la tarifa de envío. En la tienda manda el del artículo más grande.
  tamano_paquete?: string | null;
};

export const carritoService = {
  async getCarrito(): Promise<CartItem[]> {
    const { data } = await httpClient.get('/carrito');
    return Array.isArray(data) ? data : [];
  },

  async guardarCarrito(items: CartItem[]): Promise<{ stocks?: { producto_id: number; stock: number }[] }> {
    const { data } = await httpClient.post('/carrito', items);
    return data ?? {};
  },

  async limpiarCarrito(): Promise<void> {
    await httpClient.delete('/carrito');
  },
};
