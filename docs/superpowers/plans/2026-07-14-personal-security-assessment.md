# Agente "Evaluación de Seguridad Personal" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un nuevo agente "Evaluación de Seguridad Personal" (tipo `assessment`): un cuestionario guiado de 7 categorías/28 preguntas cerradas que produce un resultado con el mismo formato visual (categorías + tags de estado + PDF) que el Auditor de Seguridad con IA.

**Architecture:** Sin SSE — un formulario único se envía una vez a `POST /api/agents/[agent-id]/assessment/run`, que valida las respuestas con zod, calcula el resultado 100% determinísticamente en TypeScript (`scoring.ts`, mismo patrón que `checks.ts` del scan de dominios), y llama a Claude una sola vez para escribir el resumen ejecutivo interpretando el puntaje de riesgo. Reutiliza sin cambios el modelo de datos (`ScanPoint`/`CategoryCheckResult`/`ScanEstado`) y el generador de PDF ya existentes. Se extrae un componente `ScanResultsView` compartido entre el auditor de dominios y el nuevo agente para no duplicar la UI de resultados.

**Tech Stack:** Next.js 16 App Router, Prisma, zod, Anthropic SDK, Vitest, React 19, TypeScript.

## Global Constraints

- Sin SSE: un solo request/response por evaluación (no hay checks de red que tarden, todo es instantáneo salvo la llamada final a Claude).
- Scoring 100% determinístico en código (`scoring.ts`); Claude solo escribe el `summary` a partir del resultado ya calculado — nunca decide `estado`/`severity`.
- No se modifica `ScanPoint`/`CategoryCheckResult`/`ScanEstado` en `@/lib/agents/types.ts` — se reutilizan tal cual.
- No se modifica ni se comparte el endpoint `POST /api/agents/[agent-id]/scan/report` (ya productivo) — se crea un endpoint de reporte nuevo y separado para este agente.
- Rate limit del nuevo endpoint: **10 evaluaciones por `userEmail` cada 24h** (vs. 3/24h del scan de dominios, porque no hay carga de red real).
- Alta del agente: `name: "Evaluación de Seguridad Personal"`, `slug: "evaluacion-seguridad-personal"`, `category: "productivo"`, `type: "assessment"`, `icon: "🕵️"`.
- Puntaje de riesgo global: `Math.round((Σ peso_por_punto / total_puntos_aplicables) * 100)`, con pesos `Aprobado=1, Pendiente=0.5, Fallido=0`, excluyendo puntos en estado `"No aplica"` del total. Si no hay puntos aplicables, el puntaje es 100.
- Estilo de código: sin punto y coma, comillas dobles (igual que `src/lib/agents/types.ts`, `src/lib/agents/scan/checks.ts`, `src/lib/agents/scan/orchestrator.ts`).
- Cambios a `prisma/schema.prisma` no requieren migración local (el `DATABASE_URL` local es SQLite pero el schema es PostgreSQL — solo `prisma generate` funciona localmente; la tabla se crea sola en el próximo deploy a Vercel vía el `postinstall` que corre `prisma db push`).

---

## File Structure

- **Modify:** `src/lib/agents/types.ts` — agrega `AssessmentAnswers` (28 campos) y extiende `Agent.type` con `"assessment"`.
- **Modify:** `prisma/schema.prisma` — agrega el modelo `PersonalAssessmentRun`.
- **Create:** `src/lib/agents/assessment/scoring.ts` + `scoring.test.ts` — motor de scoring determinístico.
- **Create:** `src/lib/agents/assessment/questions.ts` — metadata de las 28 preguntas para la UI.
- **Create:** `src/lib/agents/assessment/orchestrator.ts` — llama a `scoring.ts` + una llamada a Claude para el resumen.
- **Create:** `src/app/api/agents/[agent-id]/assessment/run/route.ts` + `route.test.ts` — endpoint principal.
- **Create:** `src/app/api/agents/[agent-id]/assessment/report/route.ts` + `route.test.ts` — endpoint de descarga de PDF (duplicado estructural del de scan).
- **Create:** `src/components/sections/ScanResultsView.tsx` — vista de resultados compartida (extraída de `AgentScanRunner.tsx`).
- **Modify:** `src/components/sections/AgentScanRunner.tsx` — usa `ScanResultsView` en vez de JSX inline.
- **Create:** `src/components/sections/AgentAssessmentRunner.tsx` — formulario de cuestionario + resultados.
- **Modify:** `src/components/sections/AgentDetail.tsx` — nuevo branch para `type === "assessment"`.
- **Modify:** `src/components/sections/AgentCard.tsx` — nueva etiqueta de galería para `"assessment"`.
- **Modify:** `prisma/seed.ts` — importa `SEED_AGENTS` desde `src/content/agents.ts` en vez de duplicarlo.
- **Modify:** `src/content/agents.ts` — agrega la entrada del nuevo agente.

---

### Task 1: Tipos y schema de Prisma

**Files:**
- Modify: `src/lib/agents/types.ts`
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `AssessmentAnswers` (28 campos, tipos unión literal) y `Agent.type` extendido con `"assessment"` — consumidos por todas las tasks siguientes. Modelo Prisma `PersonalAssessmentRun` — consumido por Task 5/6.

- [ ] **Step 1: Extender `Agent.type` y agregar `AssessmentAnswers`**

En `src/lib/agents/types.ts`, reemplazar la línea:

```ts
  type: "chat" | "form" | "link" | "scan"
```

por:

```ts
  type: "chat" | "form" | "link" | "scan" | "assessment"
```

Y agregar al final del archivo:

```ts

export interface AssessmentAnswers {
  identidadBuscasteNombre: "si" | "no"
  identidadDatosIndexados: "si" | "no" | "no_se"
  identidadPerfilesViejos: "si" | "no" | "no_se"
  identidadUsuarioRepetido: "si" | "no"

  cuentasMfaEmail: "si" | "no"
  cuentasMfaRedes: "si" | "no" | "parcial"
  cuentasCantidad: "menos_20" | "20_80" | "mas_80" | "no_se"
  cuentasRevisoTerceros: "si" | "no"

  passwordsGestor: "si" | "no"
  passwordsReutiliza: "si" | "no" | "no_se"
  passwordsLargas: "si" | "no" | "no_se"
  passwordsCambioEmail: "si" | "no" | "no_se"

  redesPerfilPublico: "si" | "no" | "mixto"
  redesFotosSensibles: "si" | "no" | "a_veces"
  redesMuestraTrabajo: "si" | "no"
  redesGeolocalizacion: "si" | "no" | "no_se"

  dispositivosBloqueo: "todos" | "algunos" | "ninguno"
  dispositivosCifrado: "si" | "no" | "no_se"
  dispositivosActualizados: "si" | "no" | "no_se"
  dispositivosAntivirus: "si" | "no" | "no_aplica"

  redRouterProtocolo: "wpa3" | "wpa2" | "wep_o_abierta" | "no_se"
  redPasswordDefault: "si" | "no" | "no_se"
  redWpsDesactivado: "si" | "no" | "no_se"
  redIotSeparada: "si" | "no" | "no_tiene_iot"

  ingSocialFechaNacimiento: "si" | "no"
  ingSocialPreguntasSeguridad: "si" | "no" | "no_se"
  ingSocialDatosFamiliares: "si" | "no"
  ingSocialContactosDesconocidos: "si" | "no" | "a_veces"
}
```

- [ ] **Step 2: Agregar el modelo Prisma**

En `prisma/schema.prisma`, actualizar el comentario de `Agent.type` (línea 55):

```prisma
  type            String   // "chat" | "form" | "link" | "scan" | "assessment"
```

Y agregar, después del modelo `SecurityScanRun`:

```prisma

model PersonalAssessmentRun {
  id        String   @id @default(cuid())
  agentId   String
  userEmail String
  answers   Json
  status    String   @default("running") // "running" | "completed" | "failed"
  findings  Json?
  summary   String?
  riskScore Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([agentId])
  @@index([userEmail])
  @@index([createdAt])
}
```

- [ ] **Step 3: Regenerar el cliente de Prisma**

Run: `npx prisma generate`
Expected: termina sin errores; `@prisma/client` ahora expone `prisma.personalAssessmentRun`. **No** correr `prisma db push` ni `prisma migrate` localmente (el `DATABASE_URL` local es SQLite, el schema es PostgreSQL — ver Global Constraints).

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/lib/agents/types.ts prisma/schema.prisma
git commit -m "feat: add AssessmentAnswers type and PersonalAssessmentRun model"
```

---

### Task 2: Motor de scoring determinístico

**Files:**
- Create: `src/lib/agents/assessment/scoring.ts`
- Test: `src/lib/agents/assessment/scoring.test.ts`

**Interfaces:**
- Consumes: `AssessmentAnswers`, `CategoryCheckResult`, `ScanPoint` de `@/lib/agents/types` (Task 1).
- Produces: `export function scoreAssessment(answers: AssessmentAnswers): CategoryCheckResult[]` y `export function computeRiskScore(findings: CategoryCheckResult[]): number` — usados por Task 4 (orchestrator).

- [ ] **Step 1: Escribir el test (falla porque el archivo no existe)**

Crear `src/lib/agents/assessment/scoring.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { scoreAssessment, computeRiskScore } from "./scoring"
import type { AssessmentAnswers } from "@/lib/agents/types"

