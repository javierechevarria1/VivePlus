import { NextRequest, NextResponse } from "next/server";
import * as controller from "@/backend/controllers/chat-audio";

function demoUnavailable() {
  return NextResponse.json(
    { error: "El chat de audio requiere el servicio en tiempo real y no está disponible en la demo local." },
    { status: 501 },
  );
}

export async function GET(req: NextRequest) {
  if (process.env.LOCAL_DEMO === "true") return demoUnavailable();
  return controller.GET(req);
}

export async function POST(req: NextRequest) {
  if (process.env.LOCAL_DEMO === "true") return demoUnavailable();
  return controller.POST(req);
}
