import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMISION_GESTION,
  ENVIO_GRATIS_DESDE,
  PORTE_DEVOLUCION,
  TARIFAS_ENVIO,
  comisionGestion,
  desglosarCarrito,
  desglosarVenta,
  envioTienda,
  esTamanoValido,
  porteDevolucion,
  tarifaEnvio,
} from "../backend/services/tarifas-segunda-mano.ts";

// Todo lo que decide cuánto dinero se mueve vive en este archivo, y hasta
// ahora no lo cubría ninguna prueba: se iba verificando a mano contra la base
// de datos cada vez que se tocaba, que es exactamente la clase de comprobación
// que se deja de hacer en cuanto hay prisa.

// ── Tramos ────────────────────────────────────────────────────────────────────

test("el tramo desconocido cae al mediano, no revienta", () => {
  assert.equal(tarifaEnvio("XL"), TARIFAS_ENVIO.M);
  assert.equal(tarifaEnvio(null), TARIFAS_ENVIO.M);
  assert.equal(tarifaEnvio(undefined), TARIFAS_ENVIO.M);
  assert.equal(esTamanoValido("XL"), false);
  assert.equal(esTamanoValido("L"), true);
});

// ── Envío de la tienda ────────────────────────────────────────────────────────

test("un pedido paga un solo porte, el del artículo más grande", () => {
  const { importe, tramo } = envioTienda([
    { tamano: "S", precio: 10, cantidad: 1 },
    { tamano: "L", precio: 15, cantidad: 1 },
  ]);
  assert.equal(tramo, "L");
  assert.equal(importe, TARIFAS_ENVIO.L);
});

test("el envío es gratis a partir del umbral", () => {
  const justo = envioTienda([{ tamano: "L", precio: ENVIO_GRATIS_DESDE, cantidad: 1 }]);
  assert.equal(justo.gratis, true);
  assert.equal(justo.importe, 0);

  const porPoco = envioTienda([{ tamano: "L", precio: ENVIO_GRATIS_DESDE - 0.01, cantidad: 1 }]);
  assert.equal(porPoco.gratis, false);
  assert.equal(porPoco.importe, TARIFAS_ENVIO.L);
});

test("el umbral mira el total, no el precio unitario", () => {
  // Tres de 30 € son 90 €: pasa de sobra aunque ninguno llegue solo.
  const { gratis } = envioTienda([{ tamano: "S", precio: 30, cantidad: 3 }]);
  assert.equal(gratis, true);
});

// ── Gastos de gestión ─────────────────────────────────────────────────────────

test("la gestión es un porcentaje y se redondea a dos decimales", () => {
  assert.equal(comisionGestion(45), Math.round(45 * COMISION_GESTION * 100) / 100);
  assert.equal(comisionGestion(10), 0.3);
  // 33,33 × 3 % = 0,9999: si no se redondea, Stripe recibe un importe imposible.
  assert.equal(comisionGestion(33.33), 1);
});

test("un artículo caro aporta más que uno barato", () => {
  // Es la razón de que sea porcentaje y no importe fijo: con un fijo, las
  // ventas caras dejarían de sostener a las baratas.
  assert.ok(comisionGestion(200) > comisionGestion(10) * 10);
});

// ── Desglose de una venta de segunda mano ─────────────────────────────────────

test("el desglose de una venta suma exactamente el total", () => {
  const d = desglosarVenta(45, TARIFAS_ENVIO.M);
  assert.equal(d.producto, 45);
  assert.equal(d.envio, 6.5);
  assert.equal(d.gestion, 1.35);
  assert.equal(d.total, 52.85);
  assert.equal(Math.round((d.producto + d.envio + d.gestion) * 100) / 100, d.total);
});

// ── Carrito ───────────────────────────────────────────────────────────────────