const bestCaseAnswers: AssessmentAnswers = {
  identidadBuscasteNombre: "si",
  identidadDatosIndexados: "no",
  identidadPerfilesViejos: "no",
  identidadUsuarioRepetido: "no",
  cuentasMfaEmail: "si",
  cuentasMfaRedes: "si",
  cuentasCantidad: "20_80",
  cuentasRevisoTerceros: "si",
  passwordsGestor: "si",
  passwordsReutiliza: "no",
  passwordsLargas: "si",
  passwordsCambioEmail: "si",
  redesPerfilPublico: "no",
  redesFotosSensibles: "no",
  redesMuestraTrabajo: "no",
  redesGeolocalizacion: "no",
  dispositivosBloqueo: "todos",
  dispositivosCifrado: "si",
  dispositivosActualizados: "si",
  dispositivosAntivirus: "si",
  redRouterProtocolo: "wpa3",
  redPasswordDefault: "si",
  redWpsDesactivado: "si",
  redIotSeparada: "no_tiene_iot",
  ingSocialFechaNacimiento: "no",
  ingSocialPreguntasSeguridad: "no",
  ingSocialDatosFamiliares: "no",
  ingSocialContactosDesconocidos: "no",
}

const worstCaseAnswers: AssessmentAnswers = {
  identidadBuscasteNombre: "no",
  identidadDatosIndexados: "si",
  identidadPerfilesViejos: "si",
  identidadUsuarioRepetido: "si",
  cuentasMfaEmail: "no",
  cuentasMfaRedes: "no",
  cuentasCantidad: "no_se",
  cuentasRevisoTerceros: "no",
  passwordsGestor: "no",
  passwordsReutiliza: "si",
  passwordsLargas: "no",
  passwordsCambioEmail: "no",
  redesPerfilPublico: "si",
  redesFotosSensibles: "si",
  redesMuestraTrabajo: "si",
  redesGeolocalizacion: "si",
  dispositivosBloqueo: "ninguno",
  dispositivosCifrado: "no",
  dispositivosActualizados: "no",
  dispositivosAntivirus: "no",
  redRouterProtocolo: "wep_o_abierta",
  redPasswordDefault: "no",
  redWpsDesactivado: "no",
  redIotSeparada: "si",
  ingSocialFechaNacimiento: "si",
  ingSocialPreguntasSeguridad: "si",
  ingSocialDatosFamiliares: "si",
  ingSocialContactosDesconocidos: "si",
}

describe("scoreAssessment", () => {
  it("returns exactly 7 categories", () => {
    const result = scoreAssessment(bestCaseAnswers)
    expect(result).toHaveLength(7)
    expect(result.map((c) => c.category)).toEqual([
      "Identidad Digital",
      "Cuentas y Autenticación",
      "Contraseñas",
      "Redes Sociales",
      "Dispositivos",
      "Red Doméstica",
      "Ingeniería Social",
    ])
  })

  it("marks every point as Aprobado for the best-case answers (excluding No aplica)", () => {
    const result = scoreAssessment(bestCaseAnswers)
    const points = result.flatMap((c) => c.points)
    expect(points.some((p) => p.estado === "Fallido")).toBe(false)
    expect(points.every((p) => p.estado === "Aprobado" || p.estado === "No aplica")).toBe(true)
  })

  it("marks MFA de email as Fallido/Alto when disabled", () => {
    const result = scoreAssessment(worstCaseAnswers)
    const point = result
      .find((c) => c.category === "Cuentas y Autenticación")!
      .points.find((p) => p.point.includes("MFA") && p.point.includes("email"))
    expect(point?.estado).toBe("Fallido")
    expect(point?.severity).toBe("Alto")
  })

  it("marks reutilización de contraseñas as Fallido/Alto", () => {
    const result = scoreAssessment(worstCaseAnswers)
    const point = result
      .find((c) => c.category === "Contraseñas")!
      .points.find((p) => p.point.includes("Reutil"))
    expect(point?.estado).toBe("Fallido")
    expect(point?.severity).toBe("Alto")
  })

  it("marks router en WEP/abierta como Fallido/Alto", () => {
    const result = scoreAssessment(worstCaseAnswers)
    const point = result
      .find((c) => c.category === "Red Doméstica")!
      .points.find((p) => p.point.includes("protocolo de seguridad"))
    expect(point?.estado).toBe("Fallido")
    expect(point?.severity).toBe("Alto")
  })

  it("marks antivirus como No aplica cuando corresponde", () => {
    const answers = { ...bestCaseAnswers, dispositivosAntivirus: "no_aplica" as const }
    const result = scoreAssessment(answers)
    const point = result
      .find((c) => c.category === "Dispositivos")!
      .points.find((p) => p.point.includes("Antivirus"))
    expect(point?.estado).toBe("No aplica")
  })

  it("marks IoT como No aplica cuando no tiene dispositivos IoT", () => {
    const result = scoreAssessment(bestCaseAnswers)
    const point = result
      .find((c) => c.category === "Red Doméstica")!
      .points.find((p) => p.point.includes("IoT"))
    expect(point?.estado).toBe("No aplica")
  })

  it("marks respuesta 'no_se'/'parcial'/'a_veces' como Pendiente, nunca Fallido ni Aprobado directo", () => {
    const answers: AssessmentAnswers = {
      ...bestCaseAnswers,
      identidadDatosIndexados: "no_se",
      cuentasMfaRedes: "parcial",
      redesFotosSensibles: "a_veces",
    }
    const result = scoreAssessment(answers)
    const points = result.flatMap((c) => c.points)
    const datosIndexados = points.find((p) => p.point.includes("Datos personales sensibles"))
    const mfaRedes = points.find((p) => p.point.includes("MFA") && p.point.includes("redes"))
    const fotos = points.find((p) => p.point.includes("frente de tu casa") || p.point.includes("ubicación"))
    expect(datosIndexados?.estado).toBe("Pendiente")
    expect(mfaRedes?.estado).toBe("Pendiente")
    expect(fotos?.estado).toBe("Pendiente")
  })
})

describe("computeRiskScore", () => {
  it("returns 100 when every applicable point is Aprobado", () => {
    const findings = scoreAssessment(bestCaseAnswers)
    expect(computeRiskScore(findings)).toBe(100)
  })

  it("returns 0 when every applicable point is Fallido", () => {
    const findings = [
      {
        category: "Test",
        points: [
          { point: "a", result: "", severity: "", evidence: "", recommendation: "", estado: "Fallido" as const },
          { point: "b", result: "", severity: "", evidence: "", recommendation: "", estado: "Fallido" as const },
        ],
      },
    ]
    expect(computeRiskScore(findings)).toBe(0)
  })

  it("excludes No aplica points from the denominator", () => {
    const findings = [
      {
        category: "Test",
        points: [
          { point: "a", result: "", severity: "", evidence: "", recommendation: "", estado: "Aprobado" as const },
          { point: "b", result: "", severity: "", evidence: "", recommendation: "", estado: "No aplica" as const },
        ],
      },
    ]
    expect(computeRiskScore(findings)).toBe(100)
  })

  it("weighs Pendiente as half of Aprobado", () => {
    const findings = [
      {
        category: "Test",
        points: [
          { point: "a", result: "", severity: "", evidence: "", recommendation: "", estado: "Aprobado" as const },
          { point: "b", result: "", severity: "", evidence: "", recommendation: "", estado: "Pendiente" as const },
        ],
      },
    ]
    expect(computeRiskScore(findings)).toBe(75)
  })
})
```

- [ ] **Step 2: Correr el test para confirmar que falla**

Run: `npx vitest run src/lib/agents/assessment/scoring.test.ts`
Expected: FAIL — `Cannot find module './scoring'`.

- [ ] **Step 3: Implementar `scoring.ts`**

Crear `src/lib/agents/assessment/scoring.ts`:

```ts
import type { AssessmentAnswers, CategoryCheckResult, ScanPoint } from "@/lib/agents/types"

function point(
  p: string,
  result: string,
  severity: string,
  evidence: string,
  recommendation: string,
  estado: ScanPoint["estado"]
): ScanPoint {
  return { point: p, result, severity, evidence, recommendation, estado }
}

function scoreIdentidadDigital(a: AssessmentAnswers): CategoryCheckResult {
  const points: ScanPoint[] = [
    a.identidadBuscasteNombre === "si"
      ? point("Revisaste qué información pública existe sobre vos", "Sí", "OK", "Ya revisaste manualmente qué aparece sobre vos buscando tu nombre en Google", "Repetilo cada 6 meses", "Aprobado")
      : point("Revisaste qué información pública existe sobre vos", "No", "Bajo", "Nunca revisaste qué información pública existe sobre vos", "Buscá tu nombre completo entre comillas en Google y revisá los primeros resultados", "Pendiente"),

    a.identidadDatosIndexados === "si"
      ? point("Datos personales sensibles (teléfono/DNI/dirección) indexados", "Sí, aparecen indexados", "Alto", "Tenés datos personales sensibles indexados públicamente en buscadores", "Pedí la desindexación vía el formulario de eliminación de Google y contactá al sitio que publica el dato", "Fallido")
      : a.identidadDatosIndexados === "no"
      ? point("Datos personales sensibles (teléfono/DNI/dirección) indexados", "No se detectaron", "OK", "No se detectaron datos sensibles indexados, según tu propia revisión", "Repetir la revisión periódicamente", "Aprobado")
      : point("Datos personales sensibles (teléfono/DNI/dirección) indexados", "No lo revisaste", "Medio", "No revisaste todavía si tu teléfono, DNI o dirección aparecen indexados", "Buscá tu teléfono y DNI entre comillas en Google", "Pendiente"),

    a.identidadPerfilesViejos === "si"
      ? point("Perfiles abandonados que siguen activos/públicos", "Sí, hay perfiles abandonados", "Medio", "Hay perfiles en redes que ya no usás pero siguen activos o públicos", "Cerrá o eliminá las cuentas que ya no usás", "Fallido")
      : a.identidadPerfilesViejos === "no"
      ? point("Perfiles abandonados que siguen activos/públicos", "No hay perfiles abandonados", "OK", "No hay perfiles abandonados detectados", "Sin acción requerida", "Aprobado")
      : point("Perfiles abandonados que siguen activos/públicos", "No lo revisaste", "Bajo", "No revisaste si tenés cuentas viejas activas", "Buscá tu email/usuario para encontrar cuentas olvidadas", "Pendiente"),

    a.identidadUsuarioRepetido === "si"
      ? point("Mismo usuario/handle reutilizado entre servicios", "Sí, reutilizás el mismo handle", "Bajo", "El mismo handle en varios servicios facilita correlacionar tus cuentas entre sí", "Considerá usar handles distintos en servicios sensibles", "Pendiente")
      : point("Mismo usuario/handle reutilizado entre servicios", "No, usás handles distintos", "OK", "Usás handles distintos, dificulta la correlación de tus cuentas", "Sin acción requerida", "Aprobado"),
  ]

  return { category: "Identidad Digital", points }
}

