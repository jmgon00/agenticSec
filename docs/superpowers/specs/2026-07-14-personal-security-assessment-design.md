# Agente "Evaluación de Seguridad Personal" (Personal Security Assessment)

**Fecha:** 2026-07-14
**Estado:** Aprobado por el usuario

## Contexto

El usuario quiere un nuevo agente inspirado en el "Auditor de Seguridad con IA" (que escanea dominios en vivo), pero enfocado en la persona: responder "¿qué tanto puede averiguar/atacar/comprometer alguien sobre mí usando Internet?". A diferencia del auditor de dominios, la mayoría de esta información **no se puede escanear automáticamente** (hábitos de contraseñas, redes sociales, dispositivos, red doméstica, etc.) — depende de que la persona autorreporte sus respuestas.

El usuario proveyó una referencia de 15 niveles (identidad digital, cuentas, correos, contraseñas, filtraciones, redes sociales, dispositivos, red doméstica, finanzas, suscripciones, privacidad, seguridad física, ingeniería social, exposición técnica, puntaje de riesgo). Se acordó arrancar con un **MVP de 7 categorías** y ampliar después, siguiendo la misma lógica incremental que el auditor de dominios.

## Alcance v1 (MVP)

**Incluye:** formulario único de una pantalla con 7 categorías (28 preguntas cerradas), scoring 100% determinístico en código, resumen ejecutivo + interpretación del puntaje de riesgo por Claude, mismo formato visual de resultados (categorías + tags de estado) y descarga de PDF que el auditor de dominios.

**Fuera de alcance (para después, según la referencia del usuario):** correos electrónicos (nivel 3), filtraciones/breach-check automático (nivel 5), finanzas (nivel 9), suscripciones (nivel 10), privacidad de apps (nivel 11), seguridad física (nivel 12), exposición técnica (nivel 14), historial de evaluaciones pasadas.

## Arquitectura y flujo de datos

- **Sin streaming SSE.** A diferencia del scan de dominios (cuyos checks tardan porque hacen requests de red reales), acá el cálculo es instantáneo (lógica en TypeScript). Un solo endpoint `POST /api/agents/[agent-id]/assessment/run` recibe todas las respuestas del formulario, calcula el resultado y responde con el JSON completo (`{ findings, summary, riskScore }`). La única latencia perceptible es la llamada final a Claude para el resumen (~2-3s).
- **Scoring determinístico en código** (`src/lib/agents/assessment/scoring.ts`), mismo patrón que `checks.ts` del scan de dominios: cada respuesta cerrada mapea a una regla fija en TypeScript que produce un `ScanPoint` (`estado`/`severity`/`recommendation`/`evidence`), 100% testeable sin llamar a Claude.
- **Claude solo escribe el resumen ejecutivo** (`src/lib/agents/assessment/orchestrator.ts`): recibe el `CategoryCheckResult[]` ya calculado + el `riskScore`, y genera `summary` (texto interpretando el puntaje y priorizando qué corregir primero), forzado con `output_config.format: json_schema` — mismo patrón que `runSecurityScan`.
- **Reutiliza el modelo de datos existente sin cambios**: `ScanPoint` / `CategoryCheckResult` / `ScanEstado` de `@/lib/agents/types` (sin agregar campos nuevos). Esto permite reutilizar el generador de PDF (`report-pdf.tsx`) **tal cual, sin modificarlo** — el campo `target` pasa a usarse como etiqueta genérica ("Evaluación de Seguridad Personal") en vez de un dominio.
- **Nuevo modelo Prisma** `PersonalAssessmentRun` (mismo patrón que `SecurityScanRun`): guarda las respuestas crudas (`answers: Json`) + `findings: Json` + `summary` + `riskScore: Int` + `status` + `userEmail` + timestamps.
- **Rate limit**: mismo mecanismo que el scan (conteo de runs por `userEmail`/24h en la tabla `PersonalAssessmentRun`), pero más generoso — **10/24h** en vez de 3/24h, porque no hay carga de red real ni riesgo de SSRF, solo costo de una llamada a Claude.

## Las 7 categorías y sus preguntas

Cada pregunta es de opción cerrada (sí/no/opción múltiple). Cada respuesta mapea 1:1 a una regla de scoring fija (estado + severity + recommendation). El detalle completo de las 28 preguntas y sus reglas de puntaje exactas se especifica en el plan de implementación (Task de `scoring.ts`), pero el contenido y la intención de cada categoría es:

