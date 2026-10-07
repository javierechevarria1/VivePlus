import { test } from "node:test";
import assert from "node:assert/strict";
import { detectImageExt } from "../lib/imagen.ts";

test("detecta JPEG por magic bytes", () => {
  const buf = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(9)]);
  assert.equal(detectImageExt(buf), "jpg");
});

test("detecta PNG por magic bytes", () => {
  const buf = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(8)]);
  assert.equal(detectImageExt(buf), "png");
});

test("detecta GIF", () => {
  const buf = Buffer.concat([Buffer.from("GIF89a"), Buffer.alloc(6)]);
  assert.equal(detectImageExt(buf), "gif");
});

test("detecta WEBP", () => {
  const buf = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBP")]);
  assert.equal(detectImageExt(buf), "webp");
});

test("rechaza contenido no-imagen (ej. HTML/script con extensión falsa)", () => {
  const buf = Buffer.from("<html><script>alert(1)</script></html>");
  assert.equal(detectImageExt(buf), null);
});

test("rechaza buffer demasiado corto", () => {
  assert.equal(detectImageExt(Buffer.from([0xff, 0xd8])), null);
});