function scoreCuentasAutenticacion(a: AssessmentAnswers): CategoryCheckResult {
  const points: ScanPoint[] = [
    a.cuentasMfaEmail === "si"
      ? point("MFA activado en el email principal", "Sí", "OK", "MFA activo en tu email principal", "Sin acción requerida", "Aprobado")
      : point("MFA activado en el email principal", "No", "Alto", "El correo es la llave maestra de casi todas tus otras cuentas y no tiene doble factor", "Activá MFA en tu email principal ahora mismo (preferentemente con app autenticadora, no SMS)", "Fallido"),

    a.cuentasMfaRedes === "si"
      ? point("MFA activado en redes sociales", "Sí, en todas", "OK", "MFA activo en tus redes sociales principales", "Sin acción requerida", "Aprobado")
      : a.cuentasMfaRedes === "parcial"
      ? point("MFA activado en redes sociales", "Solo en algunas", "Medio", "MFA activo solo en algunas de tus redes sociales", "Activá MFA en las redes que te falten", "Pendiente")
      : point("MFA activado en redes sociales", "No, en ninguna", "Alto", "Ninguna red social tiene doble factor activado", "Activá MFA en cada red social, empezando por la que más usás", "Fallido"),

    a.cuentasCantidad === "no_se"
      ? point("Noción del tamaño de tu superficie de cuentas", "No sabés cuántas cuentas tenés", "Bajo", "No tenés un inventario de tus cuentas, dificulta evaluar tu superficie de exposición", "Hacé un inventario de tus cuentas con un gestor de contraseñas", "Pendiente")
      : point("Noción del tamaño de tu superficie de cuentas", "Tenés una estimación", "OK", "Tenés noción aproximada de cuántas cuentas online tenés", "Mantené el inventario actualizado", "Aprobado"),

    a.cuentasRevisoTerceros === "si"
      ? point("Revisión de accesos de apps de terceros", "Sí", "OK", "Revisaste los accesos de terceros a tus cuentas principales", "Repetilo cada 6 meses y revocá lo que no uses", "Aprobado")
      : point("Revisión de accesos de apps de terceros", "No", "Bajo", "Nunca revisaste qué apps de terceros tienen acceso a tus cuentas", "Revisá los permisos conectados en la configuración de seguridad de Google/Facebook", "Pendiente"),
  ]

  return { category: "Cuentas y Autenticación", points }
}

function scoreContrasenas(a: AssessmentAnswers): CategoryCheckResult {
  const points: ScanPoint[] = [
    a.passwordsGestor === "si"
      ? point("Uso de gestor de contraseñas", "Sí", "OK", "Usás un gestor de contraseñas", "Sin acción requerida", "Aprobado")
      : point("Uso de gestor de contraseñas", "No", "Medio", "No usás un gestor de contraseñas, dificulta tener contraseñas únicas y largas", "Instalá un gestor de contraseñas (ej. Bitwarden, 1Password) y migrá tus cuentas principales", "Pendiente"),

    a.passwordsReutiliza === "si"
      ? point("Reutilización de contraseñas entre servicios importantes", "Sí, reutilizás", "Alto", "Reutilizás contraseñas entre servicios importantes: si uno se filtra, todos quedan expuestos", "Generá contraseñas únicas para cada servicio, empezando por email y banco", "Fallido")
      : a.passwordsReutiliza === "no"
      ? point("Reutilización de contraseñas entre servicios importantes", "No reutilizás", "OK", "No reutilizás contraseñas entre servicios importantes", "Sin acción requerida", "Aprobado")
      : point("Reutilización de contraseñas entre servicios importantes", "No estás seguro", "Medio", "No estás seguro si reutilizás contraseñas", "Revisá tus contraseñas principales y confirmá que sean únicas", "Pendiente"),

    a.passwordsLargas === "si"
      ? point("Contraseñas principales de más de 12 caracteres", "Sí", "OK", "Tus contraseñas principales son suficientemente largas", "Sin acción requerida", "Aprobado")
      : a.passwordsLargas === "no"
      ? point("Contraseñas principales de más de 12 caracteres", "No", "Medio", "Contraseñas cortas son más fáciles de forzar por fuerza bruta", "Usá contraseñas de al menos 16 caracteres o frases largas", "Fallido")
      : point("Contraseñas principales de más de 12 caracteres", "No lo revisaste", "Bajo", "No revisaste la longitud de tus contraseñas principales", "Revisá y actualizá tus contraseñas principales", "Pendiente"),

    a.passwordsCambioEmail === "si"
      ? point("Rotación de la contraseña del email en el último año", "Sí", "OK", "Rotaste la contraseña de tu email en el último año", "Sin acción requerida", "Aprobado")
      : point("Rotación de la contraseña del email en el último año", a.passwordsCambioEmail === "no" ? "No" : "No lo recordás", "Bajo", "No cambiaste (o no recordás haber cambiado) la contraseña de tu email en el último año", "Considerá rotarla, especialmente si la usás en muchos lugares", "Pendiente"),
  ]

  return { category: "Contraseñas", points }
}

function scoreRedesSociales(a: AssessmentAnswers): CategoryCheckResult {
  const points: ScanPoint[] = [
    a.redesPerfilPublico === "no"
      ? point("Perfil principal en privado", "Privado", "OK", "Tu perfil principal es privado", "Sin acción requerida", "Aprobado")
      : a.redesPerfilPublico === "mixto"
      ? point("Perfil principal en privado", "Mixto", "Medio", "Algunos de tus perfiles son públicos y otros privados", "Revisá la configuración de privacidad de cada red", "Pendiente")
      : point("Perfil principal en privado", "Público", "Medio", "Tu perfil principal es público: cualquiera puede ver tu actividad", "Considerá poner el perfil en privado o revisar qué se ve sin login", "Fallido"),

    a.redesFotosSensibles === "no"
      ? point("Fotos que revelan domicilio, patente o ubicación en vivo", "No", "OK", "No publicás contenido que revele tu ubicación", "Sin acción requerida", "Aprobado")
      : a.redesFotosSensibles === "a_veces"
      ? point("Fotos que revelan domicilio, patente o ubicación en vivo", "A veces", "Medio", "A veces publicás contenido que revela tu ubicación", "Revisá tus publicaciones recientes y evitá esos detalles a futuro", "Pendiente")
      : point("Fotos que revelan domicilio, patente o ubicación en vivo", "Sí", "Alto", "Publicás contenido que revela dónde vivís o tu ubicación en tiempo real", "Evitá publicar el frente de tu casa, patente o ubicación en vivo; revisá metadatos EXIF de fotos", "Fallido"),

    a.redesMuestraTrabajo === "no"
      ? point("Perfil revela dónde trabajás/estudiás", "No", "OK", "Tu perfil no revela dónde trabajás o estudiás", "Sin acción requerida", "Aprobado")
      : point("Perfil revela dónde trabajás/estudiás", "Sí", "Bajo", "Tu perfil revela dónde trabajás o estudiás, útil para ingeniería social dirigida", "Evaluá si necesitás mostrar esa información públicamente", "Pendiente"),

    a.redesGeolocalizacion === "no"
      ? point("Geolocalización activada en publicaciones", "Desactivada", "OK", "Geolocalización desactivada en publicaciones", "Sin acción requerida", "Aprobado")
      : a.redesGeolocalizacion === "no_se"
      ? point("Geolocalización activada en publicaciones", "No lo revisaste", "Bajo", "No revisaste la configuración de geolocalización", "Revisá la configuración de privacidad/ubicación de cada red", "Pendiente")
      : point("Geolocalización activada en publicaciones", "Activada", "Medio", "La geolocalización en publicaciones revela tus movimientos y rutinas", "Desactivá la geolocalización automática en cada red social", "Fallido"),
  ]

  return { category: "Redes Sociales", points }
}

