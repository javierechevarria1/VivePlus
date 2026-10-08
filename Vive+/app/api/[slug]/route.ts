import { NextRequest, NextResponse } from "next/server";
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

const DEMO_PRODUCTS = [
  { id: 1, nombre: "Pastillero inteligente", descripcion: "Organiza tus medicinas con alertas diarias y recordatorios automáticos.", precio: "€29.82", productos_categoria_id: 1, categoria: "Salud", imagen: "/img/PastilleroInteligente.png", stock: 10, tamano_paquete: "S", specs: [{ label: "Compartimentos", value: "28 (4 por día)" }], destacados: ["Alarma programable", "Compatible con app móvil"] },
  { id: 2, nombre: "Pastillero", descripcion: "Organizador semanal con compartimentos para mañana, tarde y noche.", precio: "€24.00", productos_categoria_id: 1, categoria: "Salud", imagen: "/img/Pastillero.png", stock: 10, tamano_paquete: "S", specs: [{ label: "Compartimentos", value: "21 (3 por día × 7 días)" }], destacados: ["Letras grandes", "Fácil de abrir"] },
  { id: 3, nombre: "Botón SOS", descripcion: "Envía una alerta inmediata a tus contactos de emergencia con un solo toque.", precio: "€63.67", productos_categoria_id: 3, categoria: "Seguridad", imagen: "/img/BotonSOS.png", stock: 10, tamano_paquete: "S", specs: [{ label: "Conectividad", value: "4G LTE + WiFi" }, { label: "GPS", value: "Tiempo real" }], destacados: ["Llamada bidireccional", "Detector de caídas"] },
  { id: 4, nombre: "Temporizador", descripcion: "Recordatorios automáticos para no olvidar ninguna toma.", precio: "€24.00", productos_categoria_id: 2, categoria: "Tecnología", imagen: "/img/Temporizador.png", stock: 10, tamano_paquete: "S", specs: [{ label: "Alarmas", value: "Hasta 8 programables" }], destacados: ["Botones extragrandes", "Alarma con sonido"] },
  { id: 5, nombre: "Robot asistente", descripcion: "Compañero del hogar con recordatorios, entretenimiento y funciones de seguridad.", precio: "€399.00", productos_categoria_id: 2, categoria: "Tecnología", imagen: "/img/RobotAsistentee.png", stock: 5, tamano_paquete: "L", specs: [{ label: "Conectividad", value: "WiFi + Bluetooth" }], destacados: ["Videollamadas familiares", "Recordatorios de medicación"] },
  { id: 6, nombre: "Tablet senior", descripcion: "Pantalla grande, fuente ampliada e interfaz simplificada para uso diario.", precio: "€243.99", productos_categoria_id: 2, categoria: "Tecnología", imagen: "/img/Tablet Senior.png", stock: 8, tamano_paquete: "M", specs: [{ label: "Pantalla", value: "10.1 pulgadas" }], destacados: ["Fuente extragrande", "Interfaz simplificada"] },
  { id: 7, nombre: "Tablet Bleta", descripcion: "Pantalla de 10.1 pulgadas con interfaz simplificada y soporte remoto para familiares.", precio: "€299.99", productos_categoria_id: 2, categoria: "Tecnología", imagen: "/img/Tablet Senior.png", stock: 6, tamano_paquete: "M", specs: [{ label: "Pantalla", value: "10.1 pulgadas Full HD" }], destacados: ["Interfaz simplificada", "Soporte remoto para la familia"] },
  { id: 8, nombre: "Tablet Lenovo", descripcion: "Tablet Lenovo con pantalla amplia, lápiz táctil y funda protectora.", precio: "€299.99", productos_categoria_id: 2, categoria: "Tecnología", imagen: "/img/TabletSPC.png", stock: 7, tamano_paquete: "M", specs: [{ label: "Pantalla", value: "10.1 pulgadas" }], destacados: ["Pantalla de alta resolución", "Almacenamiento ampliable"] },
  { id: 9, nombre: "Tablet SPC", descripcion: "Tablet diseñada para facilitar el uso diario en personas mayores.", precio: "€299.99", productos_categoria_id: 2, categoria: "Tecnología", imagen: "/img/TabletSPC.png", stock: 9, tamano_paquete: "M", specs: [{ label: "Pantalla", value: "10.1 pulgadas IPS" }], destacados: ["Diseño sencillo", "Pantalla amplia"] },
  { id: 10, nombre: "Reloj GPS 4G", descripcion: "Monitoriza el ritmo cardíaco, el oxígeno en sangre y detecta caídas.", precio: "€99.07", productos_categoria_id: 2, categoria: "Tecnología", imagen: "/img/RelojGPS4G.png", stock: 12, tamano_paquete: "S", specs: [{ label: "Conectividad", value: "4G + GPS + WiFi" }], destacados: ["Detección de caídas", "Localización GPS"] },
  { id: 11, nombre: "Reloj Watch Seniors", descripcion: "Reloj de asistencia con GPS y monitorización de salud.", precio: "€107.00", productos_categoria_id: 2, categoria: "Tecnología", imagen: "/img/RelojWatchSeniors.png", stock: 10, tamano_paquete: "S", specs: [{ label: "Conectividad", value: "4G LTE + GPS" }], destacados: ["Llamada de emergencia", "Seguimiento GPS"] },
  { id: 12, nombre: "Reloj DescuentosMax", descripcion: "Reloj de asistencia con conectividad y sensores de salud.", precio: "€107.00", productos_categoria_id: 2, categoria: "Tecnología", imagen: "/img/RelojDescuentosMax.png", stock: 8, tamano_paquete: "S", specs: [{ label: "Conectividad", value: "4G + Bluetooth" }], destacados: ["Pantalla a color", "Batería de larga duración"] },
  { id: 13, nombre: "Reloj SAT25", descripcion: "Reloj GPS con funciones de asistencia y seguimiento de salud.", precio: "€109.99", productos_categoria_id: 2, categoria: "Tecnología", imagen: "/img/RelojSat25.png", stock: 6, tamano_paquete: "S", specs: [{ label: "Conectividad", value: "4G + GPS + WiFi" }], destacados: ["Localización GPS", "Medición de salud"] },
  { id: 14, nombre: "Reloj Tracmi", descripcion: "Reloj de asistencia con GPS dual y monitorización de salud.", precio: "€109.00", productos_categoria_id: 2, categoria: "Tecnología", imagen: "/img/RelojTracmi.png", stock: 7, tamano_paquete: "S", specs: [{ label: "Conectividad", value: "4G + GPS dual" }], destacados: ["Seguimiento GPS", "Sensores de salud"] },
];