test("dos artículos del mismo vendedor pagan un solo envío", () => {
  const uno = desglosarCarrito([
    { esSegundaMano: true, precio: 20, cantidad: 1, vendedorId: 7 },
  ]);
  const dos = desglosarCarrito([
    { esSegundaMano: true, precio: 20, cantidad: 1, vendedorId: 7 },
    { esSegundaMano: true, precio: 30, cantidad: 1, vendedorId: 7 },
  ]);
  assert.equal(uno.envio, dos.envio);
});

test("dos vendedores distintos pagan dos envíos", () => {
  const d = desglosarCarrito([
    { esSegundaMano: true, precio: 20, cantidad: 1, vendedorId: 7 },
    { esSegundaMano: true, precio: 20, cantidad: 1, vendedorId: 8 },
  ]);
  assert.equal(d.envio, tarifaEnvio("M") * 2);
});

test("el carrito dice cuánto falta para el envío gratis", () => {
  const d = desglosarCarrito([{ esSegundaMano: false, precio: 40, cantidad: 1, tamano: "S" }]);
  assert.equal(d.faltaParaEnvioGratis, Math.round((ENVIO_GRATIS_DESDE - 40) * 100) / 100);

  const cubierto = desglosarCarrito([{ esSegundaMano: false, precio: ENVIO_GRATIS_DESDE, cantidad: 1, tamano: "S" }]);
  assert.equal(cubierto.faltaParaEnvioGratis, 0);
  assert.equal(cubierto.envio, 0);
});

test("el total del carrito es la suma de sus tres partes", () => {
  const d = desglosarCarrito([
    { esSegundaMano: true, precio: 45, cantidad: 1, vendedorId: 3, tamano: "M" },
    { esSegundaMano: false, precio: 12, cantidad: 2, tamano: "S" },
  ]);
  assert.equal(Math.round((d.articulos + d.envio + d.gestion) * 100) / 100, d.total);
});

test("la gestión solo se cobra sobre lo de segunda mano", () => {
  const soloTienda = desglosarCarrito([{ esSegundaMano: false, precio: 30, cantidad: 1, tamano: "S" }]);
  assert.equal(soloTienda.gestion, 0);
});

// ── Porte de la devolución ────────────────────────────────────────────────────

test("el retorno cuesta menos de lo que se cobra por enviar", () => {
  // Al comprador solo se le puede repercutir el coste de la devolución, no un
  // porte con margen: si esto se invierte, le estamos cobrando de más.
  for (const tramo of ["S", "M", "L"] as const) {
    assert.ok(
      PORTE_DEVOLUCION[tramo] < TARIFAS_ENVIO[tramo],
      `el retorno del tramo ${tramo} no puede costar más que su envío`
    );
  }
});

test("el porte de retorno también cae al mediano si el tramo no vale", () => {
  assert.equal(porteDevolucion("XL"), PORTE_DEVOLUCION.M);
  assert.equal(porteDevolucion(null), PORTE_DEVOLUCION.M);
});

// ── Reembolso ─────────────────────────────────────────────────────────────────

// Es la misma cuenta que hace `cobroDelOrigen` en reembolso.ts, que no se
// puede importar aquí porque abre conexión a la base de datos.
const sugerido = (total: number, vuelta: number) =>
  Math.max(Math.round((total - vuelta) * 100) / 100, 0);

test("un desistimiento devuelve el envío de ida y descuenta el de vuelta", () => {
  const articulos = 30;
  const ida = TARIFAS_ENVIO.S;
  const total = articulos + ida;

  const devuelto = sugerido(total, PORTE_DEVOLUCION.S);
  assert.ok(devuelto > articulos, "el porte de ida tiene que volver: lo obliga la ley");
  assert.equal(devuelto, Math.round((total - PORTE_DEVOLUCION.S) * 100) / 100);
});

test("una incidencia no descuenta nada", () => {
  const total = 35.5;
  assert.equal(sugerido(total, 0), total);
});

test("el descuento nunca deja el reembolso en negativo", () => {
  // Un pedido barato con envío gratis: el retorno cuesta más que todo el pedido.
  assert.equal(sugerido(3, PORTE_DEVOLUCION.L), 0);
});
