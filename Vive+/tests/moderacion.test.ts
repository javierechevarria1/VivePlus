import { test } from "node:test";
import assert from "node:assert/strict";
import { contieneLenguajeInapropiado } from "../lib/moderacion.ts";

test("detecta insultos directos", () => {
  assert.equal(contieneLenguajeInapropiado("eres un idiota"), true);
  assert.equal(contieneLenguajeInapropiado("vete a la mierda"), true);
});

test("detecta evasión con separadores", () => {
  assert.equal(contieneLenguajeInapropiado("eres un i.d.i.o.t.a"), true);
  assert.equal(contieneLenguajeInapropiado("una p u t a"), true);
});

test("detecta con acentos/mayúsculas", () => {
  assert.equal(contieneLenguajeInapropiado("IMBÉCIL"), true);
});

test("no da falsos positivos en palabras legítimas", () => {
  assert.equal(contieneLenguajeInapropiado("tenemos una disputa"), false);
  assert.equal(contieneLenguajeInapropiado("tiene buena reputación"), false);
  assert.equal(contieneLenguajeInapropiado("hola, buenos días"), false);
});
