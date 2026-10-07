"use client";

import { useState, ReactNode, useEffect, useRef, useCallback, useMemo } from "react";
import PusherClient from "pusher-js";
import { carritoService, type CartItem } from "@/frontend/src/services/carritoService";
import { Ctx } from "./useCart";

// El nombre no identifica un producto: dos artículos distintos pueden llamarse
// igual, y usarlo como clave hacía que añadir uno sumara cantidad al otro y que
// borrar uno se llevara los dos. La identidad real es el id; solo se cae al
// nombre para las líneas heredadas que se guardaron sin producto_id.
function mismoItem(a: Pick<CartItem, "id" | "nombre">, b: Pick<CartItem, "id" | "nombre">): boolean {
  if (a.id != null && b.id != null) return a.id === b.id;
  if (a.id != null || b.id != null) return false;
  return a.nombre === b.nombre;
}

function emitirStockChange(id: number | undefined, delta: number) {
  if (!id) return;
  window.dispatchEvent(new CustomEvent("relatia-stock-change", { detail: { producto_id: id, delta } }));
  const sc = new BroadcastChannel("relatia-stock");
  sc.postMessage({ producto_id: id, delta });
  sc.close();
}

function emitirStockLocal(id: number | undefined, delta: number) {
  if (!id) return;
  window.dispatchEvent(new CustomEvent("relatia-stock-change", { detail: { producto_id: id, delta } }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const pagadoRef = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channel  = useRef<BroadcastChannel | null>(null);
  const cargando = useRef(false);
  const usuarioIdRef = useRef<number | null>(null);
  const itemsRef = useRef<CartItem[]>([]);
  const cargarCarritoRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => { itemsRef.current = items; }, [items]);

  const cargarCarrito = useCallback(async () => {
    const authed = typeof window !== "undefined" && sessionStorage.getItem("r65_authed") === "true";

    let isMedico = false;
    let usuarioId: number | null = null;
    try {
      const u = typeof window !== "undefined" ? sessionStorage.getItem("r65_user:v1") : null;
      if (u) {
        const parsed = JSON.parse(u);
        isMedico = parsed.rol === "medico";
        usuarioId = parsed?.id ?? null;
      }
    } catch {}

    if (isMedico) {
      setItems([]);
      setAutenticado(false);
      setLoaded(true);
      return;
    }

    if (!authed && typeof window !== "undefined") {
      if (!document.cookie.includes("r65_guest=")) {
        const uuid = crypto.randomUUID();
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `r65_guest=${uuid}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`;
      }
    }

    cargando.current = true;
    try {
      const data = await carritoService.getCarrito();
      if (!pagadoRef.current) setItems(data);
    } catch {}
    cargando.current = false;
    setAutenticado(true);
    setLoaded(true);
    usuarioIdRef.current = usuarioId;
  }, []);

  const getMiUsuarioId = () => usuarioIdRef.current;

  useEffect(() => {
    channel.current = new BroadcastChannel("relatia-cart");
    channel.current.onmessage = (e) => {
      const miId = getMiUsuarioId();
      if (e.data?.usuarioId !== null && e.data?.usuarioId !== miId) return;
      if (e.data?.type === "cart-update") setItems(e.data.items);
      if (e.data?.type === "cart-clear")  setItems([]);
    };
    return () => channel.current?.close();
  }, []);

  useEffect(() => {
    cargarCarritoRef.current = cargarCarrito;
  }, [cargarCarrito]);

  // Un producto de segunda mano es pieza única: cuando se vende (o el vendedor lo
  // retira) hay que sacarlo del carrito de quien lo tuviera, sin esperar al pago.
  // Solo se abre la conexión mientras haya algo de segunda mano en el carrito:
  // este provider vive en el layout raíz y si no, cada visita mantendría un
  // websocket abierto en todas las páginas para un evento que no le aplica.
  const tieneSegundaMano = items.some((i) => i.categoria === "Segunda Mano");

  useEffect(() => {
    if (!tieneSegundaMano) return;
    if (process.env.NEXT_PUBLIC_LOCAL_DEMO === "true") return;

    const key     = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const client    = new PusherClient(key, { cluster });
    const smChannel = client.subscribe("segunda-mano");

    smChannel.bind("producto-vendido", (data: { id: number }) => {
      const vendido = itemsRef.current.find((i) => i.id === data.id);
      if (!vendido) return;
      setItems((prev) => prev.filter((i) => i.id !== data.id));
      window.dispatchEvent(
        new CustomEvent("relatia-item-no-disponible", { detail: { nombre: vendido.nombre } })
      );
    });

    return () => {
      smChannel.unbind_all();
      client.unsubscribe("segunda-mano");
      client.disconnect();
    };
  }, [tieneSegundaMano]);

  useEffect(() => {
    const handler = () => cargarCarritoRef.current();
    queueMicrotask(() => { cargarCarritoRef.current(); });
    window.addEventListener("relatia-auth-changed", handler);
    return () => window.removeEventListener("relatia-auth-changed", handler);
  }, []);

  useEffect(() => {
    if (!loaded || !autenticado || cargando.current) return;

    if (syncTimer.current) clearTimeout(syncTimer.current);

    channel.current?.postMessage({ type: "cart-update", items, usuarioId: getMiUsuarioId() });

    syncTimer.current = setTimeout(() => {
      if (items.length === 0) {
        carritoService.limpiarCarrito().catch(() => {});
        return;
      }

      carritoService.guardarCarrito(items)
        .then((data) => {
          if (Array.isArray(data.stocks)) {
            for (const s of data.stocks as { producto_id: number; stock: number }[]) {
              window.dispatchEvent(
                new CustomEvent("relatia-stock-change", {
                  detail: { producto_id: s.producto_id, stock: s.stock },
                })
              );
            }
          }
        })
        .catch(() => {});
    }, 200);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [items, loaded, autenticado]);

  const addItem = useCallback((item: Omit<CartItem, "cantidad">) => {
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    setItems((prev) => {
      const existing = prev.find((i) => mismoItem(i, item));
      if (existing) return prev.map((i) => mismoItem(i, item) ? { ...i, cantidad: i.cantidad + 1, expires_at } : i);
      return [...prev, { ...item, cantidad: 1, expires_at }];
    });
  }, []);

  const removeItem = useCallback((objetivo: CartItem) => {
    const item = items.find((i) => mismoItem(i, objetivo));
    if (item?.id) emitirStockLocal(item.id, item.cantidad);
    setItems((prev) => prev.filter((i) => !mismoItem(i, objetivo)));
  }, [items]);

  const updateQty = useCallback((objetivo: CartItem, delta: number) => {
    const item = items.find((i) => mismoItem(i, objetivo));
    if (item) {
      const next = item.cantidad + delta;
      if (next <= 0) emitirStockLocal(item.id, item.cantidad);
      else if (delta > 0) emitirStockChange(item.id, -delta);
      else emitirStockLocal(item.id, -delta);
    }
    setItems((prev) =>
      prev.flatMap((i) => {
        if (!mismoItem(i, objetivo)) return [i];
        const next = i.cantidad + delta;
        if (next <= 0) return [];
        return [{ ...i, cantidad: next }];
      })
    );
  }, [items]);

  const clearCart = useCallback(() => {
    pagadoRef.current = true;
    setItems([]);
    channel.current?.postMessage({ type: "cart-clear", usuarioId: getMiUsuarioId() });
    carritoService.limpiarCarrito().catch(() => {});
  }, []);

  const total = items.reduce((sum, i) => sum + parseFloat(i.precio.replace("€", "")) * i.cantidad, 0);
  const count = items.reduce((sum, i) => sum + i.cantidad, 0);

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQty, clearCart, total, count }),
    [items, addItem, removeItem, updateQty, clearCart, total, count]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}
