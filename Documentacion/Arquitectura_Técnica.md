# Arquitectura Técnica

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router + Pages Router en coexistencia) |
| Lenguaje | TypeScript (todo el proyecto) |
| Estilos | Tailwind CSS v4 |
| Base de datos | PostgreSQL — conexión via pool `pg` definida en `lib/db.ts` |
| Autenticación | JWT propio (cookie `r65_token`) + NextAuth v5 para Google OAuth |
| Chat en tiempo real | Pusher (WebSockets) |
| Pagos | Stripe (Checkout, Webhooks, Suscripciones) |
| Email | Nodemailer |
| Deploy | Vercel |

---

## Cómo está organizado el código

El proyecto usa dos routers de Next.js al mismo tiempo:

### App Router (`relatia55/app/`)
Se usa para las rutas de API. Hay una ruta dinámica principal (`/api/[slug]`) que actúa como punto de entrada y delega en los controladores del backend según el slug recibido. Además hay rutas específicas para casos especiales:
- `/api/auth/[...nextauth]` — login con Google
- `/api/stripe-webhook` — recibe eventos de Stripe
- `/api/chat-audio` — mensajes de audio en el chat
- `/api/facturas/[id]` — generación de facturas en PDF

### Pages Router (`relatia55/frontend/src/pages/`)
Se usa para todas las páginas visibles de la web (home, marketplace, salud, comunidad, etc.). Cada archivo `.tsx` es una página.

---

## Flujo de una petición

1. El usuario navega a una página (Pages Router).
2. La página llama a la API mediante fetch a `/api/[slug]`.
3. El App Router recibe la petición y la pasa al controlador correspondiente en `backend/controllers/`.
4. El controlador accede a la base de datos usando el pool de `lib/db.ts`.
5. Devuelve JSON a la página, que actualiza la interfaz.

---

## Autenticación

Hay dos sistemas de auth que conviven:

- **JWT propio:** al hacer login con email/contraseña, el servidor genera un token y lo guarda en la cookie `r65_token`. El middleware de Next.js (`middleware.ts`) lee esta cookie para proteger la ruta `/panel-cuidador`.
- **NextAuth (Google OAuth):** permite login con cuenta Google. Genera su propia sesión en paralelo.
- **Admin:** el admin no pasa por la verificación de `session_id` normal; tiene su propia lógica de acceso.

---

## Base de datos

PostgreSQL. La conexión se define una sola vez en `relatia55/lib/db.ts` y se importa desde todos los controladores usando el alias `@/lib/db`.

Las migraciones SQL están en `relatia55/backend/migrations/`.

---

## Tiempo real (Chat)

El chat entre usuarios usa Pusher. El servidor publica eventos en canales de Pusher y el cliente se suscribe con `pusher-js`. También se usa `BroadcastChannel` para sincronizar el stock del marketplace entre pestañas del mismo navegador.

---

## Pagos (Stripe)

- **Marketplace:** Stripe Checkout para compra de productos con stock.
- **Planes de usuario:** suscripciones recurrentes gestionadas en `stripe-subscription.ts`.
- **Planes de organización:** suscripciones separadas en `stripe-org-subscription.ts`.
- **Panel cuidador:** pago propio para acceder al panel médico.
- **Webhooks:** Stripe notifica eventos (pagos completados, cancelaciones) al endpoint `/api/stripe-webhook`.

---

## Tareas programadas (Cron)

Vercel ejecuta un cron job cada lunes a las 8:00 UTC que llama a `/api/rotar-codigos`. Este endpoint rota los códigos de acceso para los cuidadores/médicos.

---

## Configuración importante

- `reactStrictMode: false` en `next.config.ts` — desactivado intencionalmente para evitar doble ejecución de efectos.
- El alias `@/` apunta a la raíz de `relatia55/` (configurado en `tsconfig.json`).
