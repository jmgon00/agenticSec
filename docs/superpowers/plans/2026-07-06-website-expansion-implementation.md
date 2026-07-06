# Website Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Agentic IA section (hybrid: teaser on home + dedicated page with projects) and Security Services section (hybrid: teaser on home + dedicated page with lead capture).

**Architecture:** Content-first portfolio system (data-driven, reusable for multiple item types) + strategic navigation improvements + context-aware consultation forms. Phase 1 focuses on data structures and components; Phase 2 builds pages; Phase 3 adds polish.

**Tech Stack:** Next.js 16, TypeScript 5, Tailwind CSS v4, Prisma 7.8, Zod 4.4.3

## Global Constraints

- Maintain Tailwind v4 styling consistency (gradients, animations, dark mode)
- Use existing Prisma schema for consultation/lead storage (extend if needed)
- All pages must be responsive (mobile-first design)
- Navigation must be consistent across all pages
- Consultation forms must integrate with backend API + email notifications
- Deploy to Vercel after each major phase

---

## Phase 1: Data Structures & Core Components

### Task 1: Create Portfolio Data Types & Interfaces

**Files:**
- Create: `src/lib/types/portfolio.ts`

**Interfaces:**
- Produces: `PortfolioItem` (id, title, category, description, thumbnail, tags, featured, content with nested properties)
- Produces: `SecurityService` (id, name, icon, shortDescription, fullDescription, whatIncludes, forWho, price)

- [ ] **Step 1: Create types file**

Create `src/lib/types/portfolio.ts`:

```typescript
export interface PortfolioItemContent {
  shortDescription?: string;
  longDescription?: string;
  techStack?: string[];
  workflow?: string;
  results?: string[];
  benchmarks?: Record<string, string>;
  repositoryUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  documentation?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: "agentic-ia" | "security-case";
  description: string;
  thumbnail?: string;
  tags: string[];
  featured?: boolean;
  content: PortfolioItemContent;
}

export interface SecurityService {
  id: string;
  name: string;
  icon: string;
  shortDescription: string;
  fullDescription: string;
  whatIncludes: string[];
  forWho: string;
  price?: string | null;
}

export interface ConsultationFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  companySize: "startup" | "pyme" | "enterprise" | "other";
  serviceInterest: "web-analysis" | "infrastructure" | "compliance" | "ia-inquiry" | "other";
  message: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types/portfolio.ts
git commit -m "feat: create portfolio item and security service types"
```

---

### Task 2: Create Security Services Data

**Files:**
- Create: `src/content/services/security.ts`

**Interfaces:**
- Consumes: `SecurityService` from Task 1
- Produces: `SECURITY_SERVICES` array (3 services: web analysis, infrastructure audit, compliance audit)

- [ ] **Step 1: Create security services configuration**

Create `src/content/services/security.ts`:

```typescript
import { SecurityService } from "@/lib/types/portfolio";

export const SECURITY_SERVICES: SecurityService[] = [
  {
    id: "web-analysis",
    name: "Análisis de Vulnerabilidades en Aplicaciones Web",
    icon: "🔍",
    shortDescription: "Identificar y documentar vulnerabilidades en tus aplicaciones web",
    fullDescription:
      "Análisis exhaustivo de seguridad en aplicaciones web. Nuestros expertos evalúan la arquitectura, el código, la configuración y los procesos de tu aplicación para identificar vulnerabilidades que podrían ser explotadas.",
    whatIncludes: [
      "Pruebas de seguridad en capa web (OWASP Top 10)",
      "Análisis de autenticación y autorización",
      "Evaluación de validación de entrada",
      "Revisión de manejo de sesiones",
      "Análisis de gestión de datos sensibles",
      "Reporte detallado con recomendaciones",
    ],
    forWho:
      "Empresas con presencia web que desean conocer las vulnerabilidades en sus aplicaciones antes que los atacantes",
    price: null,
  },
  {
    id: "infrastructure-audit",
    name: "Auditoría de Servidores/Infraestructura & Penetration Testing",
    icon: "🛡️",
    shortDescription: "Evalúa la seguridad de tu infraestructura y servidores",
    fullDescription:
      "Auditoría completa de tu infraestructura de servidores, configuraciones, accesos y redes. Incluye pruebas de penetración para validar defensas reales contra ataques.",
    whatIncludes: [
      "Reconocimiento y mapeo de infraestructura",
      "Pruebas de acceso y autenticación",
      "Análisis de configuración de servidores",
      "Evaluación de firewalls y segmentación de red",
      "Pruebas de penetración simuladas",
      "Identificación de vectores de ataque",
      "Reporte ejecutivo + técnico con remediación",
    ],
    forWho:
      "Empresas que quieren entender cómo un atacante podría acceder a su infraestructura y qué defensas necesitan mejorar",
    price: null,
  },
  {
    id: "compliance-audit",
    name: "Auditoría de Ciberseguridad (Compliance)",
    icon: "✅",
    shortDescription: "Asegura que cumplas con estándares y regulaciones de seguridad",
    fullDescription:
      "Auditoría de cumplimiento con estándares internacionales y regulaciones locales. Evaluamos tus procesos, políticas y controles técnicos contra marcos de referencia establecidos.",
    whatIncludes: [
      "Evaluación contra OWASP, ISO 27001, o estándares específicos",
      "Auditoría de políticas y procedimientos de seguridad",
      "Análisis de controles existentes",
      "Evaluación de gestión de riesgos",
      "Pruebas de cumplimiento normativo",
      "Plan de remediación priorizado",
      "Reporte de cumplimiento con evidencia",
    ],
    forWho:
      "Empresas que deben cumplir con regulaciones o desean implementar marcos de seguridad reconocidos internacionalmente",
    price: null,
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/content/services/security.ts
git commit -m "feat: add security services configuration"
```