function scoreDispositivos(a: AssessmentAnswers): CategoryCheckResult {
  const points: ScanPoint[] = [
    a.dispositivosBloqueo === "todos"
      ? point("Bloqueo (PIN/biometría) en todos los dispositivos", "Todos protegidos", "OK", "Todos tus dispositivos principales están protegidos con bloqueo", "Sin acción requerida", "Aprobado")
      : a.dispositivosBloqueo === "algunos"
      ? point("Bloqueo (PIN/biometría) en todos los dispositivos", "Algunos protegidos", "Medio", "Algunos de tus dispositivos no tienen bloqueo configurado", "Activá PIN/biometría en los dispositivos que falten", "Pendiente")
      : point("Bloqueo (PIN/biometría) en todos los dispositivos", "Ninguno protegido", "Alto", "Ninguno de tus dispositivos principales tiene bloqueo", "Activá PIN, contraseña o biometría en todos tus dispositivos ahora", "Fallido"),

    a.dispositivosCifrado === "si"
      ? point("Cifrado de disco activado", "Sí", "OK", "Cifrado de disco activado", "Sin acción requerida", "Aprobado")
      : a.dispositivosCifrado === "no"
      ? point("Cifrado de disco activado", "No", "Medio", "Sin cifrado de disco, los datos son legibles si el dispositivo se pierde o roba", "Activá el cifrado de disco nativo de tu sistema operativo", "Fallido")
      : point("Cifrado de disco activado", "No lo sabés", "Bajo", "No sabés si tenés cifrado de disco activado", "Revisá la configuración de seguridad de tu dispositivo", "Pendiente"),

    a.dispositivosActualizados === "si"
      ? point("Sistemas operativos actualizados", "Sí", "OK", "Dispositivos actualizados", "Sin acción requerida", "Aprobado")
      : a.dispositivosActualizados === "no"
      ? point("Sistemas operativos actualizados", "No", "Medio", "Dispositivos desactualizados quedan expuestos a vulnerabilidades conocidas y ya parchadas", "Activá actualizaciones automáticas y aplicá las pendientes", "Fallido")
      : point("Sistemas operativos actualizados", "No lo revisaste", "Bajo", "No revisaste el estado de actualizaciones", "Revisá si hay actualizaciones pendientes en tus dispositivos", "Pendiente"),

    a.dispositivosAntivirus === "si"
      ? point("Antivirus/protección activa", "Sí", "OK", "Antivirus/protección activa", "Sin acción requerida", "Aprobado")
      : a.dispositivosAntivirus === "no"
      ? point("Antivirus/protección activa", "No", "Medio", "Sin antivirus ni protección activa en tu PC", "Activá Windows Defender (o equivalente) como mínimo", "Pendiente")
      : point("Antivirus/protección activa", "No aplica", "N/A", "No aplica (no usás Windows o no corresponde)", "Sin acción requerida", "No aplica"),
  ]

  return { category: "Dispositivos", points }
}

function scoreRedDomestica(a: AssessmentAnswers): CategoryCheckResult {
  const points: ScanPoint[] = [
    a.redRouterProtocolo === "wpa3"
      ? point("Router con protocolo de seguridad WiFi actualizado", "WPA3", "OK", "Router en WPA3", "Sin acción requerida", "Aprobado")
      : a.redRouterProtocolo === "wpa2"
      ? point("Router con protocolo de seguridad WiFi actualizado", "WPA2", "OK", "Router en WPA2 (aceptable)", "Considerá migrar a WPA3 si tu router lo soporta", "Aprobado")
      : a.redRouterProtocolo === "no_se"
      ? point("Router con protocolo de seguridad WiFi actualizado", "No lo revisaste", "Medio", "No revisaste el protocolo de seguridad de tu WiFi", "Entrá a la configuración del router y verificá el protocolo", "Pendiente")
      : point("Router con protocolo de seguridad WiFi actualizado", "WEP o sin contraseña", "Alto", "Red WiFi con protocolo obsoleto o sin contraseña", "Cambiá la configuración del router a WPA2 o WPA3 con contraseña fuerte de inmediato", "Fallido"),

    a.redPasswordDefault === "si"
      ? point("Contraseña del router distinta a la de fábrica", "Sí", "OK", "Contraseña del router cambiada", "Sin acción requerida", "Aprobado")
      : a.redPasswordDefault === "no"
      ? point("Contraseña del router distinta a la de fábrica", "No", "Alto", "El router sigue con la contraseña de fábrica, fácil de buscar online por marca/modelo", "Cambiá la contraseña de administración del router", "Fallido")
      : point("Contraseña del router distinta a la de fábrica", "No lo sabés", "Medio", "No sabés si cambiaste la contraseña del router", "Revisá la configuración del router", "Pendiente"),

    a.redWpsDesactivado === "si"
      ? point("WPS desactivado", "Sí", "OK", "WPS desactivado", "Sin acción requerida", "Aprobado")
      : a.redWpsDesactivado === "no"
      ? point("WPS desactivado", "No", "Medio", "WPS activo es un vector conocido de ataque por fuerza bruta al PIN", "Desactivá WPS en la configuración del router", "Pendiente")
      : point("WPS desactivado", "No lo revisaste", "Bajo", "No revisaste si WPS está activo", "Revisá la configuración del router", "Pendiente"),

    a.redIotSeparada === "si"
      ? point("Dispositivos IoT en red separada", "Sí", "OK", "IoT en red separada", "Sin acción requerida", "Aprobado")
      : a.redIotSeparada === "no"
      ? point("Dispositivos IoT en red separada", "No", "Medio", "Dispositivos IoT (a menudo menos seguros) comparten red con tus dispositivos principales", "Creá una red WiFi de invitados/IoT separada para esos dispositivos", "Fallido")
      : point("Dispositivos IoT en red separada", "No tenés IoT", "N/A", "No tenés dispositivos IoT", "Sin acción requerida", "No aplica"),
  ]

  return { category: "Red Doméstica", points }
}

function scoreIngenieriaSocial(a: AssessmentAnswers): CategoryCheckResult {
  const points: ScanPoint[] = [
    a.ingSocialFechaNacimiento === "no"
      ? point("Fecha de nacimiento completa pública", "No", "OK", "Fecha de nacimiento no expuesta públicamente", "Sin acción requerida", "Aprobado")
      : point("Fecha de nacimiento completa pública", "Sí", "Medio", "Tu fecha de nacimiento completa es pública, un dato usado en verificaciones de identidad", "Ocultá el año de nacimiento en tus perfiles públicos", "Pendiente"),

    a.ingSocialPreguntasSeguridad === "no"
      ? point("Preguntas de recuperación deducibles desde redes públicas", "No", "OK", "Preguntas de seguridad no deducibles públicamente", "Sin acción requerida", "Aprobado")
      : a.ingSocialPreguntasSeguridad === "no_se"
      ? point("Preguntas de recuperación deducibles desde redes públicas", "No lo evaluaste", "Medio", "No evaluaste todavía si tus preguntas de recuperación son deducibles", "Revisá qué información personal (mascotas, escuela, etc.) publicás y compará con tus preguntas de recuperación", "Pendiente")
      : point("Preguntas de recuperación deducibles desde redes públicas", "Sí", "Alto", "Tus preguntas de recuperación de cuenta son deducibles desde tus redes públicas", "Usá respuestas falsas/aleatorias guardadas en tu gestor de contraseñas para las preguntas de seguridad", "Fallido"),

    a.ingSocialDatosFamiliares === "no"
      ? point("Datos identificables de familiares directos compartidos públicamente", "No", "OK", "No compartís datos identificables de familiares públicamente", "Sin acción requerida", "Aprobado")
      : point("Datos identificables de familiares directos compartidos públicamente", "Sí", "Medio", "Compartís datos identificables de familiares directos públicamente", "Evaluá restringir esa información a solo contactos cercanos", "Pendiente"),

    a.ingSocialContactosDesconocidos === "no"
      ? point("Aceptación de contactos desconocidos", "No", "OK", "No aceptás contactos desconocidos", "Sin acción requerida", "Aprobado")
      : a.ingSocialContactosDesconocidos === "a_veces"
      ? point("Aceptación de contactos desconocidos", "A veces", "Bajo", "A veces aceptás contactos desconocidos", "Sé más selectivo con las solicitudes que aceptás", "Pendiente")
      : point("Aceptación de contactos desconocidos", "Sí", "Medio", "Aceptás contactos desconocidos, ampliando quién puede ver tu información y ejecutar ingeniería social", "Dejá de aceptar solicitudes de gente que no conocés en persona", "Fallido"),
  ]

  return { category: "Ingeniería Social", points }
}

export function scoreAssessment(answers: AssessmentAnswers): CategoryCheckResult[] {
  return [
    scoreIdentidadDigital(answers),
    scoreCuentasAutenticacion(answers),
    scoreContrasenas(answers),
    scoreRedesSociales(answers),
    scoreDispositivos(answers),
    scoreRedDomestica(answers),
    scoreIngenieriaSocial(answers),
  ]
}

export function computeRiskScore(findings: CategoryCheckResult[]): number {
  const applicable = findings.flatMap((f) => f.points).filter((p) => p.estado !== "No aplica")

  if (applicable.length === 0) return 100

  const weight: Record<string, number> = { Aprobado: 1, Pendiente: 0.5, Fallido: 0 }
  const sum = applicable.reduce((acc, p) => acc + (weight[p.estado] ?? 0), 0)

  return Math.round((sum / applicable.length) * 100)
}
```

- [ ] **Step 4: Correr el test para confirmar que pasa**

Run: `npx vitest run src/lib/agents/assessment/scoring.test.ts`
Expected: PASS (12 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/agents/assessment/scoring.ts src/lib/agents/assessment/scoring.test.ts
git commit -m "feat: add deterministic scoring engine for personal security assessment"
```

---

### Task 3: Metadata de preguntas para la UI

**Files:**
- Create: `src/lib/agents/assessment/questions.ts`

**Interfaces:**
- Consumes: `AssessmentAnswers` de `@/lib/agents/types` (Task 1), solo para tipar `id` de cada pregunta.
- Produces: `export const ASSESSMENT_CATEGORIES: AssessmentCategory[]` — usado por Task 8 (`AgentAssessmentRunner.tsx`).

- [ ] **Step 1: Crear `questions.ts`**

Crear `src/lib/agents/assessment/questions.ts`:

