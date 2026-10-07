import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, clientIp } from "../lib/rate-limit.ts";

test("permite hasta el límite y bloquea después", () => {
  const key = `test-${Math.random()}`;
  for (let i = 0; i < 3; i++) {
    assert.equal(rateLimit(key, 3, 60_000), false);
  }
  assert.equal(rateLimit(key, 3, 60_000), true); // 4º intento
});

test("la ventana se reinicia al expirar", () => {
  const key = `test-${Math.random()}`;
  assert.equal(rateLimit(key, 1, 1), false); // ventana de 1ms
  const start = Date.now();
  while (Date.now() - start < 5) { /* esperar a que expire */ }
  assert.equal(rateLimit(key, 1, 1), false); // nueva ventana
});

test("clientIp lee x-forwarded-for", () => {
  const req = { headers: { get: (h: string) => (h === "x-forwarded-for" ? "1.2.3.4, 5.6.7.8" : null) } };
  assert.equal(clientIp(req as never), "1.2.3.4");
});

test("clientIp cae a 127.0.0.1 sin cabeceras", () => {
  const req = { headers: { get: () => null } };
  assert.equal(clientIp(req as never), "127.0.0.1");
});
