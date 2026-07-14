import { PortfolioItem } from "@/lib/types/portfolio";

export const SECURITY_CASES: PortfolioItem[] = [
  {
    id: "case-agenticsec-basic-audit",
    title: "agenticSEC: Auditoría Básica de Seguridad Web (caso propio)",
    category: "security-case",
    description: "Corrimos nuestra propia Auditoría Básica sobre este sitio y publicamos el resultado real, sin editar",
    thumbnail: "/images/cases/agenticsec-basic-audit.jpg",
    tags: ["Auditoría Básica", "Headers HTTP", "Caso propio"],
    featured: true,
    content: {
      shortDescription: "28 puntos de control evaluados contra agentic-sec.vercel.app, con hallazgos corregidos y desplegados en la misma sesión",
      longDescription: "Antes de ofrecer la Auditoría Básica a clientes, la corrimos contra nuestro propio sitio en producción. Se revisaron headers HTTP, certificado TLS, archivos expuestos, versiones de dependencias, cookies/autenticación y registros DNS de email. El hallazgo principal — ausencia total de 5 headers de seguridad HTTP — se corrigió y verificó el mismo día.",
      results: [
        "5 headers de seguridad ausentes (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) implementados y verificados en producción",
        "Puntaje sobre controles aplicables: de 55% (11/20) a 80% (16/20) en una sola sesión",
        "0 archivos sensibles expuestos (.env, .git, backups) y 0 paneles de administración accesibles",
        "2 hallazgos de dependencias quedaron en monitoreo activo (riesgo bajo, internos al build de Next.js)",
      ],
      benchmarks: {
        "Puntos evaluados": "28",
        "Categorías cubiertas": "6",
        "Puntaje antes": "55%",
        "Puntaje después": "80%",
      },
      clientReportUrl: "https://claude.ai/code/artifact/f0b201d6-83f8-496f-990b-40223d9955b9",
      technicalReportUrl: "https://claude.ai/code/artifact/f84d4ce1-db47-4b0b-accf-ef376298c744",
    },
  },
];
