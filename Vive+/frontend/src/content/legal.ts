// Fuente única de los textos legales.
//
// Antes vivían dentro de `auth-gate.tsx` y solo se podían leer abriendo el
// modal del registro: quien no se registraba no tenía forma de verlos, y el
// pie enlazaba a `/cookies`, que no existía. Ahora cada documento tiene su
// página y el modal del registro lee de aquí, para que no puedan divergir.
//
// ⚠️ NO SON TEXTOS REVISADOS POR UN ABOGADO. Están escritos siguiendo lo que
// exigen la LSSI, el RGPD y el texto refundido de la Ley de Consumidores, y
// describen lo que el sistema hace de verdad, pero antes de abrir al público
// tienen que pasar por quien lleve la parte jurídica. Los datos del titular
// están sin rellenar a propósito: inventarlos sería peor que dejarlos vacíos.

// Datos identificativos del titular. RELLENAR antes de publicar: sin ellos el
// aviso legal no cumple el artículo 10 de la LSSI.
export const TITULAR = {
  nombre: "[NOMBRE Y APELLIDOS O RAZÓN SOCIAL]",
  nif: "[NIF / CIF]",
  domicilio: "[DIRECCIÓN COMPLETA]",
  email: "info@relatie65.es",
  // El aviso legal antiguo decía «Juzgados de Pamplona» mientras el resto de
  // la web dice que la plataforma es de Santander. Hay que decidir cuál es.
  jurisdiccion: "[CIUDAD DE LOS JUZGADOS COMPETENTES]",
};

export const MARCA = "Vive+";

// Los plazos que se cuentan en los textos salen de aquí para que digan lo
// mismo que el código. Si cambian en `tarifas-segunda-mano.ts` o en
// `reembolso.ts`, hay que cambiarlos también aquí.
export const DIAS_DESISTIMIENTO = 14;
export const DIAS_ENVIO_VUELTA = 14;

// Lo que cuesta el viaje de vuelta y se descuenta del reembolso cuando la
// devolución es por cambio de opinión. Tiene que coincidir con
// PORTE_DEVOLUCION en `tarifas-segunda-mano.ts`, y avisarlo aquí y en el
// carrito es lo que hace que se pueda cobrar.
export const PORTE_VUELTA_DESDE = "4,50";
export const PORTE_VUELTA_HASTA = "7";

export type Bloque =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "lista"; puntos: string[] }
  | { tipo: "pasos"; puntos: string[] }
  | { tipo: "destacado"; texto: string };

export type Seccion = { titulo: string; bloques: Bloque[] };

export type Documento = {
  slug: string;
  titulo: string;
  // Una línea que diga de qué va, para la cabecera de la página.
  resumen: string;
  actualizado: string;
  secciones: Seccion[];
};

const ACTUALIZADO = "31 de agosto de 2026";