const DEMO_SECOND_HAND = [
  { id: 101, id_vendedor: 1, nombre: "Andador plegable en buen estado", descripcion: "Andador ligero, con frenos y asiento. Recogida en Santander.", precio_final: "45.00", stock: 1, imagen: ["/img/marketplace.png"], estado: "disponible", tamano_paquete: "L", vendedor_nombre: "María", vendedor_puede_cobrar: false },
  { id: 102, id_vendedor: 2, nombre: "Lote de libros de memoria y pasatiempos", descripcion: "Lote de libros en muy buen estado, con ejercicios variados.", precio_final: "12.00", stock: 1, imagen: ["/img/actividades.jpg"], estado: "disponible", tamano_paquete: "S", vendedor_nombre: "José", vendedor_puede_cobrar: false },
];

const DEMO_ACTIVITIES = [
  { id: 1, nombre: "Taller de memoria y estimulación cognitiva", descripcion: "Ejercicios prácticos de memoria, atención y razonamiento para mantener el cerebro activo.", categoria: "Salud", fecha: "2027-05-05T10:00:00.000Z", lugar: "Centro Cívico Cañadío", plazas_max: 20, duracion_min: 90, url: "https://www.santander.es/areas-tematicas/mayores", url_lugar: "https://www.google.com/maps/search/?api=1&query=Centro+C%C3%ADvico+C%C3%B1ad%C3%ADo+Santander", imagen: "/img/foto_3.jpg", inscritos: 4 },
  { id: 2, nombre: "Yoga suave para mayores", descripcion: "Sesión adaptada para mejorar la flexibilidad, el equilibrio y reducir el estrés.", categoria: "Deporte", fecha: "2027-05-07T09:30:00.000Z", lugar: "Polideportivo Municipal de Santander", plazas_max: 15, duracion_min: 60, url: "https://www.santander.es/areas-tematicas/deportes", url_lugar: "https://www.google.com/maps/search/?api=1&query=Polideportivo+Municipal+Santander", imagen: "/img/comunidad.png", inscritos: 7 },
  { id: 3, nombre: "Paseo cultural por Santander", descripcion: "Paseo tranquilo por lugares emblemáticos de la ciudad acompañado por un guía local.", categoria: "Cultura", fecha: "2027-05-12T11:00:00.000Z", lugar: "Plaza del Ayuntamiento, Santander", plazas_max: 18, duracion_min: 120, url: "https://turismosantander.es/", url_lugar: "https://www.google.com/maps/search/?api=1&query=Ayuntamiento+Santander", imagen: "/img/Foto_2.jpg", inscritos: 6 },
];

