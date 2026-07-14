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