const avisoLegal: Documento = {
  slug: "aviso-legal",
  titulo: "Aviso legal",
  resumen: `Quién está detrás de ${MARCA}, qué puedes hacer con lo que publicamos y qué ley se aplica.`,
  actualizado: ACTUALIZADO,
  secciones: [
    {
      titulo: "Quiénes somos",
      bloques: [
        { tipo: "parrafo", texto: `Este sitio web pertenece a ${TITULAR.nombre}, con NIF ${TITULAR.nif} y domicilio en ${TITULAR.domicilio}. Puedes escribirnos a ${TITULAR.email}.` },
        { tipo: "parrafo", texto: `${MARCA} es una plataforma de acompañamiento pensada para personas mayores de 55 años, abierta a cualquiera que quiera participar. Ofrece chat y comunidad, información de salud, actividades, una tienda propia de productos y un espacio de compraventa entre particulares.` },
      ],
    },
    {
      titulo: "Quién vende cada cosa",
      bloques: [
        { tipo: "parrafo", texto: "En esta web conviven dos cosas distintas, y conviene no confundirlas porque tus derechos cambian:" },
        { tipo: "lista", puntos: [
          `**La tienda.** Los productos los vendemos nosotros. Eres un consumidor comprando a una empresa, con todo lo que eso te da: ${DIAS_DESISTIMIENTO} días para devolver sin dar motivo y tres años de garantía.`,
          "**Segunda mano.** El producto lo vende otro usuario particular. Nosotros ponemos el sitio, cobramos, retenemos el dinero hasta que recibes el paquete y mediamos si algo va mal, pero no somos el vendedor y no hay derecho de desistimiento entre particulares.",
        ] },
      ],
    },
    {
      titulo: "Contenidos y propiedad intelectual",
      bloques: [
        { tipo: "parrafo", texto: `Los textos, imágenes, diseño y código de ${MARCA} están protegidos. Puedes usarlos para lo que la web sirve, no reproducirlos ni explotarlos por tu cuenta sin permiso.` },
        { tipo: "parrafo", texto: "Lo que publican los usuarios —mensajes, anuncios, fotos de productos— es suyo. Al publicarlo nos autorizan a mostrarlo dentro de la plataforma." },
      ],
    },
    {
      titulo: "Nuestra responsabilidad",
      bloques: [
        { tipo: "parrafo", texto: "Actuamos como intermediarios respecto a lo que publican los usuarios: no revisamos cada mensaje antes de que se publique, pero sí retiramos lo que nos reportan cuando corresponde, normalmente en menos de 24 horas." },
        { tipo: "parrafo", texto: "Eso no nos quita responsabilidad sobre lo que vendemos nosotros en la tienda, que responde como cualquier compra a una empresa." },
        { tipo: "parrafo", texto: `Si ves algo que no debería estar, escríbenos a ${TITULAR.email} indicando dónde está y qué pasa.` },
      ],
    },
    {
      titulo: "Ley aplicable",
      bloques: [
        { tipo: "parrafo", texto: `Se aplica la legislación española. Para cualquier conflicto, los juzgados competentes son los de ${TITULAR.jurisdiccion}, sin perjuicio de que, como consumidor, puedas acudir a los de tu propio domicilio.` },
      ],
    },
  ],
};

