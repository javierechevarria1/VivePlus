# Funcionalidades de Relatia55

Resumen de todos los módulos y funcionalidades que tiene la plataforma actualmente.

---

## Autenticación y sesión

- **Registro** — con email, contraseña y datos básicos. El username puede contener letras, números y algunos caracteres especiales.
- **Login** — con email/contraseña (JWT) o con Google (NextAuth OAuth).
- **Reset de contraseña** — flujo por email con enlace temporal.
- **Onboarding** — formulario inicial que el usuario completa al registrarse por primera vez (preferencias, perfil, etc.).
- **Gestión de sesión** — cookie `r65_token` con JWT. El servidor valida la sesión en cada petición protegida.

---

## Perfil de usuario

- Ver y editar datos personales.
- Modal de perfil accesible desde la navbar.
- Subida de foto de perfil (imagen).
- Datos de personas dependientes a cargo (pueden coincidir en nombre).

---

## Comunidad y cercanía

- **Buscar usuarios** — búsqueda por nombre o intereses.
- **Usuarios cercanos** — geolocalización (requiere permiso del usuario). Muestra personas en un radio próximo para facilitar quedadas reales.
- **Solicitudes de amistad** — enviar, aceptar o rechazar solicitudes.
- **Mis chats** — lista de conversaciones activas.

---

## Chat en tiempo real

- Mensajes de texto en tiempo real usando Pusher (WebSockets).
- Mensajes de audio (`/api/chat-audio`).
- Historial de conversaciones guardado en base de datos.
- Notificador de mensajes nuevos en la navbar (`ChatNotifier`).

---

## Salud

- Sección de artículos y recursos de salud.
- Administración de contenidos de salud desde el panel admin (`admin-salud`).
- Valoraciones de médicos/cuidadores.

---

## Recursos

- Sección de artículos y contenidos de interés general.
- Gestionados desde el controlador `recursos.ts`.

---

## Marketplace (Tienda)

- Catálogo de productos con imagen, descripción, precio y stock.
- Categorías de productos configurables desde la BD (con color, icono y gradiente personalizados).
- Filtro por categoría (multi-selección), incluyendo la opción "Todas".
- Buscador de productos por nombre o descripción.
- Carrito de compra (`CartContext`, `CartDrawer`) con soporte para invitados.
- Stock sincronizado en tiempo real entre pestañas (BroadcastChannel) y entre usuarios (Pusher).
- Pago con Stripe Checkout. Al completar el pago el carrito se vacía automáticamente.
- Facturas descargables en PDF (`/api/facturas/[id]`).

---

## Segunda mano

- Sección separada para productos de segunda mano publicados por usuarios.
- Controlador `segunda-mano.ts`.

---

## Tecnologías

- Sección de productos tecnológicos (separada del marketplace general).
- Controlador `tecnologias.ts`.

---

## Planes y suscripciones

- **Planes para usuarios** — los usuarios pueden suscribirse a planes de cuidado con pago recurrente (Stripe).
- **Planes de organización** — suscripción específica para organizaciones.
- **Panel de cuidador** — plan de pago para que médicos/cuidadores accedan a su panel privado.
- Al pagar el plan "ficha + banner" se crea el anuncio del cuidador automáticamente.
- Opción de cancelar suscripción desde la plataforma.

---

## Panel de cuidador (`/panel-cuidador`)

Área privada para médicos y cuidadores, protegida por middleware JWT.

- Acceso mediante código semanal rotatorio (generado por cron job en Vercel).
- Gestión de documentos del cuidador.
- Visualización de usuarios/pacientes asignados.
- Pago del plan para activar el panel.
- Registro directo o en lista de espera (pending).

---

## Organizaciones

- Listado público de organizaciones registradas en la plataforma.
- Cada organización puede tener planes y actividades propias.
- Las organizaciones pueden suscribirse a planes de visibilidad.
- Administración desde `admin-organizaciones`.

---

## Cotizador

- Formulario de cotización de servicios.
- Controlador `cotizador.ts`.

---

## Anuncios y banners publicitarios

- Sistema de anuncios con ubicación configurable (lateral, productos, etc.).
- Componente `BannerPublicitario` que muestra anuncios según la sección.
- Administración de anuncios desde `admin-anuncios`.

---

## Panel de administración

Páginas de admin accesibles solo para el rol `admin`:

| Página | Qué gestiona |
|--------|-------------|
| `admin-anuncios` | Anuncios y banners publicitarios |
| `admin-codigos` | Códigos de acceso para cuidadores |
| `admin-marketplace` | Productos del marketplace |
| `admin-organizaciones` | Organizaciones registradas |
| `admin-salud` | Artículos de salud |
| `admin-actividades` | Actividades y eventos |
| `admin-cuidadores` | Cuidadores registrados |
| `admin-planes` | Planes disponibles |

---

## Contacto

- Formulario de contacto que envía un email al equipo mediante Nodemailer.

---

## Testimonios

- Sección de testimonios de usuarios mostrada en la home.
- Gestionados desde `testimonios.ts`.

---

## Accesibilidad y UX

- Diseño responsive (móvil, tablet y escritorio).
- Animaciones de entrada suaves (`FadeUp`, `AnimatedCard` con IntersectionObserver).
- Barra de cookies (`CookieBanner`).
- Protección de rutas para usuarios no autenticados (`auth-gate`, `plan-gate`).
- `reactStrictMode` desactivado para evitar comportamientos dobles en efectos.
