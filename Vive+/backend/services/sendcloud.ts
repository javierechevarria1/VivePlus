import type { TamanoPaquete } from "./tarifas-segunda-mano";

// Cliente de Sendcloud para generar la etiqueta de envío ya pagada.
//
// Toda la integración está detrás de `sendcloudConfigurado()`: mientras no
// haya credenciales en el entorno, no se llama a nada y la venta sigue el
// camino manual de siempre (el vendedor envía y anota el seguimiento). Eso
// permite tener esto en producción antes de contratar la cuenta.
//
// Se usa la API v3: las cuentas nuevas tienen cerrada la creación de envíos
// por la v2, que responde 403 remitiendo a la v3.

const HOST = "https://panel.sendcloud.sc";

export function sendcloudConfigurado(): boolean {
  return Boolean(process.env.SENDCLOUD_PUBLIC_KEY && process.env.SENDCLOUD_SECRET_KEY);
}

export function cabeceraAuth(): string {
  const par = `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`;
  return `Basic ${Buffer.from(par).toString("base64")}`;
}

// Qué servicio se contrata para cada tramo. Son códigos propios del catálogo
// de Sendcloud ("correos:standard", "correos_express:paq24"...) y dependen de
// los transportistas que tenga activados la cuenta, así que se configuran por
// entorno. `POST /api/v3/shipping-options` los lista.
function opcionEnvio(tamano: TamanoPaquete): { codigo: string; contrato?: number } | null {
  const codigos: Record<TamanoPaquete, string | undefined> = {
    S: process.env.SENDCLOUD_OPCION_S,
    M: process.env.SENDCLOUD_OPCION_M,
    L: process.env.SENDCLOUD_OPCION_L,
  };
  const contratos: Record<TamanoPaquete, string | undefined> = {
    S: process.env.SENDCLOUD_CONTRATO_S,
    M: process.env.SENDCLOUD_CONTRATO_M,
    L: process.env.SENDCLOUD_CONTRATO_L,
  };

  const codigo = codigos[tamano]?.trim();
  if (!codigo) return null;

  const contrato = Number(contratos[tamano]);
  return { codigo, ...(Number.isFinite(contrato) && contrato > 0 ? { contrato } : {}) };
}

// Peso y medidas declarados por tramo. Sendcloud los exige y con ellos calcula
// la tarifa; se manda el techo del tramo para que nunca salga por debajo de lo
// que se le cobró al comprador.
const PAQUETE_TRAMO: Record<TamanoPaquete, { peso: string; largo: string; ancho: string; alto: string }> = {
  S: { peso: "2",  largo: "30", ancho: "20", alto: "10" },
  M: { peso: "5",  largo: "40", ancho: "30", alto: "20" },
  L: { peso: "15", largo: "60", ancho: "40", alto: "40" },
};

export type DireccionEnvio = {
  nombre: string;
  direccion: string;
  cp: string;
  ciudad: string;
  pais?: string;
  telefono?: string | null;
  email?: string | null;
};

export type EtiquetaCreada = {
  sendcloudId: string;
  etiquetaUrl: string | null;
  seguimiento: string | null;
  seguimientoUrl: string | null;
  transportista: string | null;
};

// Los datos del comprador llegan como una sola cadena («Nombre — Calle — CP
// Ciudad — email — teléfono»), que es como los guarda la orden. Para la
// etiqueta hacen falta por separado.
export function partirDireccionComprador(texto: string | null | undefined): DireccionEnvio | null {
  if (!texto?.trim()) return null;

  const partes = texto.split(/\s+[—-]\s+/).map(p => p.trim()).filter(Boolean);
  if (partes.length < 3) return null;

  const cpCiudad = /^(\d{5})\s+(.+)$/.exec(partes[2] ?? "");
  if (!cpCiudad) return null;

  return {
    nombre: partes[0],
    direccion: partes[1],
    cp: cpCiudad[1],
    ciudad: cpCiudad[2],
    pais: "ES",
    email: partes.find(p => p.includes("@")) ?? null,
    telefono: partes.find(p => /^\+?[\d\s]{9,}$/.test(p)) ?? null,
  };
}

// Desde dónde salen los paquetes de la tienda, y a dónde vuelven los que se
// devuelven. Es siempre la misma dirección, así que va en el entorno y no se
// le pide a nadie.
export function direccionTienda(): DireccionEnvio | null {
  const direccion = process.env.TIENDA_DIRECCION;
  const cp = process.env.TIENDA_CP;
  const ciudad = process.env.TIENDA_CIUDAD;
  if (!direccion || !cp || !ciudad) return null;

  return {
    nombre: process.env.TIENDA_NOMBRE || "Vive+",
    direccion,
    cp,
    ciudad,
    pais: "ES",
    telefono: process.env.TIENDA_TELEFONO ?? null,
    email: process.env.TIENDA_EMAIL ?? process.env.ADMIN_EMAIL ?? null,
  };
}

