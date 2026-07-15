# Búsqueda automática de exposición (Identidad Digital) — Personal Security Assessment

**Fecha:** 2026-07-15
**Estado:** Aprobado por el usuario

## Contexto

El agente "Evaluación de Seguridad Personal" (`type: "assessment"`) hoy es un cuestionario 100% autorreportado: 28 preguntas cerradas en 7 categorías, puntuadas de forma determinística en código (`src/lib/agents/assessment/scoring.ts`), con un resumen ejecutivo escrito por Claude a partir del resultado ya calculado (`src/lib/agents/assessment/orchestrator.ts`). El usuario quiere que, para la categoría **Identidad Digital**, el agente pueda además *hacer* la búsqueda por la persona en vez de solo preguntarle si la hizo — replicando el "Nivel 1" de su referencia original ("¿qué tanto puede averiguar alguien sobre mí en 10 minutos?").

De las 7 categorías, solo Identidad Digital tiene información genuinamente pública/buscable (nombre, teléfono, DNI, perfiles viejos). Las otras 6 son hábitos o configuraciones privadas (contraseñas, MFA, dispositivos, red doméstica) sin nada externo que buscar — quedan fuera de este alcance y se abordarán después con preguntas de seguimiento y recomendaciones más ricas, no con búsquedas.

## Alcance

**Incluye:** una sección opcional al final de la categoría Identidad Digital donde el usuario puede dar su nombre completo, teléfono y DNI (los tres opcionales) más un checkbox de consentimiento explícito. Si los completa, el agente busca en internet la exposición pública de esos datos y usa el resultado real para puntuar 3 de las 4 preguntas de la categoría (`identidadBuscasteNombre`, `identidadDatosIndexados`, `identidadPerfilesViejos`). Si no los completa, esas 3 preguntas siguen puntuando como hoy (autorreporte determinístico).

**Fuera de alcance:** `identidadUsuarioRepetido` (la 4ta pregunta de la categoría) sigue siendo siempre autorreporte — no es verificable por búsqueda sin conocer el handle exacto. Las otras 6 categorías no se tocan en esta feature. Breach-check de contraseñas (email en filtraciones conocidas, "Nivel 5" de la referencia original) queda para una feature separada — usa un mecanismo distinto (una API de filtraciones, no búsqueda web) y no se diseña acá.

## Arquitectura y flujo de datos

- **Dos llamadas a Claude**, mismo patrón ya probado en `src/lib/agents/scan/orchestrator.ts` (el auditor de dominios):
  1. **Llamada de búsqueda**: `client.messages.create` con el tool server-side `web_search_20260209` habilitado (`max_uses` acotado, ej. 5). Claude busca por su cuenta — no hay ejecución de tools de nuestro lado — y devuelve hallazgos en texto libre sobre la exposición pública del nombre/teléfono/DNI provistos.
  2. **Llamada de estructuración**: `client.messages.create` sin tools, con `output_config.format` de tipo `json_schema`, que traduce los hallazgos de la llamada 1 en los 3 `ScanPoint` de `identidadBuscasteNombre` / `identidadDatosIndexados` / `identidadPerfilesViejos` (con `estado`/`severity`/`evidence`/`recommendation` reales, decididos por Claude en base al hallazgo — única excepción explícita al principio general de "Claude nunca decide el estado" de esta feature, acotada a estos 3 puntos y solo cuando el usuario optó por la búsqueda).
- Estos 3 `ScanPoint` **reemplazan** a los que `scoring.ts` calcularía por autorreporte para esa corrida específica; el resto de los 25 puntos (incluyendo `identidadUsuarioRepetido`) sale de `scoring.ts` sin cambios.
- `computeRiskScore` no cambia — sigue siendo el mismo promedio ponderado sobre todos los `ScanPoint`, sin importar si vinieron de autorreporte o de búsqueda.
- Si el usuario no completa los campos opcionales o no tilda el consentimiento, no se hace ninguna llamada de búsqueda — el flujo es idéntico al actual.

## Privacidad

- **Nombre, teléfono y DNI nunca se persisten.** Viajan en el body del request al endpoint, se usan en memoria para la búsqueda, y se descartan antes de escribir en `PersonalAssessmentRun` — `answers` en la base sigue conteniendo únicamente las 28 respuestas cerradas de siempre.
- El prompt de la llamada de estructuración instruye explícitamente a no reproducir el dato sensible crudo en `evidence` (ej. no imprimir la dirección o el DNI encontrado tal cual) — describir el hallazgo en general ("se encontró tu dirección publicada en un sitio público") en vez de citarlo. Esto evita que el dato sensible crudo termine en `findings`, que sí se persiste.
- Checkbox de consentimiento obligatorio antes de que los campos se usen: *"Confirmo que estos son mis propios datos, autorizo la búsqueda pública en internet, y entiendo que se envían a un servicio de búsqueda de terceros para generar el resultado. No se guardan mi nombre, teléfono ni DNI."*

## UI

- Dentro de `AgentAssessmentRunner.tsx`, después de renderizar las 4 preguntas de la categoría "Identidad Digital" (y antes de pasar a "Cuentas y Autenticación"), un bloque colapsable/opcional con:
  - Campo de texto: nombre completo (opcional)
  - Campo de texto: teléfono (opcional)
  - Campo de texto: DNI (opcional)
  - Checkbox de consentimiento (obligatorio si se completó algún campo, para que se use la búsqueda)
- Estos campos NO forman parte de `ASSESSMENT_CATEGORIES` (que asume preguntas de opción cerrada) — se manejan como estado separado en el componente, específico de esta categoría.
- El botón "Generar evaluación" sigue habilitándose cuando las 28 preguntas cerradas están respondidas, independientemente de si se completó la sección opcional de búsqueda.

## Costo y límites

Cada corrida con búsqueda activada cuesta más (la llamada con `web_search` factura por búsqueda además de tokens, sumado a la segunda llamada de estructuración). Se mantiene el rate limit actual de 10 evaluaciones/24h por `userEmail` sin agregar un límite separado para el camino con búsqueda — a revisar si el costo real resulta significativo una vez en producción.

## Testing

- Tests unitarios de la lógica que decide cuándo activar la búsqueda (campos completos + consentimiento tildado) vs. cuándo usar el resultado determinístico de `scoring.ts` sin cambios.
- Test del endpoint `assessment/run` verificando que, cuando se envían nombre/teléfono/DNI, esos campos NO terminan en el objeto que se persiste en `prisma.personalAssessmentRun.create`.
- La llamada real a `web_search` (como el resto de las llamadas a Claude en este proyecto) no se testea con un mock de red — se sigue el mismo criterio ya usado para `src/lib/agents/scan/orchestrator.ts` y `src/lib/agents/assessment/orchestrator.ts`: sin test unitario, verificación manual end-to-end.

## Fuera de alcance (para después)

- Preguntas de seguimiento + recomendaciones más ricas para las otras 4 categorías de hábitos (Cuentas, Redes Sociales, Dispositivos, Red Doméstica).
- Breach-check de contraseñas contra el email (Nivel 5 de la referencia original) — mecanismo distinto, API externa separada.
- Búsqueda para `identidadUsuarioRepetido` a partir de un handle/usuario específico.