```ts
import type { AssessmentAnswers } from "@/lib/agents/types"

export interface AssessmentQuestion {
  id: keyof AssessmentAnswers
  label: string
  options: { value: string; label: string }[]
}

export interface AssessmentCategory {
  key: string
  label: string
  questions: AssessmentQuestion[]
}

const SI_NO = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
]

const SI_NO_NO_SE = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "no_se", label: "No sé" },
]

export const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
  {
    key: "identidad",
    label: "Identidad Digital",
    questions: [
      { id: "identidadBuscasteNombre", label: "¿Buscaste tu nombre completo en Google alguna vez?", options: SI_NO },
      { id: "identidadDatosIndexados", label: "¿Aparecen resultados de tu teléfono, DNI o dirección en buscadores?", options: SI_NO_NO_SE },
      { id: "identidadPerfilesViejos", label: "¿Tenés perfiles en redes que ya no usás pero siguen activos o públicos?", options: SI_NO_NO_SE },
      { id: "identidadUsuarioRepetido", label: "¿Usás el mismo nombre de usuario (handle) en varios servicios?", options: SI_NO },
    ],
  },
  {
    key: "cuentas",
    label: "Cuentas y Autenticación",
    questions: [
      { id: "cuentasMfaEmail", label: "¿Tenés activado el doble factor de autenticación (MFA) en tu correo principal?", options: SI_NO },
      {
        id: "cuentasMfaRedes",
        label: "¿Tenés MFA activado en tus redes sociales principales?",
        options: [
          { value: "si", label: "Sí" },
          { value: "parcial", label: "Parcialmente" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "cuentasCantidad",
        label: "¿Sabés aproximadamente cuántas cuentas online tenés creadas?",
        options: [
          { value: "menos_20", label: "Menos de 20" },
          { value: "20_80", label: "Entre 20 y 80" },
          { value: "mas_80", label: "Más de 80" },
          { value: "no_se", label: "No sé" },
        ],
      },
      { id: "cuentasRevisoTerceros", label: "¿Revisaste alguna vez qué apps/servicios de terceros tienen acceso a tu cuenta de Google/Facebook?", options: SI_NO },
    ],
  },
  {
    key: "passwords",
    label: "Contraseñas",
    questions: [
      { id: "passwordsGestor", label: "¿Usás un gestor de contraseñas?", options: SI_NO },
      { id: "passwordsReutiliza", label: "¿Reutilizás la misma contraseña en más de un servicio importante?", options: SI_NO_NO_SE },
      { id: "passwordsLargas", label: "¿Tus contraseñas principales tienen más de 12 caracteres?", options: SI_NO_NO_SE },
      { id: "passwordsCambioEmail", label: "¿Cambiaste tu contraseña de email en el último año?", options: SI_NO_NO_SE },
    ],
  },
  {
    key: "redes",
    label: "Redes Sociales",
    questions: [
      {
        id: "redesPerfilPublico",
        label: "¿Tu perfil principal (Instagram/Facebook/X) es público?",
        options: [
          { value: "si", label: "Sí" },
          { value: "mixto", label: "Depende de la red" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "redesFotosSensibles",
        label: "¿Publicás fotos donde se vea el frente de tu casa, la patente del auto o tu ubicación en tiempo real?",
        options: [
          { value: "si", label: "Sí" },
          { value: "a_veces", label: "A veces" },
          { value: "no", label: "No" },
        ],
      },
      { id: "redesMuestraTrabajo", label: "¿Tu perfil muestra dónde trabajás o estudiás?", options: SI_NO },
      { id: "redesGeolocalizacion", label: "¿Tenés la geolocalización activada en tus publicaciones?", options: SI_NO_NO_SE },
    ],
  },
  {
    key: "dispositivos",
    label: "Dispositivos",
    questions: [
      {
        id: "dispositivosBloqueo",
        label: "¿Tus dispositivos principales (celular, notebook) tienen PIN, contraseña o biometría?",
        options: [
          { value: "todos", label: "Todos" },
          { value: "algunos", label: "Algunos" },
          { value: "ninguno", label: "Ninguno" },
        ],
      },
      { id: "dispositivosCifrado", label: "¿Tenés el cifrado de disco activado (BitLocker/FileVault/cifrado nativo de Android-iOS)?", options: SI_NO_NO_SE },
      { id: "dispositivosActualizados", label: "¿Tus dispositivos están al día con las actualizaciones del sistema operativo?", options: SI_NO_NO_SE },
      {
        id: "dispositivosAntivirus",
        label: "¿Tenés un antivirus o protección activa en tu PC?",
        options: [
          { value: "si", label: "Sí" },
          { value: "no", label: "No" },
          { value: "no_aplica", label: "No aplica" },
        ],
      },
    ],
  },
  {
    key: "red_domestica",
    label: "Red Doméstica",
    questions: [
      {
        id: "redRouterProtocolo",
        label: "¿Tu router usa WPA3 o al menos WPA2 (no WEP ni sin contraseña)?",
        options: [
          { value: "wpa3", label: "WPA3" },
          { value: "wpa2", label: "WPA2" },
          { value: "wep_o_abierta", label: "WEP o sin contraseña" },
          { value: "no_se", label: "No sé" },
        ],
      },
      { id: "redPasswordDefault", label: "¿Cambiaste la contraseña por defecto del router?", options: SI_NO_NO_SE },
      { id: "redWpsDesactivado", label: "¿Tenés el WPS desactivado en tu router?", options: SI_NO_NO_SE },
      {
        id: "redIotSeparada",
        label: "¿Tus dispositivos IoT (cámaras, enchufes inteligentes) están en una red separada de tus dispositivos principales?",
        options: [
          { value: "si", label: "Sí" },
          { value: "no", label: "No" },
          { value: "no_tiene_iot", label: "No tengo IoT" },
        ],
      },
    ],
  },
  {
    key: "ingenieria_social",
    label: "Ingeniería Social",
    questions: [
      { id: "ingSocialFechaNacimiento", label: "¿Publicás tu fecha de nacimiento completa en redes sociales?", options: SI_NO },
      { id: "ingSocialPreguntasSeguridad", label: "¿Tus respuestas de seguridad (nombre de mascota, escuela, etc.) se pueden deducir de tus publicaciones públicas?", options: SI_NO_NO_SE },
      { id: "ingSocialDatosFamiliares", label: "¿Compartís públicamente el nombre de tu pareja, hijos o familiares directos junto con datos identificables?", options: SI_NO },
      {
        id: "ingSocialContactosDesconocidos",
        label: "¿Aceptás solicitudes de conexión o amistad de gente que no conocés?",
        options: [
          { value: "si", label: "Sí" },
          { value: "a_veces", label: "A veces" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },
]
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores. (Este archivo es solo datos estáticos, no requiere test unitario.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/assessment/questions.ts
git commit -m "feat: add question metadata for personal security assessment form"
```

---

### Task 4: Orquestador (resumen ejecutivo vía Claude)

**Files:**
- Create: `src/lib/agents/assessment/orchestrator.ts`

**Interfaces:**
- Consumes: `scoreAssessment`, `computeRiskScore` de `./scoring` (Task 2).
- Produces: `export interface AssessmentOutcome { findings: CategoryCheckResult[]; summary: string; riskScore: number }` y `export async function runPersonalAssessment(answers: AssessmentAnswers): Promise<AssessmentOutcome>` — usado por Task 5.

- [ ] **Step 1: Crear `orchestrator.ts`**

Crear `src/lib/agents/assessment/orchestrator.ts`:

```ts
import Anthropic from "@anthropic-ai/sdk"
import { scoreAssessment, computeRiskScore } from "./scoring"
import type { AssessmentAnswers, CategoryCheckResult } from "@/lib/agents/types"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface AssessmentOutcome {
  findings: CategoryCheckResult[]
  summary: string
  riskScore: number
}

export async function runPersonalAssessment(answers: AssessmentAnswers): Promise<AssessmentOutcome> {
  const findings = scoreAssessment(answers)
  const riskScore = computeRiskScore(findings)

  const model = process.env.SCAN_AGENT_MODEL || "claude-sonnet-5"
  const systemPrompt = `Sos un agente de evaluación de seguridad personal (Personal Security Assessment). Ya se calculó el resultado de las 7 categorías y un puntaje de riesgo global de 0 a 100 (más alto = mejor postura de seguridad). Tu única tarea es escribir un resumen ejecutivo de 2-3 párrafos en español claro, sin jerga técnica, para una persona sin conocimientos de seguridad: interpretá el puntaje global, mencioná primero las categorías con mayor riesgo, y priorizá qué corregir antes. No repitas la lista completa de puntos — eso ya se muestra aparte. No inventes datos que no estén en el resultado que te paso.`

  const userMessage = `Puntaje de riesgo global: ${riskScore}/100\n\nResultado por categoría:\n${JSON.stringify(findings, null, 2)}`

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: userMessage }],
  })

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")
  if (!textBlock) {
    throw new Error("El agente no devolvió un resumen")
  }

  return { findings, summary: textBlock.text, riskScore }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores. (Sin test unitario para este archivo — mismo criterio que `src/lib/agents/scan/orchestrator.ts`, que tampoco tiene test propio porque llama a la API real de Claude; se verifica manualmente end-to-end en Task 8.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/assessment/orchestrator.ts
git commit -m "feat: add orchestrator to generate the assessment executive summary"
```

---

### Task 5: Endpoint `POST /api/agents/[agent-id]/assessment/run`

**Files:**
- Create: `src/app/api/agents/[agent-id]/assessment/run/route.ts`
- Test: `src/app/api/agents/[agent-id]/assessment/run/route.test.ts`

