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

