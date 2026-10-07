# Vive+

Aplicación web de cuidado y acompañamiento para personas mayores de 55 años. Usa Next.js, PostgreSQL y servicios externos para autenticación, chat, pagos, email y envíos.

## Datos y base de datos local

No hay un backup de la base de datos anterior en el repositorio, así que no se pueden recuperar usuarios, conversaciones ni otros datos del servidor. Se añadió `backend/migrations/000_base_schema.sql`, un esquema inicial reconstruido a partir de las consultas de la aplicación, seguido de las migraciones existentes y sus datos de catálogo. Es una instalación nueva, no una copia exacta de la base privada antigua.

## Requisitos

- Node.js 20.9 o posterior y npm.
- PostgreSQL 14 o posterior, con un usuario y una base de datos propios para Vive+.

No es necesario Docker. No reutilices ni borres una base de datos local que pertenezca a otro proyecto.

## Preparar el entorno

Desde PowerShell, abre la carpeta `Vive+` del repositorio y ejecuta:

```powershell
npm ci
Copy-Item .env.example .env.local
```

Crea un rol y una base de datos nuevos desde pgAdmin o `psql`. Ejecuta cada sentencia por separado:

```sql
CREATE ROLE viveplus_local LOGIN PASSWORD 'elige-una-clave-local';
```

```sql
CREATE DATABASE viveplus OWNER viveplus_local;
```

Edita `.env.local` para que `DB_USER`, `DB_PASSWORD` y los demás valores de PostgreSQL coincidan con esa instalación. Genera secretos distintos para `JWT_SECRET`, `NEXTAUTH_SECRET` y `CRON_SECRET`, por ejemplo:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Aplica el esquema y todas las migraciones una sola vez a esa base nueva:

```powershell
.\scripts\migrate.ps1
```

El script lee `.env.local`, aplica cada archivo en orden, registra lo aplicado y se detiene si hay un error. Si la base ya tiene tablas pero no el registro de migraciones, se detiene para no truncar ni sobrescribir datos.

Para crear tu propia cuenta administradora, regístrate desde la web y después asígnale el rol `5` en pgAdmin:

```sql
UPDATE usuarios SET rol = 5 WHERE LOWER(email) = LOWER('tu-correo@example.com');
```

Los valores de ejemplo de Stripe y Pusher solo permiten cargar la configuración y compilar; no habilitan pagos ni chat. SMTP y Sendcloud requieren credenciales propias para enviar correo o tramitar envíos. No pongas claves reales en `.env.example` ni las subas al repositorio.

Si más adelante consigues un backup original, restáuralo en otra base distinta: no ejecutes el esquema reconstruido ni las migraciones iniciales sobre ese backup.

## Ejecutar

```powershell
npm run dev
```

Abre <http://localhost:3000>. Para validar cambios:

```powershell
npm test
npm run build
```

Las pruebas actuales no requieren una base de datos. La compilación necesita que las variables de autenticación, Stripe y Pusher estén definidas; la plantilla las incluye con valores locales no operativos.
