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