**Interfaces:**
- Consumes: `runPersonalAssessment` de `@/lib/agents/assessment/orchestrator` (Task 4); `prisma.agent`, `prisma.personalAssessmentRun` de `@/lib/db` (Task 1's schema).
- Produces: `export async function POST(request: NextRequest, { params }): Promise<Response>` — usado por Task 8. Éxito: `200` con JSON `{ findings, summary, riskScore }`. Error: `400`/`404`/`429`/`500` con JSON `{ error: string }`.

- [ ] **Step 1: Escribir el test (falla porque el endpoint no existe)**

Crear `src/app/api/agents/[agent-id]/assessment/run/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  prisma: {
    agent: { findFirst: vi.fn() },
    personalAssessmentRun: { count: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}))

vi.mock("@/lib/agents/assessment/orchestrator", () => ({
  runPersonalAssessment: vi.fn(),
}))

import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { runPersonalAssessment } from "@/lib/agents/assessment/orchestrator"
import { POST } from "./route"

const validAnswers = {
  identidadBuscasteNombre: "si",
  identidadDatosIndexados: "no",
  identidadPerfilesViejos: "no",
  identidadUsuarioRepetido: "no",
  cuentasMfaEmail: "si",
  cuentasMfaRedes: "si",
  cuentasCantidad: "20_80",
  cuentasRevisoTerceros: "si",
  passwordsGestor: "si",
  passwordsReutiliza: "no",
  passwordsLargas: "si",
  passwordsCambioEmail: "si",
  redesPerfilPublico: "no",
  redesFotosSensibles: "no",
  redesMuestraTrabajo: "no",
  redesGeolocalizacion: "no",
  dispositivosBloqueo: "todos",
  dispositivosCifrado: "si",
  dispositivosActualizados: "si",
  dispositivosAntivirus: "si",
  redRouterProtocolo: "wpa3",
  redPasswordDefault: "si",
  redWpsDesactivado: "si",
  redIotSeparada: "no_tiene_iot",
  ingSocialFechaNacimiento: "no",
  ingSocialPreguntasSeguridad: "no",
  ingSocialDatosFamiliares: "no",
  ingSocialContactosDesconocidos: "no",
}

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/agents/test-agent/assessment/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function buildParams(agentId = "test-agent") {
  return { params: Promise.resolve({ "agent-id": agentId }) }
}

describe("POST /api/agents/[agent-id]/assessment/run", () => {
  beforeEach(() => {
    vi.mocked(prisma.agent.findFirst).mockReset()
    vi.mocked(prisma.personalAssessmentRun.count).mockReset()
    vi.mocked(prisma.personalAssessmentRun.create).mockReset()
    vi.mocked(prisma.personalAssessmentRun.update).mockReset()
    vi.mocked(runPersonalAssessment).mockReset()
  })

  it("returns 200 with findings/summary/riskScore for a valid payload", async () => {
    vi.mocked(prisma.personalAssessmentRun.count).mockResolvedValue(0)
    vi.mocked(prisma.agent.findFirst).mockResolvedValue({
      id: "agent-1",
      active: true,
      type: "assessment",
    } as any)
    vi.mocked(prisma.personalAssessmentRun.create).mockResolvedValue({ id: "run-1" } as any)
    vi.mocked(prisma.personalAssessmentRun.update).mockResolvedValue({} as any)
    vi.mocked(runPersonalAssessment).mockResolvedValue({
      findings: [{ category: "Identidad Digital", points: [] }],
      summary: "Resumen de prueba.",
      riskScore: 78,
    })

    const response = await POST(buildRequest({ userEmail: "user@test.com", answers: validAnswers }), buildParams())

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.riskScore).toBe(78)
    expect(data.summary).toBe("Resumen de prueba.")
    expect(prisma.personalAssessmentRun.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "completed" }) })
    )
  })

  it("returns 400 when answers are incomplete", async () => {
    const { identidadBuscasteNombre, ...incomplete } = validAnswers
    const response = await POST(
      buildRequest({ userEmail: "user@test.com", answers: incomplete }),
      buildParams()
    )
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBeTruthy()
  })

  it("returns 429 when the rate limit is exceeded", async () => {
    vi.mocked(prisma.personalAssessmentRun.count).mockResolvedValue(10)

    const response = await POST(buildRequest({ userEmail: "user@test.com", answers: validAnswers }), buildParams())

    expect(response.status).toBe(429)
  })

  it("returns 404 when the agent is not type assessment", async () => {
    vi.mocked(prisma.personalAssessmentRun.count).mockResolvedValue(0)
    vi.mocked(prisma.agent.findFirst).mockResolvedValue({
      id: "agent-1",
      active: true,
      type: "scan",
    } as any)

    const response = await POST(buildRequest({ userEmail: "user@test.com", answers: validAnswers }), buildParams())

    expect(response.status).toBe(404)
  })
})
```

- [ ] **Step 2: Correr el test para confirmar que falla**

Run: `npx vitest run "src/app/api/agents/[agent-id]/assessment/run/route.test.ts"`
Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3: Implementar el endpoint**

Crear `src/app/api/agents/[agent-id]/assessment/run/route.ts`:

```ts
import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { runPersonalAssessment } from "@/lib/agents/assessment/orchestrator"
import type { Prisma } from "@prisma/client"

const ASSESSMENT_RATE_LIMIT_MAX = 10
const ASSESSMENT_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000

const yesNo = z.enum(["si", "no"])
const yesNoUnsure = z.enum(["si", "no", "no_se"])

const answersSchema = z.object({
  identidadBuscasteNombre: yesNo,
  identidadDatosIndexados: yesNoUnsure,
  identidadPerfilesViejos: yesNoUnsure,
  identidadUsuarioRepetido: yesNo,

  cuentasMfaEmail: yesNo,
  cuentasMfaRedes: z.enum(["si", "no", "parcial"]),
  cuentasCantidad: z.enum(["menos_20", "20_80", "mas_80", "no_se"]),
  cuentasRevisoTerceros: yesNo,

  passwordsGestor: yesNo,
  passwordsReutiliza: yesNoUnsure,
  passwordsLargas: yesNoUnsure,
  passwordsCambioEmail: yesNoUnsure,

  redesPerfilPublico: z.enum(["si", "no", "mixto"]),
  redesFotosSensibles: z.enum(["si", "no", "a_veces"]),
  redesMuestraTrabajo: yesNo,
  redesGeolocalizacion: yesNoUnsure,

  dispositivosBloqueo: z.enum(["todos", "algunos", "ninguno"]),
  dispositivosCifrado: yesNoUnsure,
  dispositivosActualizados: yesNoUnsure,
  dispositivosAntivirus: z.enum(["si", "no", "no_aplica"]),

  redRouterProtocolo: z.enum(["wpa3", "wpa2", "wep_o_abierta", "no_se"]),
  redPasswordDefault: yesNoUnsure,
  redWpsDesactivado: yesNoUnsure,
  redIotSeparada: z.enum(["si", "no", "no_tiene_iot"]),

  ingSocialFechaNacimiento: yesNo,
  ingSocialPreguntasSeguridad: yesNoUnsure,
  ingSocialDatosFamiliares: yesNo,
  ingSocialContactosDesconocidos: z.enum(["si", "no", "a_veces"]),
})

const requestSchema = z.object({
  userEmail: z.string().min(1),
  answers: answersSchema,
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ "agent-id": string }> }
) {
  try {
    const { "agent-id": agentId } = await params
    const body = await request.json().catch(() => null)
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Respuestas inválidas o incompletas" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }
    const { userEmail, answers } = parsed.data

    const runCount = await prisma.personalAssessmentRun.count({
      where: {
        userEmail,
        createdAt: { gte: new Date(Date.now() - ASSESSMENT_RATE_LIMIT_WINDOW_MS) },
      },
    })
    if (runCount >= ASSESSMENT_RATE_LIMIT_MAX) {
      return new Response(JSON.stringify({ error: "Alcanzaste el límite de evaluaciones por hoy" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      })
    }

    const agent = await prisma.agent.findFirst({
      where: { OR: [{ id: agentId }, { slug: agentId }] },
    })
    if (!agent || !agent.active || agent.type !== "assessment") {
      return new Response(JSON.stringify({ error: "Agente no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    const run = await prisma.personalAssessmentRun.create({
      data: {
        agentId: agent.id,
        userEmail,
        answers: answers as unknown as Prisma.InputJsonValue,
        status: "running",
      },
    })

    try {
      const outcome = await runPersonalAssessment(answers)

      await prisma.personalAssessmentRun.update({
        where: { id: run.id },
        data: {
          status: "completed",
          findings: outcome.findings as unknown as Prisma.InputJsonValue,
          summary: outcome.summary,
          riskScore: outcome.riskScore,
        },
      })

      return new Response(JSON.stringify(outcome), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (err) {
      await prisma.personalAssessmentRun.update({
        where: { id: run.id },
        data: { status: "failed" },
      })
      throw err
    }
  } catch (error) {
    console.error("[POST /api/agents/[agent-id]/assessment/run]", error)
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
```

- [ ] **Step 4: Correr el test para confirmar que pasa**

Run: `npx vitest run "src/app/api/agents/[agent-id]/assessment/run/route.test.ts"`
Expected: PASS (4 tests).

- [ ] **Step 5: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/api/agents/[agent-id]/assessment/run/route.ts" "src/app/api/agents/[agent-id]/assessment/run/route.test.ts"
git commit -m "feat: add POST endpoint to run the personal security assessment"
```

---

### Task 6: Endpoint de reporte PDF del assessment

**Files:**
- Create: `src/app/api/agents/[agent-id]/assessment/report/route.ts`
- Test: `src/app/api/agents/[agent-id]/assessment/report/route.test.ts`

**Interfaces:**
- Consumes: `renderScanReportPdf` de `@/lib/agents/scan/report-pdf` (ya existente, sin cambios).
- Produces: `export async function POST(request: NextRequest): Promise<Response>` — usado por Task 7 (`ScanResultsView`) vía `reportEndpoint` prop.

- [ ] **Step 1: Escribir el test (falla porque el endpoint no existe)**

Crear `src/app/api/agents/[agent-id]/assessment/report/route.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./route"
import type { CategoryCheckResult } from "@/lib/agents/types"

const sampleFindings: CategoryCheckResult[] = [
  {
    category: "Identidad Digital",
    points: [
      {
        point: "Revisaste qué información pública existe sobre vos",
        result: "Sí",
        severity: "OK",
        evidence: "Ya revisaste manualmente qué aparece sobre vos",
        recommendation: "Repetilo cada 6 meses",
        estado: "Aprobado",
      },
    ],
  },
]

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/agents/test-agent/assessment/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/agents/[agent-id]/assessment/report", () => {
  it("returns a PDF for a valid payload", async () => {
    const response = await POST(
      buildRequest({
        target: "Evaluación de Seguridad Personal",
        summary: "Resumen ejecutivo de prueba.",
        findings: sampleFindings,
      })
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("application/pdf")
    expect(response.headers.get("Content-Disposition")).toContain("attachment")

    const buffer = Buffer.from(await response.arrayBuffer())
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF")
  })

  it("returns 400 for a payload missing findings", async () => {
    const response = await POST(
      buildRequest({
        target: "Evaluación de Seguridad Personal",
        summary: "Resumen ejecutivo de prueba.",
      })
    )

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBeTruthy()
  })
})
```

- [ ] **Step 2: Correr el test para confirmar que falla**

Run: `npx vitest run "src/app/api/agents/[agent-id]/assessment/report/route.test.ts"`
Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3: Implementar el endpoint**

Crear `src/app/api/agents/[agent-id]/assessment/report/route.ts` (idéntico estructuralmente a `src/app/api/agents/[agent-id]/scan/report/route.ts`, mismo esquema de validación y misma lógica — se duplica deliberadamente para no tocar el endpoint ya productivo del scan):

```ts
import { NextRequest } from "next/server"
import { z } from "zod"
import { renderScanReportPdf } from "@/lib/agents/scan/report-pdf"

