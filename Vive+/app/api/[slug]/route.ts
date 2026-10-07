import { NextRequest, NextResponse } from "next/server";
import { handleLocalDemoApi } from "@/lib/local-demo-data";
import * as contactoModule from "../../../backend/controllers/contacto";
import * as ubicacionModule from "../../../backend/controllers/ubicacion";
import * as forgotPasswordModule from "../../../backend/controllers/forgot-password";
import * as resetPasswordModule from "../../../backend/controllers/reset-password";
import * as valoracionesMedicoModule from "../../../backend/controllers/valoraciones-medico";
import * as adminCodigosModule from "../../../backend/controllers/admin-codigos";
import * as buscarUsuariosModule from "../../../backend/controllers/buscar-usuarios";
import * as misUsuariosModule from "../../../backend/controllers/mis-usuarios";
import * as rotarCodigosModule from "../../../backend/controllers/rotar-codigos";
import * as solicitudesModule from "../../../backend/controllers/solicitudes";
import * as validarCodigoMedicoModule from "../../../backend/controllers/validar-codigo-medico";
import * as pingModule from "../../../backend/controllers/ping";
import * as adminCategoriasModule from "../../../backend/controllers/admin-categorias";
import * as categoriasModule from "../../../backend/controllers/categorias";
import * as usuariosModule from "../../../backend/controllers/usuarios";
import * as testimoniosModule from "../../../backend/controllers/testimonios";
import * as adminActividadesModule from "../../../backend/controllers/admin-actividades";
import * as adminAnunciosModule from "../../../backend/controllers/admin-anuncios";
import * as saludModule from "../../../backend/controllers/salud";
import * as chatAudioModule from "../../../backend/controllers/chat-audio";
import * as chatHistoryModule from "../../../backend/controllers/chat-history";
import * as cercaniaHistoryModule from "../../../backend/controllers/cercania-history";
import * as cercaniaSendModule from "../../../backend/controllers/cercania-send";
import * as adminSaludModule from "../../../backend/controllers/admin-salud";
import * as anunciosModule from "../../../backend/controllers/anuncios";
import * as carritoModule from "../../../backend/controllers/carrito";
import * as chatSendModule from "../../../backend/controllers/chat-send";
import * as pagosPlanesModule from "../../../backend/controllers/pagos-planes";
import * as perfilModule from "../../../backend/controllers/perfil";
import * as registerMedicoPendingModule from "../../../backend/controllers/register-medico-pending";
import * as comprarModule from "../../../backend/controllers/comprar";
import * as planesModule from "../../../backend/controllers/planes";
import * as segundaManoModule from "../../../backend/controllers/segunda-mano";
import * as ventasSegundaManoModule from "../../../backend/controllers/ventas-segunda-mano";
import * as liberarVentasModule from "../../../backend/controllers/liberar-ventas";
import * as direccionVendedorModule from "../../../backend/controllers/direccion-vendedor";
import * as etiquetaEnvioModule from "../../../backend/controllers/etiqueta-envio";
import * as adminPedidosModule from "../../../backend/controllers/admin-pedidos";
import * as devolucionesModule from "../../../backend/controllers/devoluciones";
import * as stripeSubscriptionModule from "../../../backend/controllers/stripe-subscription";
import * as stripeOrgSubscriptionModule from "../../../backend/controllers/stripe-org-subscription";
import * as confirmPlanModule from "../../../backend/controllers/confirm-plan";
import * as confirmOrgPlanModule from "../../../backend/controllers/confirm-org-plan";
import * as confirmMedicoPlanModule from "../../../backend/controllers/confirm-medico-plan";
import * as verifySessionModule from "../../../backend/controllers/verify-session";
import * as loginModule from "../../../backend/controllers/login";
import * as logoutModule from "../../../backend/controllers/logout";
import * as pusherAuthModule from "../../../backend/controllers/pusher-auth";
import * as organizacionesModule from "../../../backend/controllers/organizaciones";
import * as stripeCheckoutModule from "../../../backend/controllers/stripe-checkout";
import * as suscripcionesModule from "../../../backend/controllers/suscripciones";
import * as marketplaceModule from "../../../backend/controllers/marketplace";
import * as tecnologiasModule from "../../../backend/controllers/tecnologias";
import * as recursosModule from "../../../backend/controllers/recursos";
import * as stripeSuccessModule from "../../../backend/controllers/stripe-success";
import * as ordenesModule from "../../../backend/controllers/ordenes";
import * as adminOrganizacionesModule from "../../../backend/controllers/admin-organizaciones";
import * as registerModule from "../../../backend/controllers/register";
import * as stripeSyncMarketplaceModule from "../../../backend/controllers/stripe-sync-marketplace";
import * as uploadImagenModule from "../../../backend/controllers/upload-imagen";
import * as connectOnboardModule from "../../../backend/controllers/connect-onboard";
import * as uploadDocumentoModule from "../../../backend/controllers/upload-documento";
import * as docsCuidadorModule from "../../../backend/controllers/docs-cuidador";
import * as adminCuidadoresModule from "../../../backend/controllers/admin-cuidadores";
import * as registerMedicoDirectoModule from "../../../backend/controllers/register-medico-directo";
import * as iniciarPagoMedicoModule from "../../../backend/controllers/iniciar-pago-medico";
import * as confirmarPagoMedicoModule from "../../../backend/controllers/confirmar-pago-medico";
import * as cotizadorModule from "../../../backend/controllers/cotizador";
import * as onboardingModule from "../../../backend/controllers/onboarding";
import * as facturaPedidoModule from "../../../backend/controllers/factura-pedido";