---

### Task 3: Create Agentic IA Projects Data (Placeholder)

**Files:**
- Create: `src/content/portfolio/agentic-ia.ts`

**Interfaces:**
- Consumes: `PortfolioItem` from Task 1
- Produces: `AGENTIC_IA_PROJECTS` array (2-3 placeholder projects with variable detail)

- [ ] **Step 1: Create agentic IA projects data**

Create `src/content/portfolio/agentic-ia.ts`:

```typescript
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
      longDescription:
        "Un agente IA que navega y analiza aplicaciones web para identificar vulnerabilidades comunes, generando reportes detallados de forma autónoma.",
      techStack: ["Claude AI", "Node.js", "Web Scraping", "LLM Prompting"],
      workflow:
        "1. Reconocimiento de superficie web → 2. Ejecución de pruebas de seguridad → 3. Análisis de resultados → 4. Generación de reporte",
      results: [
        "Reduce tiempo de análisis inicial de 8h a 2h",
        "Detecta 85% de vulnerabilidades OWASP Top 10",
      ],
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
      longDescription:
        "Agente que lee, comprende y extrae información estructurada de documentos PDF, Word y otros formatos de forma autónoma.",
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
      description:
        "Agente que revisa código y sugiere mejoras de rendimiento, legibilidad y seguridad.",
      techStack: ["Claude AI", "Code Analysis"],
    },
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/content/portfolio/agentic-ia.ts
git commit -m "feat: add agentic IA projects data (placeholder)"
```

---

### Task 4: Create Security Cases Data

**Files:**
- Create: `src/content/portfolio/security-cases.ts`

**Interfaces:**
- Consumes: `PortfolioItem` from Task 1
- Produces: `SECURITY_CASES` array (2-3 anonymized case studies)

- [ ] **Step 1: Create security cases data**

Create `src/content/portfolio/security-cases.ts`:

```typescript
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
      longDescription:
        "Una plataforma de e-commerce con 50,000 usuarios activos fue auditada. Se identificaron vulnerabilidades críticas en autenticación, inyección SQL y gestión de sesiones que ponían en riesgo datos de clientes y transacciones.",
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
      longDescription:
        "Una startup SaaS requería validación de seguridad antes de su ronda de inversión Serie A. La auditoría cubrió infraestructura, código y procesos de seguridad.",
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
    description: "Auditoría y implementación de ISO 27001 en consultora profesional",
    thumbnail: "/images/cases/case-3.jpg",
    tags: ["Compliance", "ISO 27001", "Process Improvement"],
    featured: false,
    content: {
      shortDescription: "Consultora profesional: implementación de ISO 27001",
      longDescription:
        "Empresa consultora requería certificación ISO 27001 para sus clientes enterprise. Se auditó y se implementaron controles necesarios.",
      results: [
        "Certificación ISO 27001 obtenida",
        "Procesos de seguridad establecidos",
        "Confianza de clientes enterprise mejorada",
      ],
    },
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/content/portfolio/security-cases.ts
git commit -m "feat: add security case studies data"
```

