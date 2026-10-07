# Vive+

Aplicación web de cuidado y acompañamiento para personas mayores de 55 años. La configuración predeterminada ofrece una demo que no necesita PostgreSQL ni credenciales de servicios externos, tanto en local como en Vercel.

## Requisitos

- Node.js 20.9 o posterior y npm.

## Preparar y arrancar la demo

Desde PowerShell, abre la carpeta `Vive+` y ejecuta:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abre <http://localhost:3000>. Los productos, actividades, organizaciones, cuidadores y testimonios de ejemplo se sirven desde la aplicación. Para entrar en las secciones protegidas, usa cualquier correo y contraseña no vacíos en el formulario de acceso o crea una cuenta de prueba. El carrito, la sesión, las inscripciones y los testimonios de demo se guardan en el navegador.

La demo no se conecta al servidor antiguo ni requiere una base de datos. Los pagos, el chat en tiempo real, los correos, los envíos y las operaciones que modifican datos del servidor requieren restaurar/configurar sus servicios originales; no se ejecutan en este modo.

Para ejecutar las comprobaciones:

```powershell
npm test
npm run build
```

## Volver a conectar servicios reales

Solo desactiva `LOCAL_DEMO` y `NEXT_PUBLIC_LOCAL_DEMO` cuando tengas una base de datos compatible con las migraciones y hayas configurado credenciales válidas para autenticación y los servicios externos. Para hacerlo en Vercel, define ambas variables como `false` y vuelve a desplegar. La demo no restaura usuarios, conversaciones ni datos privados del servidor antiguo.