const DEMO_TESTIMONIALS = [
  { id: 1, nombre: "Anónimo", rol: "Familiar", texto: "Encontramos actividades cerca de casa y mi madre ha vuelto a disfrutar de salir en compañía.", rating: 5, creado_en: "2026-06-12" },
  { id: 2, nombre: "Anónimo", rol: "Usuario", texto: "La comunidad me ha ayudado a conocer gente nueva y sentirme más acompañado.", rating: 5, creado_en: "2026-06-08" },
  { id: 3, nombre: "Anónimo", rol: "Cuidador", texto: "Una forma sencilla de conectar a las familias con profesionales y recursos de confianza.", rating: 5, creado_en: "2026-06-01" },
];

const DEMO_ORGANIZATIONS = [
  { id: 1, nombre: "Centro de Día La Encina", organizaciones_categoria_id: 1, tipo: "ong", descripcion: "Atención diurna, talleres y acompañamiento para personas mayores.", web: "https://www.santander.es/", email: "hola@laencina.local", telefono: "942 100 101", direccion: "Calle Castilla, 12", ciudad: "Santander", estado: "Cantabria", logo_url: "/img/organizaciones.png" },
  { id: 2, nombre: "Asociación Pasos Compartidos", organizaciones_categoria_id: 2, tipo: "ong", descripcion: "Actividades comunitarias, voluntariado y apoyo a las familias.", web: "https://www.santander.es/", email: "info@pasos.local", telefono: "942 100 202", direccion: "Calle Alta, 24", ciudad: "Santander", estado: "Cantabria", logo_url: "/img/organizaciones.png" },
  { id: 3, nombre: "Residencia Costa Verde", organizaciones_categoria_id: 3, tipo: "empresa", descripcion: "Entorno cercano con atención profesional y actividades diarias.", web: "https://www.santander.es/", email: "contacto@costaverde.local", telefono: "942 100 303", direccion: "Paseo del General Dávila, 60", ciudad: "Santander", estado: "Cantabria", logo_url: "/img/organizaciones.png" },
];

const DEMO_CAREGIVERS = [
  { id: 1, cuidador_usuario_id: 501, name: "Ana Martínez", specialty: "Enfermería geriátrica", tag: "Cuidados a domicilio", hours: "Mañanas y tardes", rating: 4.9, reviews: 18, tipo: "enfermero", photo: "/img/doctora-ana-v2.jpg", color: "#EC4899", verificado: true },
  { id: 2, cuidador_usuario_id: 502, name: "Carlos Ruiz", specialty: "Fisioterapia", tag: "Movilidad y rehabilitación", hours: "Horario flexible", rating: 4.8, reviews: 12, tipo: "fisioterapeuta", photo: "/img/doctor-carlos-v2.jpg", color: "#2563EB", verificado: true },
  { id: 3, cuidador_usuario_id: 503, name: "Laura Gómez", specialty: "Acompañamiento", tag: "Apoyo y bienestar", hours: "Mañanas", rating: 5, reviews: 9, tipo: "cuidador", photo: "/img/doctora-laura-v2.jpg", color: "#16A085", verificado: true },
];

const DEMO_ADS = [
  { id: 1, empresa: "VIVE+", imagen: "/img/cuidadores.png", url_destino: "/salud", ubicacion: "home", activo: true },
  { id: 2, empresa: "VIVE+", imagen: "/img/marketplace.png", url_destino: "/marketplace", ubicacion: "productos", activo: true },
  { id: 3, empresa: "VIVE+", imagen: "/img/organizaciones.png", url_destino: "/organizaciones", ubicacion: "organizaciones", activo: true },
  { id: 4, empresa: "VIVE+", imagen: "/img/cuidadores.png", url_destino: "/salud", ubicacion: "actividades", activo: true },
];

const DEMO_CATEGORIES: Record<string, unknown[]> = {
  actividades: ["Salud", "Deporte", "Ocio", "Cultura"].map((nombre, index) => ({ id: index + 1, nombre, activa: true, orden: index + 1 })),
  productos: ["Salud", "Tecnología", "Seguridad"].map((nombre, index) => ({ id: index + 1, nombre, color: "#2563EB", gradiente: "", icono: "Sparkles", activa: true, orden: index + 1 })),
  organizaciones: [{ id: 1, key: "ong", label: "ONG" }, { id: 2, key: "fundacion", label: "Fundación" }, { id: 3, key: "empresa", label: "Empresa" }].map((item, index) => ({ ...item, activa: true, orden: index + 1 })),
  salud: ["enfermero", "fisioterapeuta", "cuidador"].map((nombre, index) => ({ id: index + 1, nombre, color: "#EC4899", activa: true, orden: index + 1 })),
};

