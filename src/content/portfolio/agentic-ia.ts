import { PortfolioItem } from "@/lib/types/portfolio";

export const AGENTIC_IA_PROJECTS: PortfolioItem[] = [
  {
    id: "project-1",
    title: "Agente de Análisis de Seguridad Web",
    category: "agentic-ia",
    description: "Agente autónomo que analiza vulnerabilidades en aplicaciones web usando Claude",
    thumbnail: "/images/projects/project-1.jpg",
    tags: ["Claude", "Web Security", "Automation"],
    featured: true,
    content: {
      shortDescription: "Automatización de análisis de seguridad web",
      longDescription: "Un agente IA que navega y analiza aplicaciones web para identificar vulnerabilidades comunes, generando reportes detallados de forma autónoma.",
      techStack: ["Claude AI", "Node.js", "Web Scraping", "LLM Prompting"],
      workflow: "1. Reconocimiento de superficie web → 2. Ejecución de pruebas de seguridad → 3. Análisis de resultados → 4. Generación de reporte",
      results: ["Reduce tiempo de análisis inicial de 8h a 2h", "Detecta 85% de vulnerabilidades OWASP Top 10"],
      repositoryUrl: "https://github.com/tuusuario/web-security-agent",
      demoUrl: "https://demo.example.com/web-agent",
      documentation: "Flujo: reconocimiento → pruebas → análisis → reporte",
    },
  },
  {
    id: "project-2",
    title: "Agente de Procesamiento de Documentos",
    category: "agentic-ia",
    description: "Agente que procesa y extrae información de documentos complejos",
    thumbnail: "/images/projects/project-2.jpg",
    tags: ["Claude", "Document Processing", "Automation"],
    featured: true,
    content: {
      shortDescription: "Automatización de procesamiento de documentos",
      longDescription: "Agente que lee, comprende y extrae información estructurada de documentos PDF, Word y otros formatos de forma autónoma.",
      techStack: ["Claude AI", "Python", "PDF Processing"],
      results: ["Procesa 100+ documentos por día", "97% precisión en extracción"],
      repositoryUrl: "https://github.com/tuusuario/doc-processor-agent",
    },
  },
  {
    id: "project-3",
    title: "Agente de Optimización de Código",
    category: "agentic-ia",
    description: "Agente que analiza y sugiere optimizaciones en código fuente",
    thumbnail: "/images/projects/project-3.jpg",
    tags: ["Claude", "Code Review", "LLM"],
    featured: false,
    content: {
      shortDescription: "Análisis inteligente y optimización de código",
      longDescription: "Agente que revisa código y sugiere mejoras de rendimiento, legibilidad y seguridad.",
      techStack: ["Claude AI", "Code Analysis"],
    },
  },
];
