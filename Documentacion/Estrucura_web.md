# Estructura del Proyecto

El repositorio tiene una carpeta raíz `Relatia55-1/` con el proyecto Next.js dentro de `relatia55/` y esta carpeta de documentación.

---

## Árbol de directorios

```
Relatia55-1/
├── relatia55/                          # Proyecto Next.js principal
│   ├── app/                            # App Router (páginas + API)
│   │   ├── page.tsx                    # Portada (/) → renderiza frontend/src/pages/home.tsx
│   │   ├── layout.tsx                  # Layout raíz (providers, nav, footer, analytics)
│   │   ├── globals.css                 # Estilos globales (Tailwind v4)
│   │   ├── robots.ts / sitemap.ts      # SEO: robots.txt y sitemap generados
│   │   ├── <ruta>/page.tsx             # Una carpeta por página pública o admin
│   │   │                               #   (salud, comunidad, mis-chats, marketplace,
│   │   │                               #    organizaciones, planes, panel-cuidador,
│   │   │                               #    admin-*, etc.) — cada page.tsx aporta
│   │   │                               #    metadata SEO + usuario de sesión (SSR) y
│   │   │                               #    delega en el componente de frontend/src/pages
│   │   └── api/
│   │       ├── [slug]/route.ts         # Ruta dinámica principal → mapa slug → controller
│   │       ├── auth/[...nextauth]/route.ts  # Login con Google (NextAuth)
│   │       ├── chat-audio/route.ts     # Subida/entrega de audios del chat
│   │       ├── docs-file/[filename]/route.ts # Descarga protegida de documentos de cuidadores
│   │       ├── stripe-webhook/route.ts # Eventos de Stripe (pagos, cancelaciones)
│   │       └── facturas/[id]/route.ts  # Generación de facturas PDF
│   │
│   ├── frontend/src/
│   │   ├── pages/                      # Componentes de página (uno por vista)
│   │   ├── components/                 # Componentes reutilizables
│   │   │   ├── comunidad/              # Subcomponentes del chat de comunidad
│   │   │   ├── mis-chats/              # Subcomponentes de conversaciones privadas
│   │   │   └── salud/                  # Subcomponentes del chat con médicos
│   │   ├── api/httpClient.ts           # Cliente axios centralizado (baseURL /api)
│   │   ├── services/                   # Capa de acceso a la API por entidad
│   │   └── mappers/dtoMapper.ts        # DTOs del backend → modelos del frontend
│   │
│   ├── backend/
│   │   ├── controllers/                # Lógica de negocio por entidad (~65 archivos)
│   │   ├── services/                   # Servicios externos (mailer, pusher, invoice, post-venta)
│   │   ├── config/auth.ts              # Configuración de NextAuth (Google OAuth)
│   │   └── migrations/                 # Migraciones SQL numeradas (001–029)
│   │
│   ├── lib/
│   │   ├── db.ts                       # Pool de PostgreSQL (fuente de verdad)
│   │   ├── auth.ts                     # Cookie de sesión httpOnly + verificación JWT
│   │   ├── rate-limit.ts               # Rate limiting en memoria por IP/clave
│   │   ├── imagen.ts                   # Validación de imágenes por magic bytes
│   │   └── moderacion.ts               # Filtro de lenguaje inapropiado
│   │
│   ├── tests/                          # Tests con node --test (imagen, moderación, rate-limit)
│   ├── public/                         # Estáticos (imágenes, uploads)
│   ├── facturas/                       # PDFs de facturas generadas
│   ├── middleware.ts                   # Restricciones por rol + protección /panel-cuidador
│   ├── next.config.ts                  # reactStrictMode: false
│   ├── vercel.json                     # Cron semanal de /api/rotar-codigos
│   └── .env.local                      # Variables de entorno (no en git)
│
└── Documentacion/                      # Esta carpeta
```

---

## Análisis detallado por partes

### 1. `app/` — App Router: páginas y API

Todo el enrutado real vive aquí. Hay dos tipos de rutas:

**Páginas.** Cada carpeta (`app/salud/`, `app/comunidad/`, `app/marketplace/`…) contiene un `page.tsx` fino que hace tres cosas: define la `metadata` SEO de la vista, lee el usuario de sesión en el servidor con `getSessionUser()` (de `lib/auth.ts`) y renderiza el componente de página correspondiente de `frontend/src/pages/`, pasándole el usuario inicial como prop. Así el contenido pesado de UI queda separado del enrutado, y las páginas llegan al cliente ya sabiendo si hay sesión (sin parpadeo de "no logueado").

Las páginas se dividen en tres grupos:
- **Públicas:** home (`page.tsx` raíz), `sobre-nosotros`, `contacto`, `organizaciones`, `recursos`, `cotizador`, `planes`, `planes-organizacion`.
- **De usuario logueado:** `comunidad` (muro/chat de cercanía), `mis-chats`, `salud` (chat con médicos), `buscar`, `marketplace`, `segunda-mano`, `onboarding`, `reset-password`, `compra-cancelado`.
- **Privadas por rol:** `panel-cuidador` (médicos/cuidadores) y las ocho `admin-*` (anuncios, códigos, marketplace, organizaciones, salud, actividades, cuidadores, planes).

