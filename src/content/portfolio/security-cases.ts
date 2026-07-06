import { PortfolioItem } from "@/lib/types/portfolio";

export const SECURITY_CASES: PortfolioItem[] = [
  {
    id: "case-1",
    title: "E-commerce con 50k Usuarios: Análisis de Vulnerabilidades",
    category: "security-case",
    description: "Descubrimiento y remediación de vulnerabilidades críticas en plataforma de e-commerce",
    thumbnail: "/images/cases/case-1.jpg",
    tags: ["Web Security", "E-commerce", "Critical Vulnerabilities"],
    featured: true,
    content: {
      shortDescription: "Plataforma de e-commerce: identificación de 8 vulnerabilidades críticas",
      longDescription: "Una plataforma de e-commerce con 50,000 usuarios activos fue auditada. Se identificaron vulnerabilidades críticas en autenticación, inyección SQL y gestión de sesiones que ponían en riesgo datos de clientes y transacciones.",
      results: [
        "8 vulnerabilidades críticas identificadas",
        "Riesgo de exposición de 50,000 registros de clientes eliminado",
        "Sistema de autenticación reforzado",
        "Plan de remediación completado en 2 semanas",
      ],
      benchmarks: {
        "Tiempo de remediación": "2 semanas",
        "Vulnerabilidades críticas": "8",
        "Usuarios protegidos": "50,000",
      },
    },
  },
  {
    id: "case-2",
    title: "Startup SaaS: Preparación para Serie A",
    category: "security-case",
    description: "Auditoría de seguridad pre-inversión para startup en crecimiento",
    thumbnail: "/images/cases/case-2.jpg",
    tags: ["Compliance", "SaaS", "Due Diligence"],
    featured: true,
    content: {
      shortDescription: "SaaS startup: due diligence de seguridad para inversores",
      longDescription: "Una startup SaaS requería validación de seguridad antes de su ronda de inversión Serie A. La auditoría cubrió infraestructura, código y procesos de seguridad.",
      results: [
        "Validación de seguridad completada para inversores",
        "20 hallazgos identificados y remediados",
        "Certificación de arquitectura segura obtenida",
        "Cierre de inversión facilitado",
      ],
    },
  },
  {
    id: "case-3",
    title: "Consultora: Cumplimiento ISO 27001",
    category: "security-case",
    description: "Auditoría e implementación de ISO 27001 en consultora profesional",
    thumbnail: "/images/cases/case-3.jpg",
    tags: ["Compliance", "ISO 27001", "Process Improvement"],
    featured: false,
    content: {
      shortDescription: "Consultora profesional: implementación de ISO 27001",
      longDescription: "Empresa consultora requería certificación ISO 27001 para sus clientes enterprise. Se auditó e implementaron controles necesarios.",
      results: [
        "Certificación ISO 27001 obtenida",
        "Procesos de seguridad establecidos",
        "Confianza de clientes enterprise mejorada",
      ],
    },
  },
];
