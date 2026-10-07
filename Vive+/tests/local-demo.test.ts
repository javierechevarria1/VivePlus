import { test } from "node:test";
import assert from "node:assert/strict";
import { handleLocalDemoApi } from "../lib/local-demo-data.ts";

test("el modo demo sirve un catálogo local sin pasar al controlador", async () => {
  const previous = process.env.LOCAL_DEMO;
  process.env.LOCAL_DEMO = "true";
  try {
    const response = handleLocalDemoApi(
      new Request("http://localhost/api/marketplace"),
      "marketplace",
    );
    assert.ok(response);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.length, 1);
    assert.equal(data[0].nombre, "Pack de bienestar y cuidado");
  } finally {
    if (previous === undefined) delete process.env.LOCAL_DEMO;
    else process.env.LOCAL_DEMO = previous;
  }
});

test("el modo demo devuelve vacío para pedidos sin consultar servicios externos", async () => {
  const previous = process.env.LOCAL_DEMO;
  process.env.LOCAL_DEMO = "true";
  try {
    const response = handleLocalDemoApi(
      new Request("http://localhost/api/ordenes"),
      "ordenes",
    );
    assert.ok(response);
    assert.deepEqual(await response.json(), { ok: true, data: [] });
  } finally {
    if (previous === undefined) delete process.env.LOCAL_DEMO;
    else process.env.LOCAL_DEMO = previous;
  }
});

test("las APIs no implementadas no se reenvían al backend cuando la demo está activa", async () => {
  const previous = process.env.LOCAL_DEMO;
  process.env.LOCAL_DEMO = "true";
  try {
    const response = handleLocalDemoApi(
      new Request("http://localhost/api/acciones-externas"),
      "acciones-externas",
    );
    assert.ok(response);
    assert.equal(response.status, 501);
  } finally {
    if (previous === undefined) delete process.env.LOCAL_DEMO;
    else process.env.LOCAL_DEMO = previous;
  }
});

test("el modo demo se puede desactivar para conservar las API de producción", () => {
  const previous = process.env.LOCAL_DEMO;
  delete process.env.LOCAL_DEMO;
  try {
    assert.equal(
      handleLocalDemoApi(new Request("http://localhost/api/marketplace"), "marketplace"),
      null,
    );
  } finally {
    if (previous !== undefined) process.env.LOCAL_DEMO = previous;
  }
});