const privacidad: Documento = {
  slug: "privacidad",
  titulo: "Política de privacidad",
  resumen: "Qué datos tuyos guardamos, para qué, con quién se comparten y cómo pedir que los borremos.",
  actualizado: ACTUALIZADO,
  secciones: [
    {
      titulo: "Responsable del tratamiento",
      bloques: [
        { tipo: "parrafo", texto: `${TITULAR.nombre}, NIF ${TITULAR.nif}, con domicilio en ${TITULAR.domicilio}. Para cualquier cosa relacionada con tus datos: ${TITULAR.email}.` },
      ],
    },
    {
      titulo: "Qué datos recogemos",
      bloques: [
        { tipo: "lista", puntos: [
          "**Al registrarte:** nombre o apodo, correo electrónico y contraseña, que se guarda cifrada y nunca en claro.",
          "**Al usar la plataforma:** los mensajes que escribes en el chat y la comunidad, con su fecha y hora, y tu ubicación aproximada si activas el chat por cercanía.",
          "**Al comprar:** nombre, dirección de envío, teléfono y correo. Los datos de tu tarjeta **no pasan por nuestros servidores**: los introduces directamente en la pasarela de pago.",
          "**Al vender en segunda mano:** tu dirección de recogida y tus datos bancarios de cobro, que gestiona la pasarela de pago.",
          "**Técnicos:** dirección IP y cookies necesarias para mantener tu sesión abierta.",
        ] },
      ],
    },
    {
      titulo: "Para qué los usamos",
      bloques: [
        { tipo: "lista", puntos: [
          "Darte el servicio: tu cuenta, tus conversaciones, tus compras y tus ventas.",
          "Cobrar, enviar los pedidos y gestionar devoluciones e incidencias.",
          "Mantener la plataforma segura y moderar los contenidos que se reportan.",
          "Cumplir nuestras obligaciones legales, sobre todo las fiscales y contables.",
        ] },
        { tipo: "parrafo", texto: "La base legal es tu consentimiento al registrarte, la ejecución del contrato cuando compras o vendes, nuestro interés legítimo en mantener el servicio seguro, y la obligación legal en lo que toca a facturación." },
      ],
    },
    {
      titulo: "Con quién los compartimos",
      bloques: [
        { tipo: "parrafo", texto: "No vendemos tus datos a nadie ni los cedemos con fines comerciales. Los compartimos solo con las empresas que hacen falta para que el servicio funcione, y solo con lo imprescindible:" },
        { tipo: "lista", puntos: [
          "**Stripe**, la pasarela de pago, para cobrar, emitir tu factura, pagar a los vendedores particulares y hacer los reembolsos.",
          "**Sendcloud** y el transportista que lleve tu paquete, a quienes damos tu nombre, dirección, teléfono y correo para poder entregártelo y para la etiqueta de una devolución.",
          "**Nuestro proveedor de correo electrónico**, para enviarte las confirmaciones y avisos.",
          "**Nuestro proveedor de alojamiento**, donde vive la base de datos.",
        ] },
        { tipo: "parrafo", texto: "En una compra de segunda mano, tu nombre y dirección de entrega se le muestran al vendedor particular, porque tiene que enviarte el paquete. Solo eso, y solo mientras la venta esté en curso." },
      ],
    },
    {
      titulo: "Cuánto tiempo los guardamos",
      bloques: [
        { tipo: "lista", puntos: [
          "Mientras tengas la cuenta activa.",
          "Si dejas de entrar durante dos años, borramos la cuenta y sus datos.",
          "Los datos de facturación se conservan el tiempo que obliga la ley fiscal, aunque cierres la cuenta.",
        ] },
      ],
    },
    {
      titulo: "Tus derechos",
      bloques: [
        { tipo: "parrafo", texto: `Puedes pedirnos en cualquier momento acceder a tus datos, corregirlos, borrarlos, limitar su uso, oponerte a que los usemos o llevártelos a otro sitio. Escríbenos a ${TITULAR.email} desde el correo de tu cuenta y te respondemos en un mes como máximo.` },
        { tipo: "parrafo", texto: "Si crees que no lo hemos hecho bien, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es)." },
      ],
    },
    {
      titulo: "Menores de edad",
      bloques: [
        { tipo: "parrafo", texto: `${MARCA} está pensada para personas mayores de 55 años, pero **puede usarla cualquiera**: familiares, cuidadores y personas de cualquier edad que quieran acompañar o participar.` },
        { tipo: "parrafo", texto: "Si eres menor de 14 años necesitas que tu madre, tu padre o tu tutor den su permiso para que tratemos tus datos, porque así lo exige la ley española. Si detectamos una cuenta de un menor de 14 años sin ese permiso, la retiramos." },
      ],
    },
    {
      titulo: "Seguridad",
      bloques: [
        { tipo: "parrafo", texto: "La web va siempre por conexión cifrada, las contraseñas se guardan con un cifrado que no permite recuperarlas, y la sesión se mantiene en una cookie que el navegador no deja leer a ningún script." },
      ],
    },
  ],
};

const cookies: Documento = {
  slug: "cookies",
  titulo: "Política de cookies",
  resumen: "Qué guardamos en tu navegador, para qué sirve y cómo cambiar de opinión.",
  actualizado: ACTUALIZADO,
  secciones: [
    {
      titulo: "Qué es una cookie",
      bloques: [
        { tipo: "parrafo", texto: "Un archivo muy pequeño que la web deja en tu navegador para acordarse de algo. La más importante es la que recuerda que has iniciado sesión: sin ella tendrías que escribir la contraseña en cada página." },
      ],
    },
    {
      titulo: "Cuáles usamos",
      bloques: [
        { tipo: "lista", puntos: [
          "**Necesarias.** Mantienen tu sesión abierta, guardan lo que metes en el carrito y recuerdan qué respondiste a este mismo aviso. Sin ellas la web no funciona, así que no se pueden desactivar.",
          "**Analíticas.** Nos dicen qué páginas se usan más, siempre en conjunto y sin identificarte. Puedes rechazarlas.",
          "**De marketing.** Servirían para medir campañas. Puedes rechazarlas.",
        ] },
        { tipo: "destacado", texto: "Las analíticas y las de marketing solo se activan si las aceptas. Si rechazas, la web funciona igual: pierdes cero." },
      ],
    },
    {
      titulo: "Cómo cambiar tu elección",
      bloques: [
        { tipo: "parrafo", texto: "Cuando entraste por primera vez te preguntamos y guardamos tu respuesta. Para cambiarla, borra los datos de este sitio en tu navegador y volveremos a preguntarte." },
        { tipo: "parrafo", texto: "También puedes bloquear o borrar cookies desde los ajustes de tu navegador, en el apartado de privacidad. Ten en cuenta que si bloqueas las necesarias tendrás que iniciar sesión constantemente." },
      ],
    },
    {
      titulo: "Cookies de otras empresas",
      bloques: [
        { tipo: "parrafo", texto: "Cuando pagas, la pasarela de pago pone las suyas propias para detectar fraude. Son imprescindibles para que el cobro sea seguro y se rigen por la política de privacidad de esa empresa." },
      ],
    },
  ],
};