const comoDireccion = (d: DireccionEnvio) => ({
  name: d.nombre,
  address_line_1: d.direccion,
  postal_code: d.cp,
  city: d.ciudad,
  country_code: d.pais ?? "ES",
  ...(d.telefono ? { phone_number: d.telefono } : {}),
  ...(d.email ? { email: d.email } : {}),
});

export async function crearEtiqueta(params: {
  referencia: string;
  tamano: TamanoPaquete;
  destino: DireccionEnvio;
  origen: DireccionEnvio;
  descripcion: string;
}): Promise<{ ok: true; datos: EtiquetaCreada } | { ok: false; motivo: string }> {
  if (!sendcloudConfigurado()) {
    return { ok: false, motivo: "Sendcloud no configurado" };
  }

  const opcion = opcionEnvio(params.tamano);
  if (!opcion) {
    return { ok: false, motivo: `Sin servicio de envío configurado para el tramo ${params.tamano}` };
  }

  const p = PAQUETE_TRAMO[params.tamano];

  const cuerpo = {
    to_address: comoDireccion(params.destino),
    // Remitente: de aquí sale el paquete y aquí vuelve si el comprador no lo
    // recoge a tiempo.
    from_address: comoDireccion(params.origen),
    ship_with: {
      type: "shipping_option_code",
      properties: {
        shipping_option_code: opcion.codigo,
        ...(opcion.contrato ? { contract_id: opcion.contrato } : {}),
      },
    },
    parcels: [{
      weight: { value: p.peso, unit: "kg" },
      dimensions: { length: p.largo, width: p.ancho, height: p.alto, unit: "cm" },
      parcel_items: [{ description: params.descripcion, quantity: 1 }],
    }],
    order_number: params.referencia,
  };

  try {
    const res = await fetch(`${HOST}/api/v3/shipments/announce`, {
      method: "POST",
      headers: { Authorization: cabeceraAuth(), "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });

    const texto = await res.text();
    if (!res.ok) {
      return { ok: false, motivo: `Sendcloud respondió ${res.status}: ${texto.slice(0, 300)}` };
    }

    const datos = JSON.parse(texto)?.data ?? {};
    const parcel = datos.parcels?.[0] ?? {};
    const documento = (parcel.documents ?? []).find((d: { type?: string }) => d.type === "label")
      ?? parcel.documents?.[0];

    return {
      ok: true,
      datos: {
        sendcloudId: String(datos.id ?? parcel.id),
        // Enlace relativo a la API: descargarlo exige autenticación, así que
        // se guarda tal cual y se sirve desde /api/etiqueta-envio.
        etiquetaUrl: documento?.link ?? null,
        seguimiento: parcel.tracking_number ?? null,
        seguimientoUrl: parcel.tracking_url ?? null,
        transportista: datos.carrier?.name ?? datos.carrier?.code ?? null,
      },
    };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

// Anula un envío anunciado que no se va a usar. Sendcloud solo deja cancelar
// mientras el transportista no lo haya recogido, que es justo el caso de una
// devolución caducada: la etiqueta se compró y el paquete nunca salió.
//
// Devuelve si se pudo o no, sin lanzar: es una limpieza, y que falle no puede
// impedir que la devolución se cierre.
export async function anularEtiqueta(sendcloudId: string): Promise<{ ok: boolean; motivo?: string }> {
  if (!sendcloudConfigurado()) return { ok: false, motivo: "Sendcloud no configurado" };

  try {
    const res = await fetch(`${HOST}/api/v3/shipments/${encodeURIComponent(sendcloudId)}/cancel`, {
      method: "POST",
      headers: { Authorization: cabeceraAuth(), "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const texto = await res.text();
      return { ok: false, motivo: `Sendcloud respondió ${res.status}: ${texto.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

// Sendcloud no manda un evento distinto por estado: manda el paquete entero
// con su estado actual, y hay que traducirlo a los estados de la venta.
export function estadoVentaDesdeEnvio(estadoSendcloud: string | null | undefined): "enviado" | "entregado" | null {
  const e = (estadoSendcloud ?? "").toLowerCase();
  if (!e) return null;

  if (e.includes("delivered")) return "entregado";

  // Todo lo que implique que el paquete ya está en manos del transportista
  // cuenta como enviado: anunciado no basta, porque eso solo significa que
  // la etiqueta existe.
  const enCamino = ["shipped", "en route", "at sorting", "at customs", "being sorted", "delivery attempt", "at pick-up", "ready to send", "picked up"];
  if (enCamino.some(t => e.includes(t))) return "enviado";

  return null;
}
