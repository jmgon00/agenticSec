import { PrismaClient } from "@prisma/client"

const SEED_AGENTS = [
  {
    name: "Analizador de Vulnerabilidades",
    slug: "vuln-analyzer",
    description: "Identifica vulnerabilidades en código fuente",
    fullDescription:
      "Agente educativo que enseña sobre vulnerabilidades de seguridad. Analiza código y explica qué está mal y cómo arreglarlo. Ideal para aprender patrones de código inseguro.",
    category: "educativo",
    type: "chat",
    icon: "🔍",
    instructions: `Eres un experto en seguridad de aplicaciones. Tu rol es:
1. Analizar código que el usuario proporciona
2. Identificar vulnerabilidades de seguridad
3. Explicar cada vulnerabilidad de forma clara
4. Sugerir soluciones específicas

Sé educativo pero directo. Usa ejemplos prácticos.`,
    maxTokens: 1500,
    temperature: 0.7,
    active: false,
  },
  {
    name: "Generador de Reportes de Seguridad",
    slug: "security-report-gen",
    description: "Genera reportes de auditoría de seguridad",
    fullDescription:
      "Agente productivo que genera reportes estructurados de auditoría. Toma hallazgos de seguridad y los formatea en reportes profesionales listos para clientes.",
    category: "productivo",
    type: "form",
    icon: "📊",
    instructions: `Eres un experto en escribir reportes de seguridad. Toma los hallazgos y:
1. Los estructuras en secciones claras
2. Añades contexto de riesgo
3. Provides soluciones prácticas
4. Formatea en Markdown profesional`,
    inputFormat: {
      findings: {
        type: "textarea",
        label: "Hallazgos de seguridad",
        placeholder: "Ej: Buffer overflow en función getUserData...",
      },
      severity: {
        type: "select",
        label: "Nivel de severidad",
        options: ["crítico", "alto", "medio", "bajo"],
      },
    },
    maxTokens: 2000,
    temperature: 0.5,
    active: false,
  },
  {
    name: "Asistente de Aprendizaje de XSS",
    slug: "xss-learner",
    description: "Enseña sobre vulnerabilidades XSS con ejemplos interactivos",
    fullDescription:
      "Agente educativo dedicado a enseñar sobre Cross-Site Scripting (XSS). Explica los 3 tipos, muestra ejemplos de ataques y defensa.",
    category: "educativo",
    type: "chat",
    icon: "📚",
    instructions: `Eres un profesor de seguridad especializado en XSS. Tu objetivo:
1. Explicar qué es XSS de forma simple
2. Mostrar ejemplos reales pero seguros
3. Enseñar técnicas de prevención
4. Hacer preguntas para verificar comprensión

Sé Socrático - haz preguntas guía.`,
    maxTokens: 1200,
    temperature: 0.8,
    active: false,
  },
  {
    name: "Agent Job",
    slug: "agent-job",
    description: "Automatiza tu búsqueda de empleo en portales latinoamericanos",
    fullDescription:
      "Plataforma inteligente que completa perfiles, busca ofertas y aplica automáticamente en LinkedIn, Bumeran, Computrabajo y ZonaJobs. Carga tu CV una vez y deja que IA haga el trabajo.",
    category: "productivo",
    type: "link",
    icon: "💼",
    externalUrl: "https://agent-job-five.vercel.app/",
    features: [
      "Carga Excel → optimización automática",
      "Integración con 4 portales principales",
      "Búsqueda y aplicación automática",
      "Dashboard en tiempo real",
    ],
  },
  {
    name: "Auditor de Seguridad con IA",
    slug: "auditor-seguridad-ia",
    description: "Un agente de IA audita tu sitio en vivo: headers, TLS, archivos expuestos, DNS y más",
    fullDescription:
      "Agente productivo que ejecuta una auditoría básica de seguridad real contra tu dominio: 28 puntos de control en 6 categorías, corridos en vivo por un agente de IA que interpreta los resultados y te explica qué corregir primero. No es un ejemplo — corre contra tu sitio de verdad, con tu autorización.",
    category: "productivo",
    type: "scan",
    icon: "🛡️",
  },
]

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