---

### Task 5: Create SecurityServiceCard Component

**Files:**
- Create: `src/components/sections/SecurityServiceCard.tsx`

**Interfaces:**
- Consumes: `SecurityService` from Task 1
- Produces: React component that renders a service card (icon, name, description, CTA)

- [ ] **Step 1: Create SecurityServiceCard component**

Create `src/components/sections/SecurityServiceCard.tsx`:

```typescript
"use client";

import { SecurityService } from "@/lib/types/portfolio";
import { Button } from "@/components/ui/Button";

interface SecurityServiceCardProps {
  service: SecurityService;
  onLearnMore?: (serviceId: string) => void;
}

export const SecurityServiceCard = ({
  service,
  onLearnMore,
}: SecurityServiceCardProps) => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 group">
      {/* Icon */}
      <div className="text-4xl mb-4">{service.icon}</div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
        {service.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-300 mb-6 line-clamp-3">
        {service.shortDescription}
      </p>

      {/* CTA */}
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onLearnMore?.(service.id)}
        className="w-full"
      >
        Más información
      </Button>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/SecurityServiceCard.tsx
git commit -m "feat: create SecurityServiceCard component"
```

---

### Task 6: Create ProcessTimeline Component

**Files:**
- Create: `src/components/sections/ProcessTimeline.tsx`

**Interfaces:**
- Produces: React component displaying 5-step process timeline (Contact → Diagnosis → Audit → Report → Follow-up)

- [ ] **Step 1: Create ProcessTimeline component**

Create `src/components/sections/ProcessTimeline.tsx`:

```typescript
"use client";

interface TimelineStep {
  number: number;
  title: string;
  description: string;
}

const PROCESS_STEPS: TimelineStep[] = [
  {
    number: 1,
    title: "Contacto Inicial",
    description: "Conversación para entender tus necesidades y contexto",
  },
  {
    number: 2,
    title: "Diagnóstico",
    description: "Análisis inicial de tu infraestructura y sistemas",
  },
  {
    number: 3,
    title: "Auditoría Completa",
    description: "Evaluación exhaustiva según el servicio contratado",
  },
  {
    number: 4,
    title: "Reporte Detallado",
    description: "Documentación de hallazgos y recomendaciones de remediación",
  },
  {
    number: 5,
    title: "Seguimiento",
    description: "Apoyo en la implementación de mejoras y validación",
  },
];

export const ProcessTimeline = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
          Nuestro Proceso de Trabajo
        </h2>

        <div className="space-y-8">
          {PROCESS_STEPS.map((step, index) => (
            <div key={step.number} className="flex gap-6">
              {/* Timeline dot and line */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-magenta-400 flex items-center justify-center text-white font-bold">
                  {step.number}
                </div>
                {index < PROCESS_STEPS.length - 1 && (
                  <div className="w-1 h-12 bg-gradient-to-b from-cyan-400/50 to-transparent mt-2"></div>
                )}
              </div>

              {/* Content */}
              <div className="pt-2 pb-8">
                <h3 className="text-xl font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/ProcessTimeline.tsx
git commit -m "feat: create ProcessTimeline component"
```

---

## Phase 2: Home & Navigation Updates

### Task 7: Update Header Navigation

**Files:**
- Modify: `src/components/sections/Header.tsx` (add links to security-services, agentic-ia pages)

**Interfaces:**
- Consumes: Existing header structure
- Produces: Updated header with new navigation items

- [ ] **Step 1: Review current header**

Read `src/components/sections/Header.tsx` to understand current structure:

```bash
cat "E:\Cloude projects\interactiv3Web\src\components\sections\Header.tsx"
```

- [ ] **Step 2: Add new nav items**

Update the header to include new links. Modify the navigation array to add:
- Link to `/agentic-ia` (Agentic IA)
- Link to `/security-services` (Servicios de Seguridad)

