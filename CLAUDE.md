# CLAUDE.md — Relatia55

## Descripcion del proyecto

Relatia55 es una plataforma web de cuidado y acompañamiento para personas mayores de 55 años. Conecta usuarios, cuidadores (medicos/profesionales) y organizaciones. Incluye funcionalidades de chat en tiempo real, productos/servicios, recursos de salud, cercania entre usuarios y un sistema de autenticacion propio.

## Stack tecnico

- **Framework:** Next.js 16, solo App Router. No hay Pages Router: la carpeta `frontend/src/pages/` no son rutas, son los componentes de pagina que importan los `page.tsx` de `app/`.
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS v4
- **Base de datos:** PostgreSQL (via `pg` Pool, conexion en `relatia55/lib/db.ts`)
- **Autenticacion:** JWT custom con cookie `r65_token` + next-auth (Google OAuth)
- **Tiempo real:** Pusher (chat entre usuarios)
- **Email:** Nodemailer
- **Deploy:** Vercel (con cron job semanal en `/api/rotar-codigos` los lunes a las 8:00 UTC)

## Estructura del repositorio

```
Relatia55-1/
├── relatia55/                  # Proyecto Next.js principal
│   ├── app/                    # App Router: una carpeta por ruta con page.tsx
│   │   ├── api/                # API routes (delegan en backend/controllers)
│   │   ├── admin/              # Portada del panel de administracion
│   │   ├── admin-*/            # Una carpeta por seccion del panel
│   │   └── [slug]/             # Rutas dinamicas
│   ├── frontend/src/           # OJO: todo cuelga de src/
│   │   ├── pages/              # Componentes de pagina que importan los page.tsx
│   │   ├── components/         # Componentes React reutilizables
│   │   │   └── admin/          # Sistema de diseno del panel (ui, shell, primitivas)
│   │   ├── services/           # Clientes de API por entidad
│   │   ├── api/httpClient.ts   # Axios con baseURL /api
│   │   └── mappers/            # Conversion DTO <-> modelo
│   ├── backend/
│   │   ├── controllers/        # Logica de negocio por entidad
│   │   ├── config/             # Configuracion compartida del backend
│   │   ├── services/           # Servicios externos (mailer, pusher, stripe...)
│   │   └── migrations/         # Migraciones SQL
│   ├── lib/                    # Utilidades compartidas server + cliente
│   │   ├── db.ts               # Pool de PostgreSQL (fuente de verdad)
│   │   ├── auth.ts             # Sesion JWT, cookies y requireAdminPage()
│   │   ├── imagen.ts           # Validacion de subidas por magic bytes
│   │   ├── moderacion.ts       # Filtro de lenguaje
│   │   └── rate-limit.ts       # Limitador en memoria
│   ├── proxy.ts                # Guardas de ruta por rol (antes middleware.ts)
│   └── next.config.ts          # reactStrictMode: false
└── Documentacion/              # Docs del proyecto
```

## Ramas de trabajo

- `main` — rama principal, produccion
- `Rama-Hector` — rama activa de desarrollo (rama actual)
- Otros colaboradores tienen sus propias ramas (ej. rama-javier)

## Patrones y convenciones

- Los controladores del backend viven en `relatia55/backend/controllers/` y son archivos `.ts` por entidad (ej. `productos.ts`, `salud.ts`).
- Las API routes se crean bajo `relatia55/app/api/` con convenciones de App Router, y suelen limitarse a reexportar el controlador correspondiente de `backend/controllers/`.
- Las paginas siguen el mismo reparto: `app/<ruta>/page.tsx` es un Server Component que resuelve permisos y datos iniciales, y renderiza el componente real de `frontend/src/pages/`.
- La conexion a PostgreSQL siempre se importa desde `@/lib/db` (alias configurado en tsconfig).
- El token JWT se llama `r65_token` y se almacena como cookie HTTP.
- Las guardas de ruta viven en `relatia55/proxy.ts` (el fichero `middleware.ts` esta deprecado desde Next 16 y se renombro; la funcion exportada se llama `proxy`). Verifica la cookie `r65_token` y redirige por rol: `/panel-cuidador/**` exige sesion, `/admin-**` exige rol admin, y la tienda (`/marketplace`, `/segunda-mano`, `/mis-pedidos`) queda cerrada al rol medico. El alcance real esta en su `config.matcher`.
- `reactStrictMode` esta desactivado intencionalmente para evitar doble ejecucion de efectos.

## Variables de entorno necesarias

```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL
JWT_SECRET
NEXTAUTH_SECRET, NEXTAUTH_URL
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER
NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER
```

## Reglas de trabajo

- No modificar archivos fuera de `relatia55/` salvo que se indique explicitamente.
- No agregar dependencias sin consultar primero.
- No introducir breaking changes en las API routes existentes sin avisar.
- Preferir editar archivos existentes antes de crear nuevos.
- No agregar comentarios ni docstrings a codigo que no se toco.
- No agregar manejo de errores especulativo; solo validar en boundaries reales (input de usuario, respuestas externas).
- Los commits siguen el formato `tipo(scope): descripcion` (conventional commits).
- no me saludes 
- no reescribas 
-lee antes de escribir 