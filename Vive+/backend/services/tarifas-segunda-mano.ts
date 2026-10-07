
// Fuente única del desglose de una compra de segunda mano.
//
// El vendedor cobra el 100% del precio que puso: la plataforma ya no le
// descuenta comisión. Lo que la plataforma ingresa se le suma al comprador
// en dos conceptos separados, para que la factura de Stripe salga
// desglosada y el comprador vea qué paga antes de pulsar.

// Porcentaje y no importe fijo a propósito: lo que cubre este cargo es el
// riesgo de tener que reembolsar, y reembolsar un artículo de 200 € expone a
// 200 €, no a 10 €. Con un fijo, las ventas caras dejarían de sostener a las
// baratas y el modelo se cae por arriba.
export const COMISION_GESTION = 0.03;

// Tarifa por tramo de tamaño. Un fijo único no se sostiene: el mismo importe
// no puede cubrir una taza y un sillón.
//
// PROVISIONAL: dimensionadas para entrega a DOMICILIO (no punto de recogida),
// suponiendo que la etiqueta cueste unos 4,50 / 5,50 / 7,00 €. Es una
// estimación, no una tarifa negociada: hay que revisarlas con los precios
// reales del agregador antes de que haya volumen. Cada tramo debe cubrir como
// mínimo el coste de su etiqueta, o se pierde dinero en cada envío.
export const TARIFAS_ENVIO = { S: 5.50, M: 6.50, L: 8.95 } as const;

export type TamanoPaquete = keyof typeof TARIFAS_ENVIO;

// Respaldo para los productos publicados antes de que existiera el campo, que
// aún no tienen tramo asignado. No es la opción normal: al publicar hay que
// elegirlo, y a los antiguos se les pide que lo completen.
export const TAMANO_POR_DEFECTO: TamanoPaquete = "M";

// Cómo se le explica cada tramo al vendedor. Sin referencias concretas nadie
// sabe si su paquete es "mediano", y un tramo mal elegido lo paga la plataforma.
export const TRAMOS_ENVIO: { valor: TamanoPaquete; titulo: string; limite: string; ejemplos: string }[] = [
  { valor: "S", titulo: "Pequeño", limite: "hasta 2 kg", ejemplos: "Un libro, ropa, un móvil, una cartera" },
  { valor: "M", titulo: "Mediano", limite: "hasta 5 kg", ejemplos: "Unos zapatos, un bolso, una tablet, un pastillero" },
  { valor: "L", titulo: "Grande", limite: "hasta 15 kg", ejemplos: "Una lámpara, una maleta, un pequeño electrodoméstico" },
];

// Días que tiene el vendedor para enviar antes de que la venta se considere
// incumplida.
export const DIAS_LIMITE_ENVIO = 5;

// Plazo hasta que el dinero se libera solo, contado desde el ENVÍO. Es largo
// porque sin seguimiento automático no se sabe cuándo llegó el paquete y hay
// que dar margen a que viaje.
export const DIAS_AUTO_CONFIRMACION = 14;

// El mismo plazo cuando el transportista confirma la entrega: al contar desde
// que el paquete está en manos del comprador, basta con darle tiempo a
// abrirlo y avisar si algo va mal. Es lo que hace Wallapop.
export const DIAS_TRAS_ENTREGA = 2;

// Lo que tiene el comprador para devolver el paquete desde que se le acepta la
// devolución y se le manda la etiqueta pagada. Es el mismo plazo que la ley le
// da para desistir, así que no hay que explicar dos números distintos; pasado,
// la devolución se cierra sola y la etiqueta se da por perdida.
export const DIAS_LIMITE_RETORNO = 14;

// Lo que se le descuenta del reembolso por el viaje de vuelta cuando devuelve
// porque ha cambiado de opinión.
//
// La ley permite cobrarle el coste directo de la devolución siempre que se le
// avise ANTES de comprar —por eso el aviso está en el carrito— pero lo que se
// le puede pasar es el coste, no una tarifa con margen: por eso estos importes
// son más bajos que los de TARIFAS_ENVIO, que sí es precio de venta.
//
// PROVISIONAL, igual que las tarifas de venta: son la estimación de lo que
// cuesta la etiqueta hasta que haya presupuesto real del transportista.
//
// Solo aplica al desistimiento. Si el producto llegó roto, no llegó o no era
// el que se pidió, el fallo es nuestro y no se descuenta nada.
export const PORTE_DEVOLUCION = { S: 4.50, M: 5.50, L: 7.00 } as const;

export function porteDevolucion(tamano?: string | null): number {
  return PORTE_DEVOLUCION[esTamanoValido(tamano) ? tamano : TAMANO_POR_DEFECTO];
}

export type DesgloseSegundaMano = {
  producto: number;
  envio: number;
  gestion: number;
  total: number;
};

const dosDecimales = (n: number) => Math.round(n * 100) / 100;

