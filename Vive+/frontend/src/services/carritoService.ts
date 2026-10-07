import httpClient from '../api/httpClient';

const LOCAL_DEMO = process.env.NEXT_PUBLIC_LOCAL_DEMO === 'true';
const DEMO_CART_KEY = 'viveplus:demo:cart:v1';

function readDemoCart(): CartItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(DEMO_CART_KEY) ?? '[]');
    return Array.isArray(value) ? value as CartItem[] : [];
  } catch (error) {
    console.warn('No se pudo leer el carrito demo guardado en este navegador.', error);
    return [];
  }
}

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
    if (LOCAL_DEMO) return readDemoCart();
    const { data } = await httpClient.get('/carrito');
    return Array.isArray(data) ? data : [];
  },

  async guardarCarrito(items: CartItem[]): Promise<{ stocks?: { producto_id: number; stock: number }[] }> {
    if (LOCAL_DEMO) {
      localStorage.setItem(DEMO_CART_KEY, JSON.stringify(items));
      return {};
    }
    const { data } = await httpClient.post('/carrito', items);
    return data ?? {};
  },

  async limpiarCarrito(): Promise<void> {
    if (LOCAL_DEMO) {
      localStorage.removeItem(DEMO_CART_KEY);
      return;
    }
    await httpClient.delete('/carrito');
  },
};