const DEMO_PLANS = [
  { id: 1, nombre: "Gratuito", precio: 0, intervalo: "mes", caracteristicas: ["Perfil básico", "Ver organizaciones"] },
  { id: 2, nombre: "Básico", precio: 4.99, intervalo: "mes", caracteristicas: ["Chat ilimitado", "Chat por cercanía", "Acceso a cuidadores"] },
  { id: 3, nombre: "Premium", precio: 9.99, intervalo: "mes", caracteristicas: ["Videollamadas", "Soporte prioritario", "Sin anuncios"] },
];

function handleLocalDemoApi(req: NextRequest, slug: string): NextResponse {
  const { searchParams } = req.nextUrl;
  if (req.method === "GET") {
    switch (slug) {
      case "marketplace": return NextResponse.json(DEMO_PRODUCTS.filter(product => product.categoria !== "Tecnología"));
      case "tecnologias": return NextResponse.json(DEMO_PRODUCTS.filter(product => product.categoria === "Tecnología"));
      case "segunda-mano": return NextResponse.json({ ok: true, data: DEMO_SECOND_HAND });
      case "recursos": {
        const requested = [...searchParams.getAll("categoria[]"), ...(searchParams.get("categoria") ? [searchParams.get("categoria")!] : [])];
        const activities = requested.length ? DEMO_ACTIVITIES.filter(item => requested.includes(item.categoria)) : DEMO_ACTIVITIES;
        return NextResponse.json({ actividades: activities, inscritas: [] });
      }
      case "organizaciones": return NextResponse.json({ organizaciones: DEMO_ORGANIZATIONS });
      case "salud": return NextResponse.json({ medicos: DEMO_CAREGIVERS });
      case "admin-organizaciones": return NextResponse.json({
        organizaciones: DEMO_ORGANIZATIONS.map(organizacion => ({
          ...organizacion,
          usuario_organizacion_id: null,
          servicios: [],
        })),
        demo: true,
      });
      case "admin-pedidos": return NextResponse.json({ ok: true, data: [], demo: true });
      case "admin-cuidadores": return NextResponse.json({ cuidadores: [], demo: true });
      case "devoluciones": return NextResponse.json({ ok: true, data: [], demo: true });
      case "testimonios": return NextResponse.json({ testimonios: DEMO_TESTIMONIALS });
      case "anuncios": {
        if (searchParams.has("id")) return NextResponse.json({ ok: true });
        const ubicacion = searchParams.get("ubicacion");
        const ads = ubicacion ? DEMO_ADS.filter(ad => ad.ubicacion === ubicacion) : DEMO_ADS;
        return NextResponse.json(searchParams.get("all") === "true" ? ads : ads[0] ?? null);
      }
      case "categorias": {
        const categories = DEMO_CATEGORIES[searchParams.get("tipo") ?? ""];
        return categories
          ? NextResponse.json({ categorias: categories })
          : NextResponse.json({ error: "tipo inválido" }, { status: 400 });
      }
      case "planes": return NextResponse.json(DEMO_PLANS);
      case "suscripciones": return NextResponse.json({ activa: false, plan: null });
      case "solicitudes": return NextResponse.json({ recibidas: [], amigos: [], enviadas: [] });
      case "verify-session": return NextResponse.json({ user: null });
      case "ordenes": return NextResponse.json(searchParams.has("id")
        ? { ok: true, data: { items: [], direccion_envio: null, precio_total: 0, envio_total: 0, gestion_total: 0, creado_en: null, dias_devolucion: null, devolucion_abierta: false, devolucion: null } }
        : { ok: true, data: [] });
      case "ping": return NextResponse.json({ ok: true, demo: true });
      case "direccion-vendedor": return NextResponse.json({ ok: true, data: {}, completa: false, productos_sin_tamano: [] });
      case "connect-onboard": return NextResponse.json({ connected: false, demo: true });
      default: return NextResponse.json({ error: "Esta API no está disponible en la demo local." }, { status: 501 });
    }
  }

  if (slug === "testimonios" && req.method === "POST") return NextResponse.json({ ok: true, demo: true }, { status: 201 });
  if (["ping", "logout"].includes(slug) && req.method === "POST") return NextResponse.json({ ok: true, demo: true });
  return NextResponse.json({ error: "Esta operación no está disponible en la demo local." }, { status: 501 });
}

async function handle(req: NextRequest, slug: string, method: string) {
  if (process.env.LOCAL_DEMO === "true") return handleLocalDemoApi(req, slug);

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
