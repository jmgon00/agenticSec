import { SecurityService } from "@/lib/types/portfolio";

export const SECURITY_SERVICES: SecurityService[] = [
  {
    id: "web-analysis",
    name: "Análisis de Vulnerabilidades en Aplicaciones Web",
    icon: "🔍",
    shortDescription: "Identificar y documentar vulnerabilidades en tus aplicaciones web",
    fullDescription: "Análisis exhaustivo de seguridad en aplicaciones web. Nuestros expertos evalúan la arquitectura, el código, la configuración y los procesos de tu aplicación para identificar vulnerabilidades que podrían ser explotadas.",
    whatIncludes: [
      "Pruebas de seguridad en capa web (OWASP Top 10)",
      "Análisis de autenticación y autorización",
      "Evaluación de validación de entrada",
      "Revisión de manejo de sesiones",
      "Análisis de gestión de datos sensibles",
      "Reporte detallado con recomendaciones"
    ],
    forWho: "Empresas con presencia web que desean conocer las vulnerabilidades en sus aplicaciones antes que los atacantes",
    price: null
  },
  {
    id: "infrastructure-audit",
    name: "Auditoría de Servidores/Infraestructura & Penetration Testing",
    icon: "🛡️",
    shortDescription: "Evalúa la seguridad de tu infraestructura y servidores",
    fullDescription: "Auditoría completa de tu infraestructura de servidores, configuraciones, accesos y redes. Incluye pruebas de penetración para validar defensas reales contra ataques.",
    whatIncludes: [
      "Reconocimiento y mapeo de infraestructura",
      "Pruebas de acceso y autenticación",
      "Análisis de configuración de servidores",
      "Evaluación de firewalls y segmentación de red",
      "Pruebas de penetración simuladas",
      "Identificación de vectores de ataque",
      "Reporte ejecutivo + técnico con remediación"
    ],
    forWho: "Empresas que quieren entender cómo un atacante podría acceder a su infraestructura y qué defensas necesitan mejorar",
    price: null
  },
  {
    id: "compliance-audit",
    name: "Auditoría de Ciberseguridad (Compliance)",
    icon: "✅",
    shortDescription: "Asegura que cumplas con estándares y regulaciones de seguridad",
    fullDescription: "Auditoría de cumplimiento con estándares internacionales y regulaciones locales. Evaluamos tus procesos, políticas y controles técnicos contra marcos de referencia establecidos.",
    whatIncludes: [
      "Evaluación contra OWASP, ISO 27001, o estándares específicos",
      "Auditoría de políticas y procedimientos de seguridad",
      "Análisis de controles existentes",
      "Evaluación de gestión de riesgos",
      "Pruebas de cumplimiento normativo",
      "Plan de remediación priorizado",
      "Reporte de cumplimiento con evidencia"
    ],
    forWho: "Empresas que deben cumplir con regulaciones o desean implementar marcos de seguridad reconocidos internacionalmente",
    price: null
  }
];
