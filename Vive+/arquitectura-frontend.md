---
trigger: always_on
---

# Arquitectura frontend

## Contexto del proyecto
- El proyecto tiene dos carpetas principales: `backend/` y `frontend/`.
- Esta rule aplica exclusivamente a la carpeta `frontend/`.

## Stack
- React con Vite
- Typescript
- fetch para HTTP

## Principios
- Separar UI, services, api, mappers y modelos.
- No hacer fetch directo dentro de componentes salvo demos explícitas.
- Centralizar configuración HTTP en api/httpClient.
- Usar mappers para transformar DTOs del backend a modelos del frontend.
- Mantener código simple, docente y mantenible.

## Estructura esperada
frontend/
  src/
    api/
    services/
    mappers/
    components/
    pages/

## Reglas
- api/: acceso HTTP puro.
- services/: casos de uso y orquestación.
- mappers/: transformación de datos.
- components/: componentes React reutilizables.
- pages/: vistas/pantallas con estado y coordinación.

## Restricciones
- No hacer llamadas HTTP en componentes ni pages.
- No hardcodear URLs fuera de api/.
- No mezclar lógica de negocio con render.
- Priorizar claridad pedagógica sobre abstracción avanzada.

## Estilos
- Los estilos de las paginas separarlos en archivos propios (styles.css) reutilizando componentes
