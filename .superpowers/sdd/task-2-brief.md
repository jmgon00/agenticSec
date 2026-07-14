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

