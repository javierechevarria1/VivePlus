import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { jwtVerify } from "jose";
import { detectImageExt } from "@/lib/imagen";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

export async function POST(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    await jwtVerify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("imagen") as File | null;

  if (!file) return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen no puede superar 5MB" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = detectImageExt(buffer);
  if (!ext) {
    return NextResponse.json({ error: "El archivo no es una imagen válida" }, { status: 400 });
  }

  const filename = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const imgDir = join(process.cwd(), "public", "img");
  await mkdir(imgDir, { recursive: true });
  await writeFile(join(imgDir, filename), buffer);

  return NextResponse.json({ url: `/img/${filename}` });
}