The exact modification depends on current header structure. Expected pattern:
- Find nav items array/section
- Add two new items: `{ label: "Agentic IA", href: "/agentic-ia" }` and `{ label: "Servicios de Seguridad", href: "/security-services" }`
- Ensure mobile menu also includes these items

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/Header.tsx
git commit -m "feat: add navigation links to agentic-ia and security-services pages"
```

---

### Task 8: Create SecurityServices Teaser Section (Home)

**Files:**
- Create: `src/components/sections/SecurityServices.tsx`

**Interfaces:**
- Consumes: `SecurityService[]` from `content/services/security.ts`, `SecurityServiceCard` component
- Produces: Home teaser section displaying 3 service cards + CTA

- [ ] **Step 1: Create SecurityServices teaser component**

Create `src/components/sections/SecurityServices.tsx`:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { SECURITY_SERVICES } from "@/content/services/security";
import { SecurityServiceCard } from "./SecurityServiceCard";
import { Button } from "@/components/ui/Button";

export const SecurityServices = () => {
  const router = useRouter();

  const handleLearnMore = (serviceId: string) => {
    router.push("/security-services");
  };

  return (
    <section
      id="security-services"
      className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-950"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-magenta-400 bg-clip-text text-transparent">
            Servicios de Seguridad para PyMEs
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Protege tu infraestructura y aplicaciones con auditorías profesionales de seguridad
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {SECURITY_SERVICES.map((service) => (
            <SecurityServiceCard
              key={service.id}
              service={service}
              onLearnMore={handleLearnMore}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => router.push("/security-services")}
          >
            Ver todos los servicios
          </Button>
        </div>
      </div>
    </section>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/SecurityServices.tsx
git commit -m "feat: create SecurityServices home teaser section"
```

---

### Task 9: Update Home Page with Teasers

**Files:**
- Modify: `src/app/page.tsx` (add SecurityServices and AgenticIAFeatures sections)

**Interfaces:**
- Consumes: `SecurityServices`, `AgenticIAFeatures` components
- Produces: Home page with both teasers

- [ ] **Step 1: Read current home page**

```bash
cat "E:\Cloude projects\interactiv3Web\src\app\page.tsx"
```

- [ ] **Step 2: Update home page**

Modify `src/app/page.tsx` to import and render both sections in order: Hero → SecurityServices → AgenticIAFeatures. Expected structure:

```typescript
import { Hero } from "@/components/sections/Hero";
import { SecurityServices } from "@/components/sections/SecurityServices";
import { AgenticIAFeatures } from "@/components/sections/AgenticIAFeatures";

export default function Home() {
  return (
    <>
      <Hero />
      <SecurityServices />
      <AgenticIAFeatures />
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add SecurityServices and AgenticIAFeatures to home page"
```

---

## Phase 3: Dedicated Pages & Forms

### Task 10: Create Consultation Form Component

**Files:**
- Create: `src/components/sections/ConsultationForm.tsx`

**Interfaces:**
- Consumes: `ConsultationFormData` type from Task 1
- Produces: Reusable form component accepting serviceType context parameter

- [ ] **Step 1: Create ConsultationForm component**

Create `src/components/sections/ConsultationForm.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { ConsultationFormData } from "@/lib/types/portfolio";

interface ConsultationFormProps {
  defaultService?: ConsultationFormData["serviceInterest"];
  title?: string;
  submitText?: string;
}

export const ConsultationForm = ({
  defaultService = "other",
  title = "Solicitar Consulta",
  submitText = "Solicitar Presupuesto",
}: ConsultationFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ConsultationFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    companySize: "pyme",
    serviceInterest: defaultService,
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post("/api/consultation", formData);
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        companySize: "pyme",
        serviceInterest: defaultService,
        message: "",
      });

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      setError("Error al enviar el formulario. Intenta de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-900/20 border border-green-600 rounded-lg p-6 text-center">
        <h3 className="text-lg font-bold text-green-400 mb-2">
          ¡Gracias por tu consulta!
        </h3>
        <p className="text-gray-300">
          Pronto nos pondremos en contacto contigo para discutir tus necesidades.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-8">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>

      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-6 text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name & Email Row */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        {/* Phone & Company Row */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="+34 123 456 789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Empresa *
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Nombre de tu empresa"
            />
          </div>
        </div>

        {/* Company Size & Service Interest Row */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tamaño de Empresa *
            </label>
            <select
              name="companySize"
              value={formData.companySize}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="startup">Startup</option>
              <option value="pyme">PyME</option>
              <option value="enterprise">Enterprise</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Servicio de Interés *
            </label>
            <select
              name="serviceInterest"
              value={formData.serviceInterest}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="web-analysis">
                Análisis de Vulnerabilidades Web
              </option>
              <option value="infrastructure">Auditoría de Infraestructura</option>
              <option value="compliance">Auditoría de Compliance</option>
              <option value="ia-inquiry">Consulta sobre IA</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Mensaje *
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={5}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            placeholder="Cuéntanos sobre tus necesidades y contexto..."
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "Enviando..." : submitText}
        </Button>
      </form>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/ConsultationForm.tsx
git commit -m "feat: create reusable ConsultationForm component"
```