const controllerMap: Record<string, Record<string, unknown>> = {
  "contacto": contactoModule,
  "ubicacion": ubicacionModule,
  "forgot-password": forgotPasswordModule,
  "reset-password": resetPasswordModule,
  "valoraciones-medico": valoracionesMedicoModule,
  "admin-codigos": adminCodigosModule,
  "buscar-usuarios": buscarUsuariosModule,
  "mis-usuarios": misUsuariosModule,
  "rotar-codigos": rotarCodigosModule,
  "solicitudes": solicitudesModule,
  "validar-codigo-medico": validarCodigoMedicoModule,
  "ping": pingModule,
  "admin-categorias": adminCategoriasModule,
  "categorias": categoriasModule,
  "usuarios": usuariosModule,
  "testimonios": testimoniosModule,
  "admin-actividades": adminActividadesModule,
  "admin-anuncios": adminAnunciosModule,
  "salud": saludModule,
  "chat-audio": chatAudioModule,
  "chat-history": chatHistoryModule,
  "cercania-history": cercaniaHistoryModule,
  "cercania-send": cercaniaSendModule,
  "admin-salud": adminSaludModule,
  "anuncios": anunciosModule,
  "carrito": carritoModule,
  "chat-send": chatSendModule,
  "pagos-planes": pagosPlanesModule,
  "perfil": perfilModule,
  "register-medico-pending": registerMedicoPendingModule,
  "comprar": comprarModule,
  "planes": planesModule,
  "segunda-mano": segundaManoModule,
  "ventas-segunda-mano": ventasSegundaManoModule,
  "liberar-ventas": liberarVentasModule,
  "direccion-vendedor": direccionVendedorModule,
  "etiqueta-envio": etiquetaEnvioModule,
  "admin-pedidos": adminPedidosModule,
  "devoluciones": devolucionesModule,
  "stripe-subscription": stripeSubscriptionModule,
  "stripe-org-subscription": stripeOrgSubscriptionModule,
  "confirm-plan": confirmPlanModule,
  "confirm-org-plan": confirmOrgPlanModule,
  "confirm-medico-plan": confirmMedicoPlanModule,
  "verify-session": verifySessionModule,
  "login": loginModule,
  "logout": logoutModule,
  "pusher-auth": pusherAuthModule,
  "organizaciones": organizacionesModule,
  "stripe-checkout": stripeCheckoutModule,
  "suscripciones": suscripcionesModule,
  "marketplace": marketplaceModule,
  "tecnologias": tecnologiasModule,
  "recursos": recursosModule,
  "stripe-success": stripeSuccessModule,
  "ordenes": ordenesModule,
  "admin-organizaciones": adminOrganizacionesModule,
  "register": registerModule,
  "stripe-sync-marketplace": stripeSyncMarketplaceModule,
  "upload-imagen": uploadImagenModule,
  "connect-onboard": connectOnboardModule,
  "upload-documento": uploadDocumentoModule,
  "docs-cuidador": docsCuidadorModule,
  "admin-cuidadores": adminCuidadoresModule,
  "register-medico-directo": registerMedicoDirectoModule,
  "iniciar-pago-medico": iniciarPagoMedicoModule,
  "confirmar-pago-medico": confirmarPagoMedicoModule,
  "cotizador": cotizadorModule,
  "onboarding": onboardingModule,
  "factura-pedido": facturaPedidoModule,
};

async function handle(req: NextRequest, slug: string, method: string) {
  const demoResponse = handleLocalDemoApi(req, slug);
  if (demoResponse) return demoResponse;

  const apiModule = controllerMap[slug];
  if (!apiModule) {
    console.warn(`[API Router] Ruta no encontrada: /api/${slug}`);
    return NextResponse.json({ error: `Ruta /api/${slug} no encontrada` }, { status: 404 });
  }

  try {
    const fn = apiModule[method];
    if (typeof fn === "function") {
      return await (fn as (r: NextRequest) => Promise<NextResponse>)(req);
    }
    return NextResponse.json(
      { error: `Método ${method} no implementado en /api/${slug}` },
      { status: 405 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API Router] Error ejecutando /api/${slug} (${method}):`, error);
    return NextResponse.json(
      {
        error: `Error interno en /api/${slug}`,
        ...(process.env.NODE_ENV !== "production" ? { detail: message } : {}),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return handle(req, slug, "GET");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return handle(req, slug, "POST");
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return handle(req, slug, "PUT");
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return handle(req, slug, "DELETE");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return handle(req, slug, "PATCH");
}