**API (`app/api/`).** La pieza central es `[slug]/route.ts`: una ruta dinámica que mantiene un mapa `slug → módulo controlador`. Una petición a `/api/login` busca el módulo `login` en el mapa y ejecuta su handler según el método HTTP. Esto concentra el wiring de ~60 endpoints en un solo archivo y deja la lógica en `backend/controllers/`. Fuera del mapa quedan cuatro rutas con necesidades especiales: NextAuth (`auth/[...nextauth]`), audio del chat (`chat-audio`, maneja binarios), descarga protegida de documentos (`docs-file/[filename]`), el webhook de Stripe (necesita el body crudo para verificar la firma) y las facturas PDF (`facturas/[id]`).

### 2. `frontend/src/` — Interfaz de usuario

**`pages/`** — 26 componentes de página, uno por vista. No son rutas de Next (no hay Pages Router real); son componentes React que el App Router monta desde `app/*/page.tsx`. Las más grandes son `comunidad.tsx`, `mis-chats.tsx`, `salud.tsx` y `panel-cuidador.tsx`, que concentran los flujos de chat y el panel profesional.

**`components/`** — Componentes compartidos:
- *Infraestructura de sesión y acceso:* `auth-gate.tsx` (bloquea vistas sin login), `plan-gate.tsx` (bloquea vistas sin suscripción), `AuthSessionProvider.tsx` (contexto de NextAuth).
- *Layout global:* `nav-bar.tsx`, `footer.tsx`, `CookieBanner.tsx`, `BannerPublicitario.tsx`.
- *Carrito:* `CartContext.tsx` (estado global), `CartDrawer.tsx` (panel lateral), `useCart.ts`.
- *Chat:* `ChatNotifier.tsx` (escucha Pusher y notifica mensajes nuevos en toda la app).
- *UI genérica:* `cards.tsx`, `filter-bar.tsx`, `fade-up.tsx`, `ProfileModal.tsx`, `Testimoniossection.tsx`, `admin-cat-panel.tsx`, `usePlan.ts`.

Los tres subdirectorios (`comunidad/`, `mis-chats/`, `salud/`) son el resultado de trocear las páginas de chat gigantes: cada uno agrupa los subcomponentes de su vista (sidebar, área de mensajes, reproductor de audio, helpers, hooks y estilos). Por ejemplo `mis-chats/` tiene `ConvSidebar.tsx`, `ChatArea.tsx`, `AudioPlayer.tsx` y `useVoiceRecorder.ts`.

**`api/httpClient.ts`** — Instancia única de axios con `baseURL: '/api'`, `withCredentials` (para que viaje la cookie de sesión) y un interceptor de errores. Toda petición del frontend pasa por aquí.

**`services/`** — Capa entre componentes y API: un archivo por dominio (`saludService`, `carritoService`, `organizacionesService`, `perfilService`…). Los componentes no llaman a axios directamente; llaman a estas funciones, que usan `httpClient` y devuelven datos ya tipados.

**`mappers/dtoMapper.ts`** — Traduce los DTOs que devuelve el backend (nombres de columna SQL, campos opcionales duplicados como `logo_url`/`logo`) a los modelos limpios que consume la UI.

### 3. `backend/` — Lógica de negocio

**`controllers/`** — Un archivo por entidad/acción con los handlers HTTP (`GET`, `POST`…). Agrupados por dominio:

| Dominio | Controladores |
|---------|--------------|
| Autenticación y sesión | `login`, `logout`, `register`, `verify-session`, `pusher-auth`, `forgot-password`, `reset-password`, `onboarding` |
| Usuarios y perfil | `usuarios`, `perfil`, `buscar-usuarios`, `mis-usuarios`, `ubicacion`, `solicitudes` |
| Chat | `chat-send`, `chat-history`, `chat-audio`, `cercania-send`, `cercania-history` |
| Contenido | `salud`, `recursos`, `anuncios`, `testimonios`, `organizaciones`, `categorias`, `tecnologias` |
| Comercio | `marketplace`, `segunda-mano`, `carrito`, `comprar`, `ordenes`, `cotizador` |
| Pagos (Stripe) | `stripe-checkout`, `stripe-webhook`*, `stripe-success`, `stripe-subscription`, `stripe-org-subscription`, `stripe-sync-marketplace`, `confirm-plan`, `confirm-org-plan`, `connect-onboard` |
| Planes y suscripciones | `planes`, `suscripciones`, `pagos-planes` |
| Médicos/cuidadores | `register-medico-directo`, `register-medico-pending`, `validar-codigo-medico`, `iniciar-pago-medico`, `confirmar-pago-medico`, `confirm-medico-plan`, `docs-cuidador`, `valoraciones-medico`, `rotar-codigos` |
| Administración | `admin-anuncios`, `admin-salud`, `admin-organizaciones`, `admin-actividades`, `admin-cuidadores`, `admin-categorias`, `admin-codigos` |
| Utilidades | `contacto`, `ping`, `upload-imagen`, `upload-documento` |

