import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import os from "os";

const DOCS_DIR = process.env.DOCS_STORAGE_DIR || join(os.homedir(), ".relatia55", "docs-cuidadores");

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("documento") as File | null;

  if (!file) return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });

  const allowedTypes = [
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido. Sube PDF o imagen." }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo no puede superar 10MB" }, { status: 400 });
  }

  const ext = file.type === "application/pdf"
    ? "pdf"
    : (file.name.split(".").pop()?.toLowerCase() ?? "jpg");
  const filename = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await mkdir(DOCS_DIR, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(join(DOCS_DIR, filename), Buffer.from(bytes));

  return NextResponse.json({ url: `/api/docs-file/${filename}` });
}
