### Task 4: UI — sección opcional de búsqueda en Identidad Digital + verificación manual

**Files:**
- Modify: `src/components/sections/AgentAssessmentRunner.tsx`

**Interfaces:** ninguna nueva expuesta a otros archivos — consume el endpoint de Task 3 vía `fetch`.

- [ ] **Step 1: Leer el archivo actual para confirmar el punto de partida**

Leer `src/components/sections/AgentAssessmentRunner.tsx` completo antes de editar — confirmar que sigue teniendo la forma esperada (debería, nada lo tocó desde que se creó).

- [ ] **Step 2: Agregar estado para los campos opcionales**

Reemplazar la línea:

```tsx
  const [riskScore, setRiskScore] = useState<number | null>(null)
```

por:

```tsx
  const [riskScore, setRiskScore] = useState<number | null>(null)
  const [osintNombre, setOsintNombre] = useState("")
  const [osintTelefono, setOsintTelefono] = useState("")
  const [osintDni, setOsintDni] = useState("")
  const [osintConsent, setOsintConsent] = useState(false)
```

- [ ] **Step 3: Incluir `osintSearch` en el body del POST cuando corresponda**

Reemplazar:

```tsx
      const response = await fetch(`/api/agents/${agent.id}/assessment/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, userEmail }),
      })
```

por:

```tsx
      const osintSearch =
        osintConsent && osintNombre.trim()
          ? {
              nombreCompleto: osintNombre.trim(),
              telefono: osintTelefono.trim() || undefined,
              dni: osintDni.trim() || undefined,
              consent: true as const,
            }
          : undefined

      const response = await fetch(`/api/agents/${agent.id}/assessment/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, userEmail, osintSearch }),
      })
```

- [ ] **Step 4: Resetear los campos opcionales en `handleReset`**

Reemplazar:

```tsx
  const handleReset = () => {
    setAnswers(initialAnswers())
    setFindings(null)
    setSummary("")
    setRiskScore(null)
  }
```

por:

```tsx
  const handleReset = () => {
    setAnswers(initialAnswers())
    setFindings(null)
    setSummary("")
    setRiskScore(null)
    setOsintNombre("")
    setOsintTelefono("")
    setOsintDni("")
    setOsintConsent(false)
  }
```

- [ ] **Step 5: Agregar la sección opcional dentro de la categoría "Identidad Digital"**

Reemplazar el bloque `{ASSESSMENT_CATEGORIES.map((cat) => ( ... ))}` completo por:

```tsx
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

              {cat.key === "identidad" && (
                <div className="mt-6 p-4 border border-cyan-400/30 bg-cyan-400/5 rounded-lg space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-cyan-300">
                      Opcional: dejá que busquemos tu exposición pública por vos
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Completá tu nombre (y opcionalmente teléfono/DNI) para que un agente de IA busque
                      en internet qué información pública existe sobre vos, en vez de que lo hagas manualmente.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={osintNombre}
                    onChange={(e) => setOsintNombre(e.target.value)}
                    placeholder="Nombre completo"
                    disabled={running}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={osintTelefono}
                    onChange={(e) => setOsintTelefono(e.target.value)}
                    placeholder="Teléfono (opcional)"
                    disabled={running}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={osintDni}
                    onChange={(e) => setOsintDni(e.target.value)}
                    placeholder="DNI (opcional)"
                    disabled={running}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                  <label className="flex items-start gap-3 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={osintConsent}
                      onChange={(e) => setOsintConsent(e.target.checked)}
                      disabled={running}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>
                      Confirmo que estos son mis propios datos, autorizo la búsqueda pública en internet, y
                      entiendo que se envían a un servicio de búsqueda de terceros para generar el resultado.
                      No se guardan mi nombre, teléfono ni DNI.
                    </span>
                  </label>
                </div>
              )}
            </div>
          ))}
```

- [ ] **Step 6: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores.

- [ ] **Step 7: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Verificación manual end-to-end (post-deploy)**

El `DATABASE_URL` local es SQLite y el schema es PostgreSQL, así que esta corrida no se puede probar contra la base local — igual que en el resto de este proyecto, la verificación real ocurre después de desplegar a Vercel. Una vez desplegado:

1. Ir a la página del agente "Evaluación de Seguridad Personal".
2. Completar las 28 preguntas, y en la sección opcional de Identidad Digital completar nombre (+ opcionalmente teléfono/DNI de prueba) y tildar el consentimiento.
3. Generar la evaluación. Confirmar que la corrida tarda más que sin la búsqueda (por las 2 llamadas extra) pero termina sin error dentro del `maxDuration` de 120s.
4. Confirmar en el resultado que los 3 primeros puntos de "Identidad Digital" reflejan hallazgos reales (no el texto genérico de autorreporte) y que el 4to punto (usuario/handle repetido) sigue viniendo de la respuesta cerrada que diste en el formulario.
5. Confirmar que el campo `evidence` de esos 3 puntos no reproduce el teléfono/DNI ingresados tal cual.
6. Repetir sin completar la sección opcional (dejar nombre vacío) y confirmar que el resultado es idéntico al comportamiento actual (autorreporte puro, sin búsqueda).

- [ ] **Step 9: Commit**

```bash
git add src/components/sections/AgentAssessmentRunner.tsx
git commit -m "feat: add optional OSINT search section to the Identidad Digital category"
```

---

## Self-Review Notes

- **Spec coverage:** dos llamadas a Claude (búsqueda + estructuración) en Task 1, integración en el orchestrator sin tocar el resto de las categorías en Task 2, endpoint que acepta y valida `osintSearch` sin persistirlo en Task 3, UI opcional con consentimiento explícito en Task 4 — todos los puntos de la spec están cubiertos.
- **Placeholder scan:** sin TBD/TODO; cada step tiene código completo o un procedimiento de verificación manual concreto.
- **Type consistency:** `OsintSearchInput` (Task 1) se consume sin cambios en `orchestrator.ts` (Task 2) y en `route.ts` (Task 3, construido a partir de `osintSearch` ya validado por zod). `ScanPoint`/`CategoryCheckResult` no se modifican en ningún task.