export function esTamanoValido(valor: unknown): valor is TamanoPaquete {
  return typeof valor === "string" && valor in TARIFAS_ENVIO;
}

export function tarifaEnvio(tamano?: string | null): number {
  return TARIFAS_ENVIO[esTamanoValido(tamano) ? tamano : TAMANO_POR_DEFECTO];
}

export function comisionGestion(precioProducto: number): number {
  return dosDecimales(precioProducto * COMISION_GESTION);
}

// `envio` se pasa aparte porque se cobra una vez por vendedor, no una vez
// por artículo: quien calcula el desglose es quien sabe si a este producto le
// toca pagarlo o si va agrupado con otro del mismo vendedor.
export function desglosarVenta(precioProducto: number, envio: number): DesgloseSegundaMano {
  const producto = dosDecimales(precioProducto);
  const gestion = comisionGestion(producto);
  const envioRedondeado = dosDecimales(envio);
  return {
    producto,
    envio: envioRedondeado,
    gestion,
    total: dosDecimales(producto + envioRedondeado + gestion),
  };
}

export function fechaLimite(dias: number, desde: Date = new Date()): Date {
  return new Date(desde.getTime() + dias * 24 * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Envío de los productos de la tienda
//
// Aquí el vendedor es siempre la plataforma y todo el pedido va en un mismo
// paquete, así que no se suma un envío por artículo: se cobra el tramo del
// más grande, que es el que decide la caja.

// A partir de este importe el envío no se cobra. Es la palanca comercial
// habitual —anima a llenar el carrito— y absorbe el porte en los pedidos
// donde el margen ya da para pagarlo. A 0 se cobraría siempre.
export const ENVIO_GRATIS_DESDE = Number(process.env.ENVIO_GRATIS_DESDE ?? 60);

export function envioTienda(
  lineas: { tamano?: string | null; precio: number; cantidad: number }[]
): { importe: number; tramo: TamanoPaquete; gratis: boolean } {
  const subtotal = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);

  // El tramo del artículo más grande manda: si en la caja va una tablet, da
  // igual que la acompañe un pastillero.
  const orden: TamanoPaquete[] = ["S", "M", "L"];
  let mayor: TamanoPaquete = "S";
  for (const linea of lineas) {
    const t = esTamanoValido(linea.tamano) ? linea.tamano : TAMANO_POR_DEFECTO;
    if (orden.indexOf(t) > orden.indexOf(mayor)) mayor = t;
  }

  const gratis = ENVIO_GRATIS_DESDE > 0 && subtotal >= ENVIO_GRATIS_DESDE;
  return { importe: gratis ? 0 : tarifaEnvio(mayor), tramo: mayor, gratis };
}

// ---------------------------------------------------------------------------

export type LineaCarrito = {
  esSegundaMano: boolean;
  precio: number;
  cantidad: number;
  vendedorId?: number | null;
  tamano?: string | null;
};

// Mismo cálculo que hace el checkout, para que lo que el comprador ve en el
// carrito sea exactamente lo que le va a cobrar Stripe. Si dos artículos son
// del mismo vendedor, el envío se cobra una sola vez.
export function desglosarCarrito(lineas: LineaCarrito[]): {
  articulos: number; envio: number; gestion: number; total: number; faltaParaEnvioGratis: number;
} {
  let articulos = 0;
  let envio = 0;
  let gestion = 0;
  const vendedoresConEnvio = new Set<number | string>();

  for (const linea of lineas) {
    const subtotal = linea.precio * linea.cantidad;
    articulos += subtotal;
    if (!linea.esSegundaMano) continue;

    gestion += comisionGestion(subtotal);

    // Sin vendedor conocido se cobra envío aparte: es lo que hará el servidor
    // al no poder agruparlo con nada.
    const clave = linea.vendedorId ?? `sin-vendedor-${articulos}`;
    if (!vendedoresConEnvio.has(clave)) {
      vendedoresConEnvio.add(clave);
      envio += tarifaEnvio(TAMANO_POR_DEFECTO);
    }
  }

  // Los productos de la tienda pagan un solo porte entre todos, porque salen
  // en el mismo paquete. Se calcula aparte del de segunda mano.
  const deTienda = lineas.filter(l => !l.esSegundaMano);
  let faltaParaEnvioGratis = 0;
  if (deTienda.length > 0) {
    const envioT = envioTienda(deTienda);
    envio += envioT.importe;

    if (!envioT.gratis && ENVIO_GRATIS_DESDE > 0) {
      const subtotalTienda = deTienda.reduce((s, l) => s + l.precio * l.cantidad, 0);
      faltaParaEnvioGratis = dosDecimales(Math.max(0, ENVIO_GRATIS_DESDE - subtotalTienda));
    }
  }

  return {
    articulos: dosDecimales(articulos),
    envio: dosDecimales(envio),
    gestion: dosDecimales(gestion),
    total: dosDecimales(articulos + envio + gestion),
    faltaParaEnvioGratis,
  };
}