const terminos: Documento = {
  slug: "terminos",
  titulo: "Términos de uso",
  resumen: "Las reglas de la casa: quién puede usarla, qué no se puede hacer y cómo funcionan las compras.",
  actualizado: ACTUALIZADO,
  secciones: [
    {
      titulo: "Quién puede usar la plataforma",
      bloques: [
        { tipo: "parrafo", texto: `${MARCA} está pensada para personas mayores de 55 años, pero **no es exclusiva para ellas**: puede registrarse cualquiera que quiera participar o acompañar a alguien, tenga la edad que tenga.` },
        { tipo: "parrafo", texto: "Tu cuenta es tuya y personal: no la compartas ni dejes que la use otra persona en tu nombre. Si eres menor de 14 años, necesitas el permiso de tu madre, tu padre o tu tutor." },
      ],
    },
    {
      titulo: "Qué no se puede hacer aquí",
      bloques: [
        { tipo: "lista", puntos: [
          "Insultar, acosar, amenazar o faltar al respeto a nadie.",
          "Publicar contenido ilegal, violento o discriminatorio.",
          "Publicar datos de otras personas sin su permiso.",
          "Hacer spam o intentar vender fuera de los espacios previstos para ello.",
          "Suplantar a otra persona o a la propia plataforma.",
        ] },
        { tipo: "parrafo", texto: "Retiramos lo que se nos reporta cuando corresponde, normalmente en menos de 24 horas, y podemos cerrar una cuenta que incumpla esto de forma grave o repetida." },
      ],
    },
    {
      titulo: "Comprar en la tienda",
      bloques: [
        { tipo: "parrafo", texto: "Los productos de la tienda los vendemos nosotros. Antes de pagar ves el precio, los gastos de envío desglosados y el total exacto que se te va a cobrar." },
        { tipo: "lista", puntos: [
          "El envío se cobra una vez por pedido, según el tamaño del artículo más grande, y **es gratis a partir de 60 € de compra**.",
          "Los precios incluyen los impuestos aplicables.",
          `Tienes **${DIAS_DESISTIMIENTO} días naturales desde que recibes el pedido para devolverlo sin dar ninguna explicación**. Te devolvemos todo lo que pagaste, envío de la compra incluido, y te descontamos el coste del envío de vuelta (entre ${PORTE_VUELTA_DESDE} € y ${PORTE_VUELTA_HASTA} €). Está explicado paso a paso en la página de devoluciones y reembolsos.`,
          "Además, todo lo que vendemos tiene tres años de garantía legal si sale defectuoso.",
        ] },
      ],
    },
    {
      titulo: "Comprar y vender en segunda mano",
      bloques: [
        { tipo: "parrafo", texto: "Aquí el vendedor es otro usuario particular, no nosotros. Lo que hacemos es dar el sitio, cobrar y **retener el dinero hasta que el comprador recibe el paquete**, además de mediar si algo sale mal." },
        { tipo: "lista", puntos: [
          "El comprador paga el precio del artículo, los gastos de envío y un 3 % de gastos de gestión, que es lo que cubre esa garantía.",
          "El vendedor cobra el 100 % de su precio, y solo cuando el comprador ha recibido el producto o ha pasado el plazo sin decir nada.",
          "El vendedor tiene 5 días para enviar. Si no lo hace, se devuelve el dinero.",
          "**No hay derecho de desistimiento entre particulares**: no puedes devolver un artículo de segunda mano por arrepentirte. Lo que sí puedes es abrir una incidencia si no llega, llega roto o no es lo que se anunciaba.",
        ] },
      ],
    },
    {
      titulo: "Tu cuenta",
      bloques: [
        { tipo: "parrafo", texto: `Puedes cerrar tu cuenta cuando quieras escribiéndonos a ${TITULAR.email}. Eres responsable de lo que publicas con ella.` },
      ],
    },
    {
      titulo: "Ley aplicable",
      bloques: [
        { tipo: "parrafo", texto: `Legislación española. Como consumidor, siempre puedes acudir a los juzgados de tu domicilio y a los sistemas públicos de resolución de conflictos de consumo.` },
      ],
    },
  ],
};