const scanPointSchema = z.object({
  point: z.string().max(300),
  result: z.string().max(500),
  severity: z.string().max(50),
  evidence: z.string().max(2000),
  recommendation: z.string().max(1000),
  estado: z.enum(["Aprobado", "Fallido", "Pendiente", "No aplica"]),
})

const categoryCheckResultSchema = z.object({
  category: z.string().max(200),
  points: z.array(scanPointSchema).max(200),
})

const reportRequestSchema = z.object({
  target: z.string().min(1).max(500),
  summary: z.string().max(10000),
  findings: z.array(categoryCheckResultSchema).min(1).max(50),
})

function sanitizeFilenamePart(value: string): string {
  return value.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9.-]/g, "-")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = reportRequestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Datos de reporte inválidos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { target, summary, findings } = parsed.data
    const generatedAt = new Date()
    const pdfBuffer = await renderScanReportPdf({ target, summary, findings, generatedAt })

    const dateStr = generatedAt.toISOString().slice(0, 10)
    const filename = `reporte-evaluacion-personal-${sanitizeFilenamePart(target)}-${dateStr}.pdf`

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[POST /api/agents/[agent-id]/assessment/report]", error)
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
```

- [ ] **Step 4: Correr el test para confirmar que pasa**

Run: `npx vitest run "src/app/api/agents/[agent-id]/assessment/report/route.test.ts"`
Expected: PASS (2 tests).

- [ ] **Step 5: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/api/agents/[agent-id]/assessment/report/route.ts" "src/app/api/agents/[agent-id]/assessment/report/route.test.ts"
git commit -m "feat: add PDF report endpoint for the personal security assessment"
```

---

### Task 7: Extraer `ScanResultsView` compartido y refactorizar `AgentScanRunner`

**Files:**
- Create: `src/components/sections/ScanResultsView.tsx`
- Modify: `src/components/sections/AgentScanRunner.tsx`

**Interfaces:**
- Produces: `ScanResultsView` component con props `{ target: string; summary: string; findings: CategoryCheckResult[]; reportEndpoint: string; onReset: () => void; resetLabel: string }` — usado por Task 8 (`AgentAssessmentRunner`) y por `AgentScanRunner` (este mismo task).

**Nota de riesgo:** este task toca `AgentScanRunner.tsx`, que es una feature ya en producción. El cambio debe ser una extracción pura (mismo comportamiento visual y funcional, cero cambios de lógica) — prestar especial atención en la revisión a que no se alteren `ESTADO_STYLE`, el flujo de descarga de PDF, ni el texto de los botones.

- [ ] **Step 1: Crear `ScanResultsView.tsx`**

Crear `src/components/sections/ScanResultsView.tsx`:

