### Task 3: Botón de descarga en `AgentScanRunner.tsx`

**Files:**
- Modify: `src/components/sections/AgentScanRunner.tsx:1-18` (unificación de tipos), `:48-127` (estado + handlers), `:195-228` (JSX de resultados)

**Interfaces:**
- Consumes: `POST /api/agents/{agent.id}/scan/report` de Task 2 (body `{ target, summary, findings }`, respuesta binaria PDF o JSON de error).
- Produces: nada nuevo para otras tasks — es la punta visible del feature.

- [ ] **Step 1: Unificar los tipos duplicados**

En `src/components/sections/AgentScanRunner.tsx`, reemplazar las líneas 1-18:

```tsx
"use client"

import { useState } from "react"
import { Agent } from "@/lib/agents/types"

interface ScanPoint {
  point: string
  result: string
  severity: string
  evidence: string
  recommendation: string
  estado: "Aprobado" | "Fallido" | "Pendiente" | "No aplica"
}

interface CategoryCheckResult {
  category: string
  points: ScanPoint[]
}
```

por:

```tsx
"use client"

import { useState } from "react"
import { Agent, CategoryCheckResult } from "@/lib/agents/types"
```

- [ ] **Step 2: Agregar el estado de descarga**

En la misma componente, reemplazar la línea:

```tsx
  const [summary, setSummary] = useState("")
```

por:

```tsx
  const [summary, setSummary] = useState("")
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "generating" | "error">("idle")
```

- [ ] **Step 3: Agregar el handler de descarga y resetear el estado en `handleReset`**

Reemplazar la función `handleReset` (líneas 121-127):

```tsx
  const handleReset = () => {
    setFindings(null)
    setSummary("")
    setTarget("")
    setAuthorized(false)
    setStatus(initialStatus())
  }
```

por:

```tsx
  const handleReset = () => {
    setFindings(null)
    setSummary("")
    setTarget("")
    setAuthorized(false)
    setStatus(initialStatus())
    setDownloadStatus("idle")
  }

  const handleDownloadReport = async () => {
    if (!findings) return

    setDownloadStatus("generating")
    try {
      const response = await fetch(`/api/agents/${agent.id}/scan/report`, {
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
      const link = document.createElement("a")
      link.href = url
      link.download = `reporte-seguridad-${cleanTarget}.pdf`
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
```

- [ ] **Step 4: Agregar el botón en el bloque de resultados**

Reemplazar el inicio del bloque de resultados (líneas 195-197):

```tsx
      {findings && (
        <div className="space-y-6">
          <div className="text-gray-200 leading-relaxed whitespace-pre-line">{summary}</div>
```

por:

```tsx
      {findings && (
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
```

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores (el `Record<string, string>` de `ESTADO_STYLE` y el resto del archivo siguen siendo compatibles con el `CategoryCheckResult` importado).

- [ ] **Step 6: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS — no hay tests de componente para `AgentScanRunner.tsx`, así que esto solo confirma que nada del resto del proyecto se rompió.

- [ ] **Step 7: Verificación manual end-to-end**

1. Levantar el servidor de desarrollo: `npm run dev`
2. Ir a la página del agente "Auditor de Seguridad con IA" (`/agentes/auditor-de-seguridad-con-ia` o el slug correspondiente).
3. Ingresar un dominio de prueba propio (o uno de los targets ya autorizados), tildar la casilla de autorización, y correr la auditoría hasta que termine.
4. Confirmar que aparece el botón "Descargar reporte (PDF)" junto al resumen ejecutivo.
5. Hacer click. Confirmar que el botón pasa a "Generando PDF..." y luego se descarga un archivo `reporte-seguridad-<target>.pdf`.
6. Abrir el PDF descargado y confirmar: header con "AgenticSec" y el target auditado, el resumen ejecutivo, cada categoría con sus checks, y los badges de estado con los mismos colores que se ven en pantalla (verde/rojo/amarillo/gris).
7. Confirmar que el tamaño del archivo descargado es chico (esperado: por debajo de ~100 KB).
8. Simular un error (por ejemplo, cortar la red desde las DevTools antes de hacer click) y confirmar que aparece el mensaje "No se pudo generar el PDF. Intentá de nuevo." sin romper el resto de la pantalla de resultados.

- [ ] **Step 8: Commit**

```bash
git add src/components/sections/AgentScanRunner.tsx
git commit -m "feat: add PDF report download button to the security scan results"
```

---

## Self-Review Notes

- **Spec coverage:** endpoint server-side con `@react-pdf/renderer` (Task 1-2), branding y colores de badges (Task 1), botón solo tras scan en vivo sin historial (Task 3), manejo de errores cliente/servidor (Task 2 step 3 + Task 3 steps 3-4), sin rate limiting nuevo (no agregado, según spec), nombre de archivo sanitizado (Task 2 `sanitizeFilenamePart` + Task 3 `cleanTarget`) — todos los puntos de la spec tienen una task que los cubre.
- **Placeholder scan:** sin TBD/TODO; todos los steps incluyen código completo o un procedimiento manual concreto (Task 3 Step 7).
- **Type consistency:** `ScanReportInput`/`renderScanReportPdf` (Task 1) se consumen sin cambios en Task 2; `CategoryCheckResult` importado de `@/lib/agents/types` es el mismo tipo en los tres archivos tocados.