1. **Identidad Digital** — ¿buscaste tu nombre en Google?, ¿aparece tu teléfono/DNI/dirección indexado?, ¿perfiles viejos activos que ya no usás?, ¿reusás el mismo usuario/handle en todos lados?
2. **Cuentas y Autenticación** — ¿MFA en tu email principal?, ¿MFA en redes sociales?, ¿sabés cuántas cuentas tenés?, ¿revisaste accesos de apps de terceros a Google/Facebook?
3. **Contraseñas** — ¿usás gestor de contraseñas?, ¿reutilizás contraseñas entre servicios importantes?, ¿tus contraseñas principales tienen +12 caracteres?, ¿cambiaste la del email en el último año?
4. **Redes Sociales** — ¿tu perfil principal es público?, ¿publicás fotos con frente de tu casa/patente/ubicación en vivo?, ¿se ve dónde trabajás/estudiás?, ¿geolocalización activada en publicaciones?
5. **Dispositivos** — ¿PIN/biometría en todos tus dispositivos?, ¿cifrado de disco activado?, ¿sistemas operativos actualizados?, ¿antivirus activo?
6. **Red Doméstica** — ¿router en WPA3/WPA2 (no WEP/abierta)?, ¿cambiaste la contraseña por defecto del router?, ¿WPS desactivado?, ¿IoT en red separada?
7. **Ingeniería Social** — ¿publicás tu fecha de nacimiento completa?, ¿tus respuestas de seguridad (mascota, escuela) son deducibles de tus redes?, ¿compartís datos de familiares con info identificable?, ¿aceptás contactos desconocidos?

**Puntaje de riesgo global (0-100):** promedio ponderado sobre todos los puntos aplicables — Aprobado = 100%, Pendiente = 50%, Fallido = 0%, excluyendo "No aplica" del denominador. Claude interpreta ese número en el resumen (ej. "72/100 — nivel de exposición moderado, priorizar contraseñas y red doméstica").

## UI y componentes

- **Nuevo componente** `AgentAssessmentRunner.tsx`: formulario de una sola pantalla, las 7 categorías como secciones plegables (acordeón), cada pregunta como radio/select. Botón "Generar evaluación" que dispara el único `POST`.
- **Refactor compartido**: se extrae el bloque que hoy renderiza resultados dentro de `AgentScanRunner.tsx` (resumen + categorías + botón de descarga PDF, líneas ~195-228 actuales) a un componente `ScanResultsView.tsx`, reutilizado por ambos agentes. El auditor de dominios no cambia de comportamiento, solo delega el render de resultados a este componente compartido.
- **Endpoint de reporte PDF propio**: `POST /api/agents/[agent-id]/assessment/report`, archivo nuevo estructuralmente idéntico al del scan (~30 líneas: zod + llamada a `renderScanReportPdf`), en vez de compartir la ruta ya productiva del scan — cero riesgo para lo que ya está en producción. La lógica pesada de `report-pdf.tsx` ya es 100% compartida sin cambios.

## Registro del agente y tipo nuevo

- **Nuevo valor en el union `Agent.type`**: `"chat" | "form" | "link" | "scan" | "assessment"` (`src/lib/agents/types.ts`).
- **`AgentDetail.tsx`**: nuevo branch `if (agent.type === "assessment")` (mismo patrón que el branch de `"scan"`), que renderiza `AgentAssessmentRunner`.
- **`AgentCard.tsx`**: agregar `"assessment"` a la cadena de labels de la galería (ej. `"🕵️ Assessment"`) para que no caiga en el fallback genérico `"🔗 Link"`.
- **Corrección de deuda técnica (de paso)**: hoy `prisma/seed.ts` mantiene una copia manual de `SEED_AGENTS` que no está sincronizada con `src/content/agents.ts` (mismo contenido, duplicado a mano). Se corrige para que `prisma/seed.ts` importe `SEED_AGENTS` desde `src/content/agents.ts`, una sola fuente de verdad — reduce el riesgo de desincronización al seguir agregando agentes.
- **Alta del agente** (agregada en `src/content/agents.ts`, con `active: true` implícito):
  - `name`: "Evaluación de Seguridad Personal"
  - `slug`: `evaluacion-seguridad-personal`
  - `category`: `"productivo"`
  - `type`: `"assessment"`
  - `icon`: `"🕵️"`
  - `description`/`fullDescription`: a redactar en el plan, mismo tono que el resto del catálogo.

## Manejo de errores y privacidad

- Mismo patrón de errores que el scan: `400` si faltan respuestas requeridas, `500` genérico si falla la generación del resumen, sin exponer detalles internos.
- Las respuestas quedan asociadas al `userEmail` del usuario autenticado, igual nivel de exposición que `SecurityScanRun` hoy — no se agrega infraestructura nueva de privacidad porque no se introduce un patrón de datos distinto al ya existente.

## Testing

- Tests unitarios de `scoring.ts` cubriendo cada regla de puntaje por pregunta (igual patrón que `checks.test.ts`).
- Test del endpoint `assessment/run`: payload válido → `200` con `findings`/`summary`/`riskScore`; payload inválido (falta una categoría) → `400`.
- Test del endpoint `assessment/report`: mismo patrón que `scan/report` (200 PDF / 400 error).
- Verificación manual: completar el formulario en el navegador, confirmar que los resultados se ven igual que el auditor de dominios, descargar el PDF.

## Fuera de alcance (para después)

- Niveles 3 (correos), 5 (filtraciones/breach-check automático), 9-12 y 14 de la referencia del usuario.
- Historial de evaluaciones pasadas / comparación en el tiempo (mencionado por el usuario como posible "monitoreo cada 6 meses").
- Validación runtime (zod/enum) sobre `Agent.type` en general — gap preexistente, no introducido por esta feature.