\* el webhook tiene además su propia ruta en `app/api/stripe-webhook/`.

**`services/`** — Integraciones externas compartidas por los controladores: `mailer.ts` (Nodemailer), `pusher.ts` (instancia servidor de Pusher), `invoice.ts` (generación de facturas) y `segunda-mano-post-venta.ts` (flujo posterior a una venta de segunda mano).

**`config/auth.ts`** — Opciones de NextAuth (proveedor Google, callbacks), consumidas por `app/api/auth/[...nextauth]`.

**`migrations/`** — Migraciones SQL numeradas (001–029): creación de tablas (productos, categorías, anuncios, testimonios, facturas, cotizaciones, onboarding…), seeds, índices de rendimiento (026) y las más recientes: transferencias pendientes (028) y tokens de reset de contraseña (029). Se aplican manualmente contra PostgreSQL.

### 4. `lib/` — Utilidades transversales

- **`db.ts`** — Pool de `pg`. Fuente de verdad de la conexión; todo import de DB sale de `@/lib/db`.
- **`auth.ts`** — Gestión de la cookie de sesión `r65_token`: la fija como **httpOnly** (inaccesible desde JS, mitiga robo por XSS), `secure` en producción y `sameSite: lax`, con caducidad de 7 días. Expone `getSessionUser()` para leer/verificar el JWT en el servidor.
- **`rate-limit.ts`** — Ventana deslizante en memoria por clave (normalmente `endpoint:IP`). Usado en endpoints sensibles (login, registro, envío de mensajes…).
- **`imagen.ts`** — Detecta el tipo real de una imagen por sus *magic bytes* (jpg/png/gif/webp), sin fiarse del nombre de archivo ni del Content-Type del cliente.
- **`moderacion.ts`** — Filtro de lenguaje inapropiado tolerante a acentos y caracteres intercalados, usado en los chats.

### 5. `middleware.ts` — Restricciones por rol

Se ejecuta antes de cada página y aplica reglas según el rol del JWT:
- **Organizaciones** (`usuario_organizacion`): solo pueden ver la portada, `/organizaciones` y `/sobre-nosotros`; el resto redirige a `/organizaciones`.
- **Médicos sin plan activo**: se les redirige a `/panel-cuidador` desde las secciones de usuario.
- **`/panel-cuidador`**: requiere JWT válido.

### 6. `tests/` — Tests unitarios

Tests con el runner nativo de Node (`node --test`, script `npm test`) para las utilidades puras de `lib/`: `imagen.test.ts`, `moderacion.test.ts` y `rate-limit.test.ts`.

### 7. Raíz del proyecto

- **`vercel.json`** — Cron job semanal que llama a `/api/rotar-codigos` los lunes a las 8:00 UTC (rotación de códigos de médicos).
- **`next.config.ts`** — `reactStrictMode: false` intencionado (evita doble ejecución de efectos en los chats).
- **`public/`** — Estáticos y uploads servidos directamente.
- **`facturas/`** — PDFs generados por `backend/services/invoice.ts`.
- **`arquitectura-frontend.md`** — Notas de arquitectura del frontend.

### Flujo de una petición típica

```
Componente (frontend/src/pages o components)
  → service (frontend/src/services/xService.ts)
    → httpClient (axios, cookie r65_token viaja sola)
      → /api/<slug> (app/api/[slug]/route.ts)
        → controller (backend/controllers/<slug>.ts)
          → lib/auth (verifica JWT) · lib/rate-limit · lib/db (SQL)
        ← JSON (DTO)
    ← mapper (dtoMapper.ts) → modelo de UI
```

---

## Variables de entorno necesarias

El archivo `.env.local` (no subido al repositorio) debe contener:

| Variable | Para qué sirve |
|----------|---------------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL` | Conexión a PostgreSQL |
| `JWT_SECRET` | Firma de tokens JWT propios |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | Sesión de NextAuth |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Login con Google |
| `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` | Chat en tiempo real (servidor) |
| `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | Chat en tiempo real (cliente) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Pagos con Stripe |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Envío de emails |

---

## Cómo arrancar el proyecto en local

```bash
cd relatia55
npm install
npm run dev
```

La app corre en `http://localhost:3000`. Los logs van a la terminal donde se ejecuta `next dev`.

Tests: `npm test` (runner nativo de Node sobre `tests/`).

---

## Ramas de trabajo

- `main` — rama principal / producción
- `Rama-Hector` — rama activa de desarrollo (rama actual)
