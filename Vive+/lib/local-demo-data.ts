const productos = [
  {
    id: 1,
    nombre: "Reloj inteligente de asistencia",
    descripcion: "Reloj fácil de usar con botón SOS, llamadas y detección de caídas.",
    precio: "€89.00",
    productos_categoria_id: 1,
    categoria: "Tecnología",
    imagen: "/img/RelojGPS4G.png",
    stock: 12,
    tamano_paquete: "S",
    specs: [{ label: "Conectividad", value: "4G y GPS" }],
    destacados: ["Botón de emergencia", "Batería de larga duración"],
  },
  {
    id: 2,
    nombre: "Altavoz inteligente para el hogar",
    descripcion: "Control por voz para música, recordatorios y llamadas familiares.",
    precio: "€59.00",
    productos_categoria_id: 1,
    categoria: "Tecnología",
    imagen: "/img/RobotAsistentee.png",
    stock: 8,
    tamano_paquete: "M",
    specs: [{ label: "Asistente", value: "Control por voz" }],
    destacados: ["Configuración sencilla", "Sonido nítido"],
  },
  {
    id: 3,
    nombre: "Pack de bienestar y cuidado",
    descripcion: "Selección de productos para acompañar las rutinas de autocuidado.",
    precio: "€32.50",
    productos_categoria_id: 2,
    categoria: "Bienestar",
    imagen: "/img/Pastillero.png",
    stock: 15,
    tamano_paquete: "S",
    specs: [],
    destacados: ["Selección práctica", "Ideal para regalar"],
  },
];

const segundaMano = [
  {
    id: 101,
    id_vendedor: 1,
    nombre: "Andador plegable en buen estado",
    descripcion: "Andador ligero, con frenos y asiento. Recogida en Santander.",
    precio_final: "45.00",
    stock: 1,
    imagen: ["/img/marketplace.png"],
    estado: "disponible",
    tamano_paquete: "L",
    vendedor_nombre: "María",
    vendedor_puede_cobrar: false,
  },
  {
    id: 102,
    id_vendedor: 2,
    nombre: "Lote de libros de memoria y pasatiempos",
    descripcion: "Lote de libros en muy buen estado, con ejercicios variados.",
    precio_final: "12.00",
    stock: 1,
    imagen: ["/img/actividades.jpg"],
    estado: "disponible",
    tamano_paquete: "S",
    vendedor_nombre: "José",
    vendedor_puede_cobrar: false,
  },
];

const actividades = [
  {
    id: 1,
    nombre: "Taller de memoria y estimulación cognitiva",
    descripcion: "Ejercicios prácticos de memoria, atención y razonamiento para mantener el cerebro activo.",
    categoria: "Salud",
    fecha: "2027-05-05T10:00:00.000Z",
    lugar: "Centro Cívico Cañadío",
    plazas_max: 20,
    duracion_min: 90,
    url: "https://www.santander.es/areas-tematicas/mayores",
    url_lugar: "https://www.google.com/maps/search/?api=1&query=Centro+C%C3%ADvico+Cañad%C3%ADo+Santander",
    imagen: "/img/actividades.jpg",
    inscritos: 4,
  },
  {
    id: 2,
    nombre: "Yoga suave para mayores",
    descripcion: "Sesión adaptada para mejorar la flexibilidad, el equilibrio y reducir el estrés.",
    categoria: "Deporte",
    fecha: "2027-05-07T09:30:00.000Z",
    lugar: "Polideportivo Municipal de Santander",
    plazas_max: 15,
    duracion_min: 60,
    url: "https://www.santander.es/areas-tematicas/deportes",
    url_lugar: "https://www.google.com/maps/search/?api=1&query=Polideportivo+Municipal+Santander",
    imagen: "/img/actividades.jpg",
    inscritos: 7,
  },
  {
    id: 3,
    nombre: "Paseo cultural por Santander",
    descripcion: "Paseo tranquilo por lugares emblemáticos de la ciudad acompañado por un guía local.",
    categoria: "Cultura",
    fecha: "2027-05-12T11:00:00.000Z",
    lugar: "Plaza del Ayuntamiento, Santander",
    plazas_max: 18,
    duracion_min: 120,
    url: "https://turismosantander.es/",
    url_lugar: "https://www.google.com/maps/search/?api=1&query=Ayuntamiento+Santander",
    imagen: "/img/actividades.jpg",
    inscritos: 6,
  },
];

