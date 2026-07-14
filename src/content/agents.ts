import { Agent } from "@/lib/agents/types"

export const SEED_AGENTS: Omit<Agent, "id" | "createdAt" | "updatedAt">[] = [
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
]

export const getAgentBySlug = (slug: string): (typeof SEED_AGENTS)[0] | undefined => {
  return SEED_AGENTS.find((agent) => agent.slug === slug)
}

export const getAgentsByCategory = (
  category: "educativo" | "productivo" | "all"
): (typeof SEED_AGENTS)[0][] => {
  if (category === "all") return SEED_AGENTS
  return SEED_AGENTS.filter((agent) => agent.category === category)
}