---

### Task 11: Create Consultation API Endpoint

**Files:**
- Create: `src/app/api/consultation/route.ts`

**Interfaces:**
- Consumes: `ConsultationFormData` type, Prisma client
- Produces: POST endpoint that saves consultation to database and sends email

- [ ] **Step 1: Check Prisma schema for Consultation model**

First, verify if Consultation model exists in schema:

```bash
grep -A 10 "model Consultation" "E:\Cloude projects\interactiv3Web\prisma\schema.prisma"
```

If it doesn't exist, add it to `prisma/schema.prisma`:

```prisma
model Consultation {
  id        String   @id @default(cuid())
  name      String
  email     String
  phone     String
  company   String
  companySize String
  serviceInterest String
  message   String
  status    String   @default("pending") // pending, contacted, completed
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Then run migration:

```bash
npx prisma migrate dev --name add_consultation_model
```

- [ ] **Step 2: Create API endpoint**

Create `src/app/api/consultation/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ConsultationSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = ConsultationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Save to database
    const consultation = await db.consultation.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        companySize: data.companySize,
        serviceInterest: data.serviceInterest,
        message: data.message,
      },
    });

    // TODO: Send email notification to admin
    // For now, just log to console
    console.log("New consultation:", consultation);

    return NextResponse.json(
      { success: true, id: consultation.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Consultation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Add Zod validation schema**

Update `src/lib/validators.ts` to add ConsultationSchema:

```typescript
export const ConsultationSchema = z.object({
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(5, "Teléfono inválido"),
  company: z.string().min(2, "Nombre de empresa requerido"),
  companySize: z.enum(["startup", "pyme", "enterprise", "other"]),
  serviceInterest: z.enum([
    "web-analysis",
    "infrastructure",
    "compliance",
    "ia-inquiry",
    "other",
  ]),
  message: z.string().min(10, "Mensaje debe tener al menos 10 caracteres"),
});

export type ConsultationFormData = z.infer<typeof ConsultationSchema>;
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/consultation/route.ts prisma/schema.prisma
git commit -m "feat: add consultation API endpoint and database model"
```

---

### Task 12: Create /security-services Page

**Files:**
- Create: `src/app/security-services/page.tsx`

**Interfaces:**
- Consumes: `SECURITY_SERVICES`, `SECURITY_CASES`, `ProcessTimeline`, `ConsultationForm` components
- Produces: Full security services page with sections

- [ ] **Step 1: Create security-services page**

Create `src/app/security-services/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/sections/PageHeader";
import { SecurityServiceCard } from "@/components/sections/SecurityServiceCard";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { ConsultationForm } from "@/components/sections/ConsultationForm";
import { SECURITY_SERVICES } from "@/content/services/security";
import { SECURITY_CASES } from "@/content/portfolio/security-cases";

export default function SecurityServicesPage() {
  const [expandedService, setExpandedService] = useState<string | null>(null);

  return (
    <>
      {/* Page Header */}
      <PageHeader
        title="Servicios de Seguridad para PyMEs"
        subtitle="Auditorías profesionales de seguridad para proteger tu infraestructura y aplicaciones"
      />

      {/* Services Catalog Section */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            Nuestros Servicios
          </h2>

          <div className="grid md:grid-cols-1 gap-8">
            {SECURITY_SERVICES.map((service) => (
              <div
                key={service.id}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700 p-8"
              >
                <div className="flex items-start gap-6">
                  <div className="text-5xl">{service.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {service.name}
                    </h3>
                    <p className="text-gray-300 mb-4">
                      {service.fullDescription}
                    </p>

                    {/* Toggle Details */}
                    <button
                      onClick={() =>
                        setExpandedService(
                          expandedService === service.id ? null : service.id
                        )
                      }
                      className="text-cyan-400 hover:text-cyan-300 font-medium mb-4"
                    >
                      {expandedService === service.id
                        ? "Ver menos"
                        : "Ver detalles"}
                    </button>

                    {/* Expanded Details */}
                    {expandedService === service.id && (
                      <div className="mt-6 pt-6 border-t border-gray-700">
                        <div className="mb-6">
                          <h4 className="text-lg font-bold text-white mb-3">
                            ¿Qué incluye?
                          </h4>
                          <ul className="space-y-2">
                            {service.whatIncludes.map((item, idx) => (
                              <li
                                key={idx}
                                className="text-gray-300 flex items-start gap-3"
                              >
                                <span className="text-cyan-400 mt-1">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-lg font-bold text-white mb-2">
                            ¿Para quién es?
                          </h4>
                          <p className="text-gray-300">{service.forWho}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Cases Section */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            Casos de Éxito
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {SECURITY_CASES.map((caseStudy) => (
              <div
                key={caseStudy.id}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-6"
              >
                <h3 className="text-xl font-bold text-white mb-3">
                  {caseStudy.title}
                </h3>
                <p className="text-gray-300 mb-4">{caseStudy.description}</p>

                {caseStudy.content.results && (
                  <div className="pt-4 border-t border-gray-700">
                    <h4 className="text-sm font-bold text-cyan-400 mb-3">
                      Resultados:
                    </h4>
                    <ul className="space-y-2">
                      {caseStudy.content.results.map((result, idx) => (
                        <li key={idx} className="text-sm text-gray-300">
                          • {result}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <ProcessTimeline />

      {/* Consultation Form Section */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="max-w-2xl mx-auto">
          <ConsultationForm
            defaultService="web-analysis"
            title="Solicita tu Consulta de Seguridad"
            submitText="Solicitar Presupuesto"
          />
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/security-services/page.tsx
git commit -m "feat: create security-services dedicated page"
```

---

### Task 13: Enhance /agentic-ia Page

**Files:**
- Modify: `src/app/agentic-ia/page.tsx`

**Interfaces:**
- Consumes: `AGENTIC_IA_PROJECTS`, `PortfolioGrid`, `ConsultationForm`
- Produces: Enhanced agentic-ia page with filters and detail view

- [ ] **Step 1: Read current agentic-ia page**

```bash
cat "E:\Cloude projects\interactiv3Web\src\app\agentic-ia\page.tsx"
```

- [ ] **Step 2: Enhance the page**

Update `src/app/agentic-ia/page.tsx` to:
- Add PageHeader with title and subtitle
- Display AGENTIC_IA_PROJECTS using PortfolioGrid
- Add basic filters by tags (optional)
- Add ConsultationForm at bottom for IA inquiries
- Expected structure uses existing PortfolioGrid component, adapts it if needed

- [ ] **Step 3: Commit**

```bash
git add src/app/agentic-ia/page.tsx
git commit -m "feat: enhance agentic-ia page with grid and consultation form"
```

---

### Task 14: Create PortfolioItemModal Component

**Files:**
- Create: `src/components/sections/PortfolioItemModal.tsx`

**Interfaces:**
- Consumes: `PortfolioItem` type
- Produces: Modal component displaying full project/case details with variable content

- [ ] **Step 1: Create PortfolioItemModal component**

Create `src/components/sections/PortfolioItemModal.tsx`:

```typescript
"use client";

import { PortfolioItem } from "@/lib/types/portfolio";
import { Button } from "@/components/ui/Button";

interface PortfolioItemModalProps {
  item: PortfolioItem;
  isOpen: boolean;
  onClose: () => void;
}

export const PortfolioItemModal = ({
  item,
  isOpen,
  onClose,
}: PortfolioItemModalProps) => {
  if (!isOpen) return null;

  const { content } = item;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{item.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {content.shortDescription && (
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-2">
                Descripción Corta
              </h3>
              <p className="text-gray-300">{content.shortDescription}</p>
            </div>
          )}

          {content.longDescription && (
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-2">
                Descripción Completa
              </h3>
              <p className="text-gray-300">{content.longDescription}</p>
            </div>
          )}

          {/* Tech Stack */}
          {content.techStack && content.techStack.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-3">
                Stack Tecnológico
              </h3>
              <div className="flex flex-wrap gap-2">
                {content.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-cyan-900/30 border border-cyan-500 rounded-full text-sm text-cyan-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Workflow */}
          {content.workflow && (
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-2">Flujo</h3>
              <p className="text-gray-300">{content.workflow}</p>
            </div>
          )}

          {/* Results */}
          {content.results && content.results.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-3">
                Resultados
              </h3>
              <ul className="space-y-2">
                {content.results.map((result, idx) => (
                  <li key={idx} className="text-gray-300 flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{result}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benchmarks */}
          {content.benchmarks && Object.keys(content.benchmarks).length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-3">
                Benchmarks
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(content.benchmarks).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-gray-800 rounded p-4 border border-gray-700"
                  >
                    <p className="text-sm text-gray-400 mb-1">{key}</p>
                    <p className="text-lg font-bold text-cyan-400">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="pt-6 border-t border-gray-700 flex gap-3 flex-wrap">
            {content.repositoryUrl && (
              <a href={content.repositoryUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="secondary">
                  Ver Repositorio
                </Button>
              </a>
            )}
            {content.demoUrl && (
              <a href={content.demoUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm">Demo en Vivo</Button>
              </a>
            )}
            {content.videoUrl && (
              <a href={content.videoUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="secondary">
                  Ver Video
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/PortfolioItemModal.tsx
git commit -m "feat: create PortfolioItemModal component with variable content display"
```

---

## Phase 4: Testing & Deployment

### Task 15: Test All Pages Locally

**Files:**
- No new files created, testing existing work

**Steps:**

- [ ] **Step 1: Install dependencies (if needed)**

```bash
cd "E:\Cloude projects\interactiv3Web" && npm install
```

- [ ] **Step 2: Run dev server**

```bash
npm run dev
```

The server should start on `http://localhost:3000`

- [ ] **Step 3: Test home page**

Visit `http://localhost:3000` and verify:
- Hero section displays
- Security Services teaser with 3 cards appears
- Agentic IA teaser with featured projects appears
- Navigation header has new links

- [ ] **Step 4: Test security-services page**

Visit `http://localhost:3000/security-services` and verify:
- Page header displays correctly
- 3 service cards are expandable
- Success cases are visible
- Process timeline displays all 5 steps
- Consultation form renders and submits successfully (check browser console/network tab)

- [ ] **Step 5: Test agentic-ia page**

Visit `http://localhost:3000/agentic-ia` and verify:
- Page header displays
- Portfolio grid shows all projects
- Clicking project cards opens modal (once modal is integrated)
- Consultation form is present

- [ ] **Step 6: Test forms**

- Fill out consultation form on each page
- Verify submission works (check API response and database)
- Verify success message displays

- [ ] **Step 7: Test responsive design**

- Test on mobile (use browser DevTools) to ensure layouts are responsive
- Verify navigation is accessible on mobile (hamburger menu)

- [ ] **Step 8: Commit test notes**

```bash
git add -A
git commit -m "test: verify all new pages and components work locally"
```

---

### Task 16: Deploy to Vercel

**Files:**
- No new files created, deployment of existing work

**Steps:**

- [ ] **Step 1: Build locally**

```bash
npm run build
```

Verify build completes without errors.

- [ ] **Step 2: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 3: Verify Vercel deployment**

- Visit your Vercel project dashboard
- Verify deployment completes successfully
- Visit your production URL and test all pages

- [ ] **Step 4: Final verification**

- Test home page, `/security-services`, and `/agentic-ia` on production
- Verify consultation forms work on production
- Check performance metrics (Vercel dashboard)

- [ ] **Step 5: Commit**

```bash
git commit --allow-empty -m "feat: deploy website expansion to Vercel"
```

---

## Summary

**Phase 1:** Data structures, core components (SecurityServiceCard, ProcessTimeline), portfolio data  
**Phase 2:** Home page updates, teaser sections, navigation  
**Phase 3:** Security services page, consultation form, agentic-ia page enhancement, portfolio modal  
**Phase 4:** Local testing, deployment to Vercel  

**Total commits expected:** ~16 focused commits, each independently testable

---

## Validation Checklist

Before considering this work complete:

- [ ] Home page displays both Security Services and Agentic IA teasers
- [ ] `/security-services` page shows all services, cases, timeline, and form
- [ ] `/agentic-ia` page displays projects and consultation form
- [ ] Navigation updated with new links across all pages
- [ ] Consultation forms submit and save to database
- [ ] All pages responsive on mobile
- [ ] Deployed to Vercel and working on production
- [ ] No console errors or warnings