const testimonios = [
  { id: 1, nombre: "Anónimo", rol: "Familiar", texto: "Encontramos actividades cerca de casa y mi madre ha vuelto a disfrutar de salir en compañía.", rating: 5, creado_en: "2026-06-12" },
  { id: 2, nombre: "Anónimo", rol: "Usuario", texto: "La comunidad me ha ayudado a conocer gente nueva y sentirme más acompañado.", rating: 5, creado_en: "2026-06-08" },
  { id: 3, nombre: "Anónimo", rol: "Cuidador", texto: "Una forma sencilla de conectar a las familias con profesionales y recursos de confianza.", rating: 5, creado_en: "2026-06-01" },
];

const organizaciones = [
  { id: 1, nombre: "Centro de Día La Encina", organizaciones_categoria_id: 1, tipo: "centro-dia", descripcion: "Atención diurna, talleres y acompañamiento para personas mayores.", web: "https://www.santander.es/", email: "hola@laencina.local", telefono: "942 100 101", direccion: "Calle Castilla, 12", ciudad: "Santander", estado: "Cantabria", logo_url: "/img/organizaciones.png" },
  { id: 2, nombre: "Asociación Pasos Compartidos", organizaciones_categoria_id: 2, tipo: "asociacion", descripcion: "Actividades comunitarias, voluntariado y apoyo a las familias.", web: "https://www.santander.es/", email: "info@pasos.local", telefono: "942 100 202", direccion: "Calle Alta, 24", ciudad: "Santander", estado: "Cantabria", logo_url: "/img/organizaciones.png" },
  { id: 3, nombre: "Residencia Costa Verde", organizaciones_categoria_id: 3, tipo: "residencia", descripcion: "Entorno cercano con atención profesional y actividades diarias.", web: "https://www.santander.es/", email: "contacto@costaverde.local", telefono: "942 100 303", direccion: "Paseo del General Dávila, 60", ciudad: "Santander", estado: "Cantabria", logo_url: "/img/organizaciones.png" },
];

const cuidadores = [
  { id: 1, cuidador_usuario_id: 501, name: "Ana Martínez", specialty: "Enfermería geriátrica", tag: "Cuidados a domicilio", hours: "Mañanas y tardes", rating: 4.9, reviews: 18, tipo: "Enfermería", photo: "/img/cuidadores.png", color: "#EC4899", verificado: true },
  { id: 2, cuidador_usuario_id: 502, name: "Carlos Ruiz", specialty: "Fisioterapia", tag: "Movilidad y rehabilitación", hours: "Horario flexible", rating: 4.8, reviews: 12, tipo: "Fisioterapia", photo: "/img/cuidadores.png", color: "#2563EB", verificado: true },
  { id: 3, cuidador_usuario_id: 503, name: "Laura Gómez", specialty: "Acompañamiento", tag: "Apoyo y bienestar", hours: "Mañanas", rating: 5, reviews: 9, tipo: "Acompañamiento", photo: "/img/cuidadores.png", color: "#16A085", verificado: true },
];

const anuncios = [
  { id: 1, empresa: "VIVE+", imagen: "/img/actividades.jpg", url_destino: "/recursos", ubicacion: "home", activo: true },
  { id: 2, empresa: "VIVE+", imagen: "/img/marketplace.png", url_destino: "/marketplace", ubicacion: "productos", activo: true },
  { id: 3, empresa: "VIVE+", imagen: "/img/organizaciones.png", url_destino: "/organizaciones", ubicacion: "organizaciones", activo: true },
  { id: 4, empresa: "VIVE+", imagen: "/img/actividades.jpg", url_destino: "/recursos", ubicacion: "actividades", activo: true },
];

