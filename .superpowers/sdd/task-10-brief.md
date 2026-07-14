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