```tsx
"use client"

import { useState } from "react"
import { CategoryCheckResult } from "@/lib/agents/types"

interface ScanResultsViewProps {
  target: string
  summary: string
  findings: CategoryCheckResult[]
  reportEndpoint: string
  onReset: () => void
  resetLabel: string
}

const ESTADO_STYLE: Record<string, string> = {
  Aprobado: "bg-green-500/10 text-green-400",
  Fallido: "bg-red-500/10 text-red-400",
  Pendiente: "bg-yellow-500/10 text-yellow-400",
  "No aplica": "bg-gray-500/10 text-gray-400",
}

export const ScanResultsView = ({
  target,
  summary,
  findings,
  reportEndpoint,
  onReset,
  resetLabel,
}: ScanResultsViewProps) => {
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "generating" | "error">("idle")

  const handleDownloadReport = async () => {
    setDownloadStatus("generating")
    try {
      const response = await fetch(reportEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, summary, findings }),
      })

      if (!response.ok) {
        setDownloadStatus("error")
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const cleanTarget = target.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9.-]/g, "-")
      const dateStr = new Date().toISOString().slice(0, 10)
      const link = document.createElement("a")
      link.href = url
      link.download = `reporte-seguridad-${cleanTarget}-${dateStr}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setDownloadStatus("idle")
    } catch (err) {
      console.error("Report download error:", err)
      setDownloadStatus("error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-gray-200 leading-relaxed whitespace-pre-line">{summary}</div>

      <div>
        <button
          onClick={handleDownloadReport}
          disabled={downloadStatus === "generating"}
          className="px-4 py-2 bg-gray-800 border border-cyan-400 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-400 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {downloadStatus === "generating" ? "Generando PDF..." : "Descargar reporte (PDF)"}
        </button>
        {downloadStatus === "error" && (
          <p className="mt-2 text-sm text-red-400">
            No se pudo generar el PDF. Intentá de nuevo.
          </p>
        )}
      </div>

      {findings.map((cat) => (
        <div key={cat.category}>
          <h3 className="text-lg font-bold text-white mb-3">{cat.category}</h3>
          <div className="space-y-2">
            {cat.points.map((p, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-4 px-4 py-3 bg-gray-800/60 rounded border border-gray-700"
              >
                <div>
                  <div className="text-sm text-gray-200 font-semibold">{p.point}</div>
                  <div className="text-xs text-gray-400 mt-1">{p.evidence}</div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${ESTADO_STYLE[p.estado]}`}
                >
                  {p.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={onReset} className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold">
        {resetLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Refactorizar `AgentScanRunner.tsx` para usar `ScanResultsView`**

Reemplazar el import de la línea 4:

```tsx
import { Agent, CategoryCheckResult } from "@/lib/agents/types"
```

por:

```tsx
import { Agent, CategoryCheckResult } from "@/lib/agents/types"
import { ScanResultsView } from "./ScanResultsView"
```

Eliminar la constante `ESTADO_STYLE` (líneas 20-25 actuales) — ya no se usa en este archivo, ahora vive en `ScanResultsView`.

Eliminar el estado `downloadStatus` (línea 42) y la función `handleDownloadReport` completa (líneas 117-149 actuales) — ahora viven en `ScanResultsView`.

En `handleReset`, quitar la línea `setDownloadStatus("idle")` (ya no existe ese estado en este componente):

```tsx
  const handleReset = () => {
    setFindings(null)
    setSummary("")
    setTarget("")
    setAuthorized(false)
    setStatus(initialStatus())
  }
```

Reemplazar todo el bloque `{findings && ( ... )}` (el bloque completo de resultados, desde `<div className="space-y-6">` con el resumen, el botón de descarga, el `.map` de categorías y el botón de reset) por:

```tsx
      {findings && (
        <ScanResultsView
          target={target}
          summary={summary}
          findings={findings}
          reportEndpoint={`/api/agents/${agent.id}/scan/report`}
          onReset={handleReset}
          resetLabel="← Auditar otro sitio"
        />
      )}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores.

- [ ] **Step 4: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS — sin tests de componente para este archivo, esto solo confirma que nada del resto del proyecto se rompió.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/ScanResultsView.tsx src/components/sections/AgentScanRunner.tsx
git commit -m "refactor: extract shared ScanResultsView from AgentScanRunner"
```

---

### Task 8: Componente `AgentAssessmentRunner` (formulario)

**Files:**
- Create: `src/components/sections/AgentAssessmentRunner.tsx`

**Interfaces:**
- Consumes: `ASSESSMENT_CATEGORIES` de `@/lib/agents/assessment/questions` (Task 3); `ScanResultsView` de `./ScanResultsView` (Task 7); `POST /api/agents/[agent-id]/assessment/run` (Task 5).
- Produces: `export const AgentAssessmentRunner: React.FC<{ agent: Agent; userEmail: string }>` — usado por Task 9 (`AgentDetail.tsx`).

- [ ] **Step 1: Crear `AgentAssessmentRunner.tsx`**

Crear `src/components/sections/AgentAssessmentRunner.tsx`:

```tsx
"use client"

import { useState } from "react"
import { Agent, CategoryCheckResult } from "@/lib/agents/types"
import { ASSESSMENT_CATEGORIES } from "@/lib/agents/assessment/questions"
import { ScanResultsView } from "./ScanResultsView"

interface AgentAssessmentRunnerProps {
  agent: Agent
  userEmail: string
}

function initialAnswers(): Record<string, string> {
  const answers: Record<string, string> = {}
  for (const cat of ASSESSMENT_CATEGORIES) {
    for (const q of cat.questions) {
      answers[q.id] = ""
    }
  }
  return answers
}

export const AgentAssessmentRunner = ({ agent, userEmail }: AgentAssessmentRunnerProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers())
  const [running, setRunning] = useState(false)
  const [error, setError] = useState("")
  const [findings, setFindings] = useState<CategoryCheckResult[] | null>(null)
  const [summary, setSummary] = useState("")
  const [riskScore, setRiskScore] = useState<number | null>(null)

  const allAnswered = Object.values(answers).every((v) => v !== "")

  const handleAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allAnswered || running) return

    setError("")
    setRunning(true)
    try {
      const response = await fetch(`/api/agents/${agent.id}/assessment/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, userEmail }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data?.error || "No se pudo generar la evaluación")
        return
      }
      setFindings(data.findings)
      setSummary(data.summary)
      setRiskScore(data.riskScore)
    } catch (err) {
      console.error("Assessment run error:", err)
      setError("Error de conexión al generar la evaluación")
    } finally {
      setRunning(false)
    }
  }

  const handleReset = () => {
    setAnswers(initialAnswers())
    setFindings(null)
    setSummary("")
    setRiskScore(null)
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gradient-to-b from-gray-900 to-gray-950 p-6">
      {!findings && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {ASSESSMENT_CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <h3 className="text-lg font-bold text-white mb-3">{cat.label}</h3>
              <div className="space-y-4">
                {cat.questions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">{q.label}</label>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <label
                          key={opt.value}
                          className={`px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                            answers[q.id] === opt.value
                              ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                              : "border-gray-600 bg-gray-800 text-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt.value}
                            checked={answers[q.id] === opt.value}
                            onChange={() => handleAnswer(q.id, opt.value)}
                            disabled={running}
                            className="sr-only"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={running || !allAnswered}
            className="px-6 py-2 bg-cyan-400 text-gray-900 font-semibold rounded-lg hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? "Generando evaluación..." : "Generar evaluación"}
          </button>
        </form>
      )}

      {error && (
        <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {findings && riskScore !== null && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-cyan-400">{riskScore}/100</div>
            <div className="text-gray-400 text-sm mt-1">Puntaje de seguridad personal</div>
          </div>
          <ScanResultsView
            target="Evaluación de Seguridad Personal"
            summary={summary}
            findings={findings}
            reportEndpoint={`/api/agents/${agent.id}/assessment/report`}
            onReset={handleReset}
            resetLabel="← Hacer otra evaluación"
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores.

- [ ] **Step 3: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/AgentAssessmentRunner.tsx
git commit -m "feat: add AgentAssessmentRunner questionnaire component"
```

---

### Task 9: Wiring en `AgentDetail.tsx` y `AgentCard.tsx`

**Files:**
- Modify: `src/components/sections/AgentDetail.tsx`
- Modify: `src/components/sections/AgentCard.tsx`

**Interfaces:**
- Consumes: `AgentAssessmentRunner` de `./AgentAssessmentRunner` (Task 8).

- [ ] **Step 1: Agregar el import y el branch en `AgentDetail.tsx`**

Reemplazar la línea 6:

```tsx
import { AgentScanRunner } from "./AgentScanRunner"
```

por:

```tsx
import { AgentScanRunner } from "./AgentScanRunner"
import { AgentAssessmentRunner } from "./AgentAssessmentRunner"
```

Insertar, inmediatamente después del bloque `if (agent.type === "scan") { ... }` (después de la línea que cierra ese bloque, antes del `return` genérico final):

```tsx

  // Para agentes tipo "assessment", renderizar el cuestionario guiado
  if (agent.type === "assessment") {
    return (
      <div className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-950 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <a href="/agents" className="text-cyan-400 hover:text-cyan-300 mb-4 inline-block">
            ← Volver a Agentes
          </a>

          <div className="flex items-start gap-4 mb-8">
            <div className="text-6xl">{agent.icon}</div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{agent.name}</h1>
              <p className="text-gray-400 mb-4">{agent.fullDescription}</p>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400">
                🕵️ Evaluación guiada
              </span>
            </div>
          </div>

          {userEmail ? (
            <AgentAssessmentRunner agent={agent} userEmail={userEmail} />
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-yellow-100">
              Ingresa tu email para iniciar la evaluación
            </div>
          )}
        </div>
      </div>
    )
  }
```

- [ ] **Step 2: Agregar la etiqueta en `AgentCard.tsx`**

Reemplazar el bloque `typeLabel` (líneas 12-19):

```tsx
  const typeLabel =
    agent.type === "chat"
      ? "💬 Chat"
      : agent.type === "form"
      ? "📋 Form"
      : agent.type === "scan"
      ? "🛡️ Scan"
      : "🔗 Link"
```

por:

```tsx
  const typeLabel =
    agent.type === "chat"
      ? "💬 Chat"
      : agent.type === "form"
      ? "📋 Form"
      : agent.type === "scan"
      ? "🛡️ Scan"
      : agent.type === "assessment"
      ? "🕵️ Assessment"
      : "🔗 Link"
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores.

- [ ] **Step 4: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/AgentDetail.tsx src/components/sections/AgentCard.tsx
git commit -m "feat: wire the assessment agent type into AgentDetail and AgentCard"
```

---

### Task 10: Registrar el agente y unificar el seed

**Files:**
- Modify: `src/content/agents.ts`
- Modify: `prisma/seed.ts`

**Interfaces:** ninguna (task de datos/configuración, sin código consumido por otras tasks).

- [ ] **Step 1: Agregar la entrada del agente en `src/content/agents.ts`**

Agregar al final del array `SEED_AGENTS`, después de la entrada de `"Auditor de Seguridad con IA"` (antes del `]` que cierra el array):

```ts
  {
    name: "Evaluación de Seguridad Personal",
    slug: "evaluacion-seguridad-personal",
    description: "Un cuestionario guiado por IA evalúa tu exposición digital personal: identidad, cuentas, contraseñas, redes sociales y más",
    fullDescription:
      "Agente productivo que te guía por un cuestionario de 7 categorías (28 puntos de control) sobre tu seguridad personal: qué tan expuesta está tu identidad digital, tus hábitos de contraseñas y MFA, la privacidad de tus redes sociales, tus dispositivos y tu red doméstica. Al final, un agente de IA interpreta tus respuestas, te da un puntaje de riesgo de 0 a 100 y prioriza qué corregir primero.",
    category: "productivo",
    type: "assessment",
    icon: "🕵️",
  },
```

- [ ] **Step 2: Unificar `prisma/seed.ts` para importar desde `src/content/agents.ts`**

Reemplazar todo el contenido de `prisma/seed.ts` (que hoy mantiene su propio array `SEED_AGENTS` duplicado) por:

```ts
import { PrismaClient } from "@prisma/client"
import { SEED_AGENTS } from "../src/content/agents"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding agents...")

  for (const agentData of SEED_AGENTS) {
    const agent = await prisma.agent.upsert({
      where: { slug: agentData.slug },
      update: agentData as any,
      create: agentData as any,
    })
    console.log(`Created/updated agent: ${agent.name}`)
  }

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores. `tsconfig.json` incluye `**/*.ts` (sin excluir `prisma/`), así que este comando ya valida la resolución del nuevo import `../src/content/agents` con el `paths`/`moduleResolution` reales del proyecto — no hace falta un comando aparte para el seed. No se ejecuta el seed real contra la base local (el `DATABASE_URL` local es SQLite y el schema es PostgreSQL, correr el seed real fallaría por eso, no por este cambio); el seed real se aplica automáticamente en el próximo deploy a Vercel vía `postinstall`, ver Global Constraints.

- [ ] **Step 4: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content/agents.ts prisma/seed.ts
git commit -m "feat: register the personal security assessment agent, dedupe seed source"
```

---

## Self-Review Notes

- **Spec coverage:** arquitectura sin SSE (Task 5), scoring determinístico + resumen por IA (Tasks 2 y 4), las 7 categorías/28 preguntas (Tasks 2 y 3), reutilización del modelo de datos y del generador de PDF (Task 6 reutiliza `report-pdf.tsx` sin cambios), `ScanResultsView` compartido (Task 7), nuevo tipo `assessment` (Tasks 1, 9), rate limit 10/24h (Task 5), alta del agente + fix de duplicación del seed (Task 10) — todos los puntos de la spec están cubiertos.
- **Placeholder scan:** sin TBD/TODO; cada step tiene código completo o un comando de verificación concreto.
- **Type consistency:** `AssessmentAnswers` (Task 1) se usa sin cambios en `scoring.ts` (Task 2), `questions.ts` (Task 3, solo para tipar `id`), el zod schema de Task 5 (mismos 28 campos y mismas opciones), y el formulario de Task 8. `CategoryCheckResult`/`ScanPoint` no se modifican en ningún task. `AssessmentOutcome` (Task 4) se consume sin cambios en Task 5.