const categorySets: Record<string, unknown[]> = {
  actividades: ["Salud", "Deporte", "Ocio", "Cultura"].map((nombre, index) => ({ id: index + 1, nombre, activa: true, orden: index + 1 })),
  productos: ["Tecnología", "Bienestar", "Hogar"].map((nombre, index) => ({ id: index + 1, nombre, color: "#2563EB", icono: "Sparkles", activa: true, orden: index + 1 })),
  organizaciones: ["Centro de día", "Asociación", "Residencia"].map((label, index) => ({ id: index + 1, label, key: label.toLowerCase().replaceAll(" ", "-"), activa: true, orden: index + 1 })),
  salud: ["Enfermería", "Fisioterapia", "Acompañamiento"].map((nombre, index) => ({ id: index + 1, nombre, color: "#EC4899", activa: true, orden: index + 1 })),
};

const planes = [
  { id: 1, nombre: "Gratuito", precio: 0, intervalo: "mes", caracteristicas: ["Perfil básico", "Ver organizaciones"] },
  { id: 2, nombre: "Básico", precio: 4.99, intervalo: "mes", caracteristicas: ["Chat ilimitado", "Chat por cercanía", "Acceso a cuidadores"] },
  { id: 3, nombre: "Premium", precio: 9.99, intervalo: "mes", caracteristicas: ["Videollamadas", "Soporte prioritario", "Sin anuncios"] },
];

export function isLocalDemoEnabled(): boolean {
  return process.env.LOCAL_DEMO === "true";
}

export function handleLocalDemoApi(req: Request, slug: string): Response | null {
  if (!isLocalDemoEnabled()) return null;

  const method = req.method.toUpperCase();
  const { searchParams } = new URL(req.url);

  if (method === "GET") {
    switch (slug) {
      case "marketplace":
        return Response.json(productos.filter(producto => producto.categoria !== "Tecnología"));
      case "tecnologias":
        return Response.json(productos.filter(producto => producto.categoria === "Tecnología"));
      case "segunda-mano":
        return Response.json({ ok: true, data: segundaMano });
      case "recursos": {
        const categories = searchParams.getAll("categoria[]");
        const category = searchParams.get("categoria");
        const selected = categories.length ? categories : category ? [category] : [];
        const result = selected.length ? actividades.filter(item => selected.includes(item.categoria)) : actividades;
        return Response.json({ actividades: result, inscritas: [] });
      }
      case "organizaciones":
        return Response.json({ organizaciones });
      case "salud":
        return Response.json({ medicos: cuidadores });
      case "testimonios":
        return Response.json({ testimonios });
      case "anuncios": {
        if (searchParams.has("id")) return Response.json({ ok: true });
        const ubicacion = searchParams.get("ubicacion");
        const matches = ubicacion ? anuncios.filter(ad => ad.ubicacion === ubicacion) : anuncios;
        return Response.json(searchParams.get("all") === "true" ? matches : matches[0] ?? null);
      }
      case "categorias": {
        const tipo = searchParams.get("tipo") ?? "";
        return categorySets[tipo]
          ? Response.json({ categorias: categorySets[tipo] })
          : Response.json({ error: "tipo inválido" }, { status: 400 });
      }
      case "planes":
        return Response.json(planes);
      case "suscripciones":
        return Response.json({ activa: false, plan: null });
      case "solicitudes":
        return Response.json({ recibidas: [], amigos: [], enviadas: [] });
      case "verify-session":
        return Response.json({ user: null });
      case "ordenes":
        return Response.json(searchParams.has("id")
          ? { ok: true, data: { items: [], direccion_envio: null, precio_total: 0, envio_total: 0, gestion_total: 0, creado_en: null, dias_devolucion: null, devolucion_abierta: false, devolucion: null } }
          : { ok: true, data: [] });
      case "ping":
        return Response.json({ ok: true, demo: true });
      case "direccion-vendedor":
        return Response.json({
          ok: true,
          data: {},
          completa: false,
          productos_sin_tamano: [],
        });
      case "connect-onboard":
        return Response.json({ connected: false, demo: true });
      default:
        return Response.json({ error: "Esta API no está disponible en la demo local." }, { status: 501 });
    }
  }

  if (slug === "testimonios" && method === "POST") {
    return Response.json({ ok: true, demo: true }, { status: 201 });
  }
  if (slug === "ping" && method === "POST") {
    return Response.json({ ok: true, demo: true });
  }
  if (slug === "logout" && method === "POST") {
    return Response.json({ ok: true, demo: true });
  }
  return Response.json({ error: "Esta API no está disponible en la demo local." }, { status: 501 });
}
