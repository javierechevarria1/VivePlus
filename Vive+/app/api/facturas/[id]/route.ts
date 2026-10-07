import { NextRequest, NextResponse } from "next/server";
import { getInvoiceFromDatabase, listInvoicesFromDatabase } from "@/backend/services/invoice";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.rol !== "admin") {
      return NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}

/**
 * GET /api/facturas/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const { id } = await params;

    if (id === "list") {
      
      const limit = req.nextUrl.searchParams.get("limit") || "100";
      const offset = req.nextUrl.searchParams.get("offset") || "0";
      
      const invoices = await listInvoicesFromDatabase(parseInt(limit), parseInt(offset));
      return NextResponse.json({ 
        total: invoices.length,
        invoices 
      });
    }

    
    const invoice = await getInvoiceFromDatabase(id);

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error obteniendo factura:", error);
    return NextResponse.json(
      { error: "Error al obtener la factura" },
      { status: 500 }
    );
  }
}
