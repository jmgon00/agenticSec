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
