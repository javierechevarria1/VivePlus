import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import os from "os";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const DOCS_DIR = process.env.DOCS_STORAGE_DIR || join(os.homedir(), ".relatia55", "docs-cuidadores");

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(token, JWT_SECRET);
    payload = result.payload as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  if (payload.rol !== "admin") {
    return NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 });
  }

  const { filename } = await params;
  if (!/^doc_[a-zA-Z0-9_]+\.(pdf|png|jpg|jpeg|webp)$/.test(filename)) {
    return NextResponse.json({ error: "Nombre de archivo inválido" }, { status: 400 });
  }

  const ext = filename.split(".").pop()!.toLowerCase();

  try {
    const buffer = await readFile(join(DOCS_DIR, filename));
    return new NextResponse(buffer, {
      headers: { "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream" },
    });
  } catch {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }
}