// El documento que exige la ley antes de vender a un consumidor —hay que
// informar del derecho de desistimiento *antes* de comprar y dar un formulario
// modelo— y a la vez la página de ayuda que la gente busca cuando algo va mal.
// Por eso está escrito como una explicación y no como un texto legal.
const devoluciones: Documento = {
  slug: "devoluciones",
  titulo: "Devoluciones y reembolsos",
  resumen: "Cómo devolver algo que has comprado, cuánto tiempo tienes y cuándo recuperas el dinero.",
  actualizado: ACTUALIZADO,
  secciones: [
    {
      titulo: "En corto",
      bloques: [
        { tipo: "destacado", texto: `Tienes ${DIAS_DESISTIMIENTO} días desde que recibes el pedido para devolverlo. No tienes que explicar por qué. Te devolvemos todo lo que pagaste, menos el coste del envío de vuelta (entre ${PORTE_VUELTA_DESDE} € y ${PORTE_VUELTA_HASTA} €), que te descontamos del reembolso.` },
        { tipo: "parrafo", texto: "Esto vale para los productos que vendemos nosotros en la tienda. Para las compras de segunda mano entre particulares funciona distinto, y lo explicamos más abajo." },
      ],
    },
    {
      titulo: "Cómo devolver algo, paso a paso",
      bloques: [
        { tipo: "pasos", puntos: [
          "**Entra en «Mis pedidos»** y abre el pedido que quieres devolver. Verás cuántos días te quedan.",
          "**Pulsa «Solicitar devolución».** Si quieres puedes contarnos por qué, pero no hace falta: la ley no te obliga a justificarte.",
          "**Espera nuestra respuesta.** La revisamos y te contestamos por correo. Normalmente en uno o dos días laborables.",
          `**Recibirás una etiqueta de envío ya pagada.** Te llega por correo y también está en tu pedido, por si el correo se te traspapela. Tienes ${DIAS_ENVIO_VUELTA} días para usarla.`,
          "**Prepara el paquete.** Mete el artículo en su caja con todo lo que venía dentro: accesorios, cables, manuales.",
          "**Imprime la etiqueta y pégala** encima de la que traía, tapándola bien.",
          "**Déjalo en cualquier oficina del transportista.** No pagas nada allí ni tienes que buscarte el envío: ya está pagado y su coste se descuenta después del reembolso.",
          "**Te devolvemos el dinero** en cuanto recibimos y revisamos el paquete. Te avisamos por correo cuando lo hagamos.",
        ] },
        { tipo: "destacado", texto: "¿No tienes impresora? Escríbenos y buscamos otra forma. Que no tengas impresora no puede costarte una devolución." },
      ],
    },
    {
      titulo: "Cuánto dinero recibes",
      bloques: [
        { tipo: "parrafo", texto: "Te devolvemos **todo lo que pagaste**: el precio del producto y también los gastos de envío de la compra original. A la misma tarjeta con la que pagaste, y sin que tengas que hacer nada." },
        { tipo: "parrafo", texto: `De ese importe descontamos lo que cuesta el viaje de vuelta, que va **entre ${PORTE_VUELTA_DESDE} € y ${PORTE_VUELTA_HASTA} €** según el tamaño del paquete. No pagas nada en la oficina del transportista ni tienes que buscarte el envío: te damos la etiqueta hecha y esa cantidad se descuenta del dinero que te devolvemos.` },
        { tipo: "parrafo", texto: "El abono sale en cuanto recibimos y comprobamos el paquete, y tarda entre tres y cinco días hábiles en aparecer en tu cuenta según tu banco. Si pasada una semana no lo ves, escríbenos." },
        { tipo: "destacado", texto: "Si devuelves porque el producto llegó roto, no era el que pediste o no llegó nunca, **no te descontamos nada**: recuperas hasta el último céntimo, envíos incluidos. El fallo es nuestro y lo pagamos nosotros." },
      ],
    },
    {
      titulo: "Qué no se puede devolver",
      bloques: [
        { tipo: "parrafo", texto: "Casi todo se puede devolver, pero la ley reconoce algunas excepciones:" },
        { tipo: "lista", puntos: [
          "Productos precintados por higiene o salud que hayas abierto.",
          "Productos hechos a medida o personalizados para ti.",
          "Productos que se estropean rápido por su naturaleza.",
        ] },
        { tipo: "parrafo", texto: "Y si el producto vuelve claramente usado más allá de lo necesario para probarlo, podemos descontar del reembolso lo que haya perdido de valor. Te lo explicaríamos antes de hacerlo." },
      ],
    },
    {
      titulo: "Si el producto llegó roto o no es el que pediste",
      bloques: [
        { tipo: "parrafo", texto: "Eso no es una devolución, es que algo ha fallado por nuestra parte, y **no está sujeto a los 14 días**. Pídelo igual desde tu pedido y cuéntanos qué ha pasado; lo resolvemos sin discutir plazos." },
        { tipo: "parrafo", texto: "Todo lo que vendemos tiene además **tres años de garantía legal**. Si algo se estropea en ese tiempo por un defecto de fábrica, escríbenos." },
      ],
    },
    {
      titulo: "Compras de segunda mano",
      bloques: [
        { tipo: "parrafo", texto: "Cuando compras a otro usuario particular no hay derecho de desistimiento: no puedes devolverlo por arrepentirte, igual que en cualquier compra entre particulares." },
        { tipo: "parrafo", texto: "Lo que sí tienes es nuestra garantía de la compra, que es para lo que se cobra el 3 % de gastos de gestión: **retenemos el dinero del vendedor hasta que confirmas que has recibido el producto**. Si no llega, llega roto o no es lo que se anunciaba, abre una incidencia desde tu compra con el botón «Tengo un problema con esta compra» y te devolvemos el dinero." },
        { tipo: "parrafo", texto: "Ahí no hay plazo de 14 días: una incidencia se puede reclamar cuando aparece." },
      ],
    },
    {
      titulo: "Formulario de desistimiento",
      bloques: [
        { tipo: "parrafo", texto: "No hace falta que lo uses —con pulsar el botón en tu pedido es suficiente— pero la ley nos obliga a ponerlo a tu disposición. Si prefieres hacerlo por escrito, copia esto y mándanoslo por correo:" },
        { tipo: "parrafo", texto: `A la atención de ${TITULAR.nombre}, ${TITULAR.domicilio}, ${TITULAR.email}:\n\nPor la presente le comunico que desisto de mi contrato de venta del siguiente bien:\n\n— Producto: ______________________\n— Número de pedido: ______________________\n— Fecha en que lo recibí: ______________________\n— Nombre del consumidor: ______________________\n— Domicilio del consumidor: ______________________\n— Fecha: ______________________\n— Firma (solo si lo envías en papel): ______________________` },
      ],
    },
    {
      titulo: "¿Sigues con dudas?",
      bloques: [
        { tipo: "parrafo", texto: `Escríbenos a ${TITULAR.email} y te ayudamos. Si algo de esta página no se entiende, dínoslo también: es tan importante como lo demás.` },
      ],
    },
  ],
};

export const DOCUMENTOS: Record<string, Documento> = {
  "aviso-legal": avisoLegal,
  privacidad,
  cookies,
  terminos,
  devoluciones,
};

// El modal del registro usa estas tres claves desde antes de que existieran
// las páginas; se mantienen para no cambiar su interfaz.
export const LEGAL_REGISTRO = {
  aviso: avisoLegal,
  privacidad,
  terminos,
} as const;

export type ClaveRegistro = keyof typeof LEGAL_REGISTRO;
