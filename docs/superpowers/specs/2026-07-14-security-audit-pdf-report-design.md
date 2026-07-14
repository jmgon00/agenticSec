# Descarga de reporte PDF — Auditor de Seguridad con IA

**Fecha:** 2026-07-14
**Estado:** Aprobado por el usuario

## Contexto

El agente "Auditor de Seguridad con IA" corre un scan en vivo (SSE) y muestra los resultados en pantalla en `AgentScanRunner.tsx`, agrupados por categoría (`CategoryCheckResult[]`) con un tag de `estado` por check (`Aprobado` | `Fallido` | `Pendiente` | `No aplica`) y un resumen ejecutivo (`summary`) generado por Claude. Hoy esos resultados solo existen en el estado del componente cliente durante esa sesión — no hay forma de descargarlos ni de volver a verlos después.

Este feature agrega un botón "Descargar reporte (PDF)" que aparece junto a los resultados una vez terminado el scan, y genera un PDF prolijo con la marca del sitio (AgenticSec) reutilizando exactamente los datos ya renderizados en pantalla.

## Alcance

- Descarga disponible **solo inmediatamente después de un scan en vivo**, desde los datos ya presentes en el estado del cliente. No se agrega historial ni lectura de scans pasados (`SecurityScanRun` por id) — queda fuera de este alcance.
- Formato: **PDF**, generado en el servidor con `@react-pdf/renderer` (vectorial/texto, sin capturas de pantalla ni Chromium headless) para mantener el archivo liviano.
- Estilo: reporte prolijo con marca (header con "AgenticSec", resumen ejecutivo arriba, tablas por categoría con badges de color por estado). Sin adornos extra más allá de eso.

## Arquitectura y flujo de datos

1. **Endpoint nuevo:** `POST /api/agents/[agent-id]/scan/report`
   - Body: `{ target: string, summary: string, findings: CategoryCheckResult[] }` — mismos datos que el cliente ya tiene en memoria tras el scan.
   - Valida el body con `zod` (schema derivado de los tipos de `src/lib/agents/types.ts`).
   - Renderiza el PDF con `renderToBuffer` de `@react-pdf/renderer` usando un documento definido en `src/lib/agents/scan/report-pdf.tsx`.
   - Responde con `Content-Type: application/pdf` y `Content-Disposition: attachment; filename="reporte-seguridad-<target-sanitizado>-<YYYY-MM-DD>.pdf"`.
   - No consulta ni escribe en la base de datos, no repite el scan, no valida SSRF de nuevo (el `target` ya fue validado y auditado en el scan original; acá solo se usa como texto para el nombre de archivo y el header del PDF).

2. **Cliente (`AgentScanRunner.tsx`):**
   - En el bloque que ya renderiza `summary` + `findings` (líneas ~195-228), se agrega un botón "Descargar reporte (PDF)".
   - Al click: `fetch(POST, body: { target, summary, findings })` → `res.blob()` → se crea un `<a>` temporal con `URL.createObjectURL(blob)` y atributo `download` → `click()` → se revoca el object URL.
   - Estados del botón: `idle` → `generando...` (deshabilitado, spinner o texto) → vuelve a `idle` al terminar. Si falla, `error` (ver manejo de errores abajo).

3. **Deuda técnica resuelta de paso:** `AgentScanRunner.tsx` redeclara localmente `ScanPoint`/`CategoryCheckResult` (líneas 6-18) en vez de importarlos de `src/lib/agents/types.ts`. Se unifican en este cambio, ya que el endpoint nuevo necesita los mismos tipos y es el momento natural de sacar la duplicación.

## Contenido y layout del PDF

- **Header/portada:** banda superior con fondo oscuro (`#030712`, mismo tono que `bg-gray-950` del sitio) y texto "AgenticSec" en cyan (`#22d3ee`, mismo tono que el acento del `Header.tsx`). Debajo: título "Reporte de Auditoría de Seguridad", target auditado, y fecha de generación.
- **Resumen ejecutivo:** el texto de `summary` tal cual lo generó el agente, en un bloque de texto simple.
- **Por cada categoría** (Headers HTTP, TLS/SSL, Archivos Expuestos, Versiones/CVEs, Cookies/Auth, DNS/Email): encabezado de sección + tabla con columnas `Check | Estado | Resultado | Evidencia | Recomendación`. La celda de `Estado` lleva un badge de color equivalente a los tags de la web:
  - Aprobado → verde (`#22c55e`)
  - Fallido → rojo (`#ef4444`)
  - Pendiente → amarillo (`#eab308`)
  - No aplica → gris (`#6b7280`)
- **Footer de cada página:** número de página + disclaimer fijo: *"Este reporte fue generado automáticamente por un agente de IA como apoyo informativo y no reemplaza una auditoría de seguridad profesional completa."*

## Manejo de errores

- **Cliente:** si el `fetch` falla (red, status ≥ 400), el botón vuelve a `idle` y se muestra un mensaje inline corto de error con opción de reintentar. No se bloquea el resto de la UI de resultados.
- **Servidor:**
  - Body inválido (falla `zod`) → `400` con mensaje de error genérico en JSON.
  - Falla inesperada al renderizar (`renderToBuffer` lanza) → `500` con mensaje genérico, sin exponer stack trace ni detalles internos.
- **Sin rate limiting adicional:** este endpoint no ejecuta el scan (eso ya está limitado a 3/24h en `/scan/stream`), no hace requests salientes ni SSRF, y solo formatea datos que el usuario ya tiene visibles en pantalla — no hay superficie de abuso nueva que justifique un límite propio.

## Testing

- **Unit test (Vitest)** sobre el endpoint:
  - Payload válido → `200`, `Content-Type: application/pdf`, buffer no vacío.
  - Payload inválido (falta `findings` o `target`) → `400`.
- **Verificación manual:** correr un scan real contra un target de prueba, descargar el PDF, confirmar visualmente que el contenido coincide con lo mostrado en pantalla (summary, categorías, estados, colores) y que el tamaño del archivo es chico (esperado: bajo ~100 KB, al ser texto/vectores sin imágenes).
- No se agrega test de parseo de contenido del PDF binario — se verifica una vez manualmente y se confía en el render dado que los props de entrada ya están validados por zod y cubiertos por el test del endpoint.

## Fuera de alcance (para después)

- Historial de scans pasados y descarga de reportes viejos (requeriría endpoint `GET` + lectura de `SecurityScanRun`).
- Agregar más stacks/checks a la auditoría (próximo feature, según lo conversado).
