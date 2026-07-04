# Web Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the website from single-page to a hybrid model with landing page + 3 sub-pages (portfolio, presupuesto, agentic-ia) with persistent header navigation.

**Architecture:** 
- Add persistent header/navigation component shared across all pages
- Refactor layout.tsx to include the header
- Create 3 new page routes with dedicated components
- Define content data structures for portfolio and agentic-ia
- Modify landing page to include CTAs pointing to sub-pages

**Tech Stack:** Next.js 16.2.10, React 19.2.4, Tailwind CSS 4, TypeScript 5

## Global Constraints

- All routes must be routable from any page via header navigation
- Tailwind CSS v4 with `@tailwindcss/postcss` for styling
- Follow existing component patterns (UI components in `src/components/ui/`, sections in `src/components/sections/`)
- All new components must be TypeScript with proper typing
- Form submissions use existing `/api/contact` endpoint (extend later if needed)
- Content stored in `src/content/` following existing config pattern
- Mobile-first responsive design required
- Dark theme consistency maintained

---

## File Structure

### Files to Create

```
src/
├── components/
│   ├── sections/
│   │   ├── Header.tsx (new - persistent navigation)
│   │   ├── PortfolioGrid.tsx (new)
│   │   ├── CaseStudyCard.tsx (new)
│   │   ├── CaseStudyModal.tsx (new)
│   │   ├── BudgetForm.tsx (new)
│   │   ├── AgenticIATabs.tsx (new)
│   │   └── PageHeader.tsx (new - page titles/hero)
│   └── ui/
│       ├── Modal.tsx (new - for case study details)
│       └── Textarea.tsx (new - for budget form)
├── app/
│   ├── portfolio/
│   │   └── page.tsx (new)
│   ├── presupuesto/
│   │   └── page.tsx (new)
│   ├── agentic-ia/
│   │   └── page.tsx (new)
│   ├── page.tsx (modify - add CTAs to sub-pages)
│   └── layout.tsx (modify - add header)
└── content/
    ├── config.ts (modify - add portfolio & agentic-ia data)
    ├── portfolio.ts (new)
    └── agentic-ia.ts (new)
```

### Files to Modify

- `src/app/layout.tsx` - Wrap with Header component
- `src/app/page.tsx` - Add CTAs to new pages
- `src/content/config.ts` - Keep existing, add new exports
- `src/components/sections/Footer.tsx` - Add links to new pages (optional)

---

## Task Breakdown

### Task 1: Create Header Component

**Files:**
- Create: `src/components/sections/Header.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: None (uses Next.js routing)
- Produces: `<Header />` component with navigation links to `/`, `/portfolio`, `/presupuesto`, `/agentic-ia`

- [ ] **Step 1: Create Header component**

Create `src/components/sections/Header.tsx`:

```typescript
"use client";

import Link from "next/link";
import { useState } from "react";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/presupuesto", label: "Presupuesto" },
    { href: "/agentic-ia", label: "Agentic IA" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-gray-800 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-white font-bold text-xl">
            JMG
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-white px-2 py-2 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};
```

- [ ] **Step 2: Update layout.tsx to include Header**

Modify `src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import "./globals.css";
import { SITE_CONFIG } from "@/content/config";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
  authors: [{ name: SITE_CONFIG.author }],
  openGraph: {
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-900 text-white">
        <Header />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Test header renders on landing page**

Run: `npm run dev`
Visit: `http://localhost:3000`
Expected: Header visible at top with logo and nav links

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Header.tsx src/app/layout.tsx
git commit -m "feat: add persistent header navigation across all pages"
```

---

### Task 2: Create Portfolio Data Structure

**Files:**
- Create: `src/content/portfolio.ts`

**Interfaces:**
- Consumes: None
- Produces: `PORTFOLIO_CASES` array with type `CaseStudy[]`

- [ ] **Step 1: Define portfolio data structure**

Create `src/content/portfolio.ts`:

```typescript
export interface CaseStudy {
  id: string;
  title: string;
  category: "analysis" | "automation" | "development" | "consulting";
  problem: string;
  solution: string;
  results: string;
  technologies: string[];
  image: string;
  video?: string;
}

export const PORTFOLIO_CASES: CaseStudy[] = [
  {
    id: "case-1",
    title: "Análisis de Vulnerabilidades - E-commerce",
    category: "analysis",
    problem: "Plataforma e-commerce con vulnerabilidades críticas sin identificar.",
    solution: "Audit completo usando metodología OWASP, identificación de 15 vulnerabilidades críticas.",
    results: "Reducción de riesgo de 85%, implementación de WAF y hardening de aplicación.",
    technologies: ["OWASP ZAP", "Burp Suite", "Python", "SQL"],
    image: "/images/portfolio/ecommerce-audit.jpg",
  },
  {
    id: "case-2",
    title: "Automatización de Reportes - Agente IA",
    category: "automation",
    problem: "Reportes manuales de seguridad tomaban 8 horas semanales.",
    solution: "Implementar agente IA autónomo que genera reportes automáticamente.",
    results: "Reducción de 8 horas a 30 minutos semanales, precisión 98%.",
    technologies: ["Python", "Claude API", "Pandas", "Jinja2"],
    image: "/images/portfolio/ai-reports.jpg",
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/content/portfolio.ts
git commit -m "feat: add portfolio data structure and initial case studies"
```

---

### Task 3: Create Agentic IA Data Structure

**Files:**
- Create: `src/content/agentic-ia.ts`

**Interfaces:**
- Consumes: None
- Produces: `AGENTIC_IA_CONTENT` object with 5 tabs (Concepto, Para tu negocio, Mi metodología, Casos de uso, Pruébalo)

- [ ] **Step 1: Define agentic IA content structure**

Create `src/content/agentic-ia.ts`:

```typescript
export interface AgenticIATab {
  id: string;
  label: string;
  labelEs: string;
  content: string;
}

export const AGENTIC_IA_CONTENT: AgenticIATab[] = [
  {
    id: "concepto",
    label: "Concept",
    labelEs: "Concepto",
    content: `
## ¿Qué es Agentic IA?

Agentic IA se refiere a sistemas de inteligencia artificial que actúan de manera autónoma, tomando decisiones y ejecutando tareas sin intervención humana constante.

### Diferencia con IA Tradicional

- **IA Tradicional**: Responde a inputs, genera outputs. Requiere orquestación humana.
- **Agentic IA**: Define su propio plan, ejecuta tareas, se adapta a resultados, aprende del contexto.

### Características Clave

1. **Autonomía**: Toma decisiones sin esperar aprobación
2. **Persistencia**: Mantiene estado y contexto entre interacciones
3. **Adaptabilidad**: Se ajusta a cambios en el ambiente
4. **Razonamiento**: Planifica múltiples pasos para resolver problemas

Placeholder para secciones futuras con más detalle técnico...
    `.trim(),
  },
  {
    id: "para-tu-negocio",
    label: "For Your Business",
    labelEs: "Para tu negocio",
    content: `
## Por qué Agentic IA es importante para tu negocio

La automatización de procesos complejos puede ahorrar tiempo y recursos significativos.

### Beneficios

- **Eficiencia**: Automatiza procesos que toman horas
- **Escalabilidad**: Maneja volúmenes crecientes sin recursos adicionales
- **Consistencia**: Ejecuta tareas sin fatiga humana
- **Costo**: ROI alto en procesos repetitivos

### Casos de uso en Seguridad

- Monitoreo automático de vulnerabilidades
- Análisis de logs en tiempo real
- Generación de reportes de compliance
- Respuesta automática a incidentes

Placeholder para secciones futuras con más ejemplos...
    `.trim(),
  },
  {
    id: "metodologia",
    label: "My Methodology",
    labelEs: "Mi metodología",
    content: `
## Cómo implemento Agentic IA

Mi diferenciador es combinar IA con expertise en seguridad, asegurando que cada agente:

1. **Entiende el contexto de seguridad** de tu organización
2. **Respeta restricciones** y políticas existentes
3. **Proporciona auditoría completa** de sus acciones
4. **Se integra** con tus sistemas actuales

### Proceso

1. Análisis de procesos actuales
2. Diseño de agentes específicos
3. Integración con infraestructura
4. Testing exhaustivo
5. Monitoreo y optimización

Placeholder para secciones futuras con diagramas...
    `.trim(),
  },
  {
    id: "casos-de-uso",
    label: "Use Cases",
    labelEs: "Casos de uso",
    content: `
## Casos de uso concretos

### 1. Agente de Análisis de Logs
Monitorea logs de seguridad 24/7, identifica patrones anómalos, genera alertas.

**Impacto**: Reducción de MTTR (Mean Time To Respond) de horas a minutos.

### 2. Agente de Reportes
Genera reportes de compliance automáticamente según estándares ISO, PCI-DSS, etc.

**Impacto**: Ahorro de 80% del tiempo en reporte manual.

### 3. Agente de Reconocimiento
Realiza reconocimiento automático de infraestructura, documenta cambios.

**Impacto**: Visibilidad completamente actualizada de assets.

Placeholder para secciones futuras con más casos...
    `.trim(),
  },
  {
    id: "pruebalo",
    label: "Try It",
    labelEs: "Pruébalo",
    content: `
## Prueba Agentic IA

Aquí puedes interactuar con un demo del agente (próximamente).

### Demo: Agente de Análisis
Carga logs de ejemplo y ve cómo el agente analiza e identifica patrones.

[Placeholder para demo interactiva]

O mira un walkthrough completo del sistema en acción.

[Placeholder para video]
    `.trim(),
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/content/agentic-ia.ts
git commit -m "feat: add Agentic IA content structure with 5 tabs"
```

---

### Task 4: Create PageHeader Component

**Files:**
- Create: `src/components/sections/PageHeader.tsx`

**Interfaces:**
- Consumes: `title`, `subtitle` (props)
- Produces: `<PageHeader title="..." subtitle="..." />` component

- [ ] **Step 1: Create PageHeader component**

Create `src/components/sections/PageHeader.tsx`:

```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  return (
    <section className="min-h-[40vh] flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 px-4 py-20">
      <div className="text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-gray-300">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/PageHeader.tsx
git commit -m "feat: add PageHeader component for page titles"
```

---

### Task 5: Create Modal Component

**Files:**
- Create: `src/components/ui/Modal.tsx`

**Interfaces:**
- Consumes: `isOpen`, `onClose`, `title`, `children` (props)
- Produces: `<Modal isOpen={bool} onClose={func} title="..." children={...} />` component

- [ ] **Step 1: Create Modal component**

Create `src/components/ui/Modal.tsx`:

```typescript
"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        <div className="flex justify-between items-center p-6 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Modal.tsx
git commit -m "feat: add Modal component for case study details"
```

---

### Task 6: Create Textarea Component

**Files:**
- Create: `src/components/ui/Textarea.tsx`

**Interfaces:**
- Consumes: Standard textarea HTML attributes + `label`, `error` props
- Produces: `<Textarea label="..." name="..." error="..." />` component

- [ ] **Step 1: Create Textarea component**

Create `src/components/ui/Textarea.tsx`:

```typescript
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = ({ label, error, className = "", ...props }: TextareaProps) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {props.required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors ${
          error ? "border-red-500" : "border-gray-700"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Textarea.tsx
git commit -m "feat: add Textarea component for forms"
```

---

### Task 7: Create CaseStudyCard Component

**Files:**
- Create: `src/components/sections/CaseStudyCard.tsx`

**Interfaces:**
- Consumes: `caseStudy: CaseStudy`, `onExpand: (id: string) => void` (props)
- Produces: `<CaseStudyCard caseStudy={...} onExpand={func} />` component

- [ ] **Step 1: Create CaseStudyCard component**

Create `src/components/sections/CaseStudyCard.tsx`:

```typescript
"use client";

import { CaseStudy } from "@/content/portfolio";
import { Card } from "@/components/ui/Card";

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  onExpand: (id: string) => void;
}

export const CaseStudyCard = ({ caseStudy, onExpand }: CaseStudyCardProps) => {
  return (
    <div
      onClick={() => onExpand(caseStudy.id)}
      className="cursor-pointer group"
    >
      <Card className="h-full overflow-hidden hover:border-blue-500 transition-all transform hover:scale-105">
        <div className="relative h-48 bg-gray-800 overflow-hidden">
          {caseStudy.image ? (
            <img
              src={caseStudy.image}
              alt={caseStudy.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-gray-900">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="text-xs font-semibold text-blue-400 mb-2 uppercase">
            {caseStudy.category}
          </div>
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
            {caseStudy.title}
          </h3>
          <p className="text-sm text-gray-300 line-clamp-2">
            {caseStudy.problem}
          </p>
        </div>
      </Card>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/CaseStudyCard.tsx
git commit -m "feat: add CaseStudyCard component for portfolio grid"
```

---

### Task 8: Create CaseStudyModal Component

**Files:**
- Create: `src/components/sections/CaseStudyModal.tsx`

**Interfaces:**
- Consumes: `caseStudy: CaseStudy | null`, `onClose: () => void` (props)
- Produces: `<CaseStudyModal caseStudy={...} onClose={func} />` component

- [ ] **Step 1: Create CaseStudyModal component**

Create `src/components/sections/CaseStudyModal.tsx`:

```typescript
"use client";

import { CaseStudy } from "@/content/portfolio";
import { Modal } from "@/components/ui/Modal";

interface CaseStudyModalProps {
  caseStudy: CaseStudy | null;
  onClose: () => void;
}

export const CaseStudyModal = ({ caseStudy, onClose }: CaseStudyModalProps) => {
  if (!caseStudy) return null;

  return (
    <Modal isOpen={!!caseStudy} onClose={onClose} title={caseStudy.title}>
      <div className="space-y-6">
        {caseStudy.image && (
          <img
            src={caseStudy.image}
            alt={caseStudy.title}
            className="w-full rounded-lg max-h-64 object-cover"
          />
        )}

        <div>
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Problema</h3>
          <p className="text-gray-300">{caseStudy.problem}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Solución</h3>
          <p className="text-gray-300">{caseStudy.solution}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Resultados</h3>
          <p className="text-gray-300">{caseStudy.results}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Tecnologías</h3>
          <div className="flex flex-wrap gap-2">
            {caseStudy.technologies.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {caseStudy.video && (
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Video</h3>
            <a
              href={caseStudy.video}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Ver video →
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/CaseStudyModal.tsx
git commit -m "feat: add CaseStudyModal component for detailed case views"
```

---

### Task 9: Create PortfolioGrid Component

**Files:**
- Create: `src/components/sections/PortfolioGrid.tsx`

**Interfaces:**
- Consumes: `cases: CaseStudy[]` (props), state: `selectedCase`
- Produces: `<PortfolioGrid cases={...} />` component with grid + modal

- [ ] **Step 1: Create PortfolioGrid component**

Create `src/components/sections/PortfolioGrid.tsx`:

```typescript
"use client";

import { useState } from "react";
import { CaseStudy } from "@/content/portfolio";
import { CaseStudyCard } from "./CaseStudyCard";
import { CaseStudyModal } from "./CaseStudyModal";

interface PortfolioGridProps {
  cases: CaseStudy[];
}

export const PortfolioGrid = ({ cases }: PortfolioGridProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedCase = cases.find((c) => c.id === selectedId) || null;

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
          {cases.map((caseStudy) => (
            <CaseStudyCard
              key={caseStudy.id}
              caseStudy={caseStudy}
              onExpand={(id) => setSelectedId(id)}
            />
          ))}
        </div>

        <CaseStudyModal
          caseStudy={selectedCase}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </section>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/PortfolioGrid.tsx
git commit -m "feat: add PortfolioGrid component with case study grid and modal"
```

---

### Task 10: Create Portfolio Page

**Files:**
- Create: `src/app/portfolio/page.tsx`

**Interfaces:**
- Consumes: `PORTFOLIO_CASES` from `src/content/portfolio.ts`
- Produces: `/portfolio` route

- [ ] **Step 1: Create portfolio page**

Create `src/app/portfolio/page.tsx`:

```typescript
import { PageHeader } from "@/components/sections/PageHeader";
import { PortfolioGrid } from "@/components/sections/PortfolioGrid";
import { PORTFOLIO_CASES } from "@/content/portfolio";

export default function PortfolioPage() {
  return (
    <main>
      <PageHeader
        title="Portfolio"
        subtitle="Proyectos completados, análisis realizados y resultados demostrables"
      />
      <PortfolioGrid cases={PORTFOLIO_CASES} />
    </main>
  );
}
```

- [ ] **Step 2: Test portfolio page**

Run: `npm run dev`
Visit: `http://localhost:3000/portfolio`
Expected: PageHeader + grid of case studies (2 cases from data)

- [ ] **Step 3: Commit**

```bash
git add src/app/portfolio/page.tsx
git commit -m "feat: add portfolio page with case study grid"
```

---

### Task 11: Create BudgetForm Component

**Files:**
- Create: `src/components/sections/BudgetForm.tsx`

**Interfaces:**
- Consumes: `/api/contact` endpoint (existing)
- Produces: `<BudgetForm />` component with form submission

- [ ] **Step 1: Create BudgetForm component**

Create `src/components/sections/BudgetForm.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface FormErrors {
  [key: string]: string;
}

export const BudgetForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    projectType: "",
    description: "",
    timeline: "",
    tentativeBudget: "",
    preferredContact: "email",
    honeypot: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nombre requerido";
    if (!formData.email.trim()) newErrors.email = "Email requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Email inválido";
    if (!formData.projectType) newErrors.projectType = "Tipo de proyecto requerido";
    if (!formData.description.trim()) newErrors.description = "Descripción requerida";
    if (!formData.timeline) newErrors.timeline = "Timeline requerido";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (formData.honeypot) {
      console.log("Honeypot triggered");
      setSubmitted(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          serviceType: formData.projectType,
          message: formData.description,
          budgetRange: formData.tentativeBudget || "no-specified",
          contactPreference: formData.preferredContact,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error || "Error al enviar la solicitud");
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        company: "",
        projectType: "",
        description: "",
        timeline: "",
        tentativeBudget: "",
        preferredContact: "email",
        honeypot: "",
      });

      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      setServerError("Error de conexión. Intenta de nuevo.");
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {submitted && (
        <div className="p-4 bg-green-900 border border-green-700 rounded-lg text-green-300">
          ✓ Solicitud recibida. Nos pondremos en contacto pronto.
        </div>
      )}

      {serverError && (
        <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-300">
          ✗ {serverError}
        </div>
      )}

      <Input
        label="Nombre"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Tu nombre"
        required
        error={errors.name}
      />

      <Input
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="tu@email.com"
        required
        error={errors.email}
      />

      <Input
        label="Empresa (opcional)"
        name="company"
        value={formData.company}
        onChange={handleChange}
        placeholder="Nombre de tu empresa"
        error={errors.company}
      />

      <Select
        label="Tipo de Proyecto"
        name="projectType"
        value={formData.projectType}
        onChange={handleChange}
        options={[
          { value: "", label: "Selecciona un tipo..." },
          { value: "analysis", label: "Análisis" },
          { value: "automation", label: "Automatización" },
          { value: "development", label: "Desarrollo" },
          { value: "consulting", label: "Consultoría" },
          { value: "other", label: "Otro" },
        ]}
        required
        error={errors.projectType}
      />

      <Select
        label="Timeline Deseado"
        name="timeline"
        value={formData.timeline}
        onChange={handleChange}
        options={[
          { value: "", label: "Selecciona un timeline..." },
          { value: "asap", label: "ASAP" },
          { value: "1-3", label: "1-3 meses" },
          { value: "3-6", label: "3-6 meses" },
          { value: "flexible", label: "Flexible" },
        ]}
        required
        error={errors.timeline}
      />

      <Input
        label="Presupuesto Tentativo (opcional)"
        name="tentativeBudget"
        value={formData.tentativeBudget}
        onChange={handleChange}
        placeholder="Ej: $5,000 - $10,000"
        error={errors.tentativeBudget}
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Preferencia de Contacto
        </label>
        <div className="space-y-2">
          {[
            { value: "email", label: "Email" },
            { value: "whatsapp", label: "WhatsApp" },
            { value: "phone", label: "Teléfono" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="preferredContact"
                value={option.value}
                checked={formData.preferredContact === option.value}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-gray-300">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Textarea
        label="Descripción del Proyecto"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Cuéntanos sobre tu proyecto, necesidades y objetivos..."
        required
        rows={5}
        error={errors.description}
      />

      <input
        type="text"
        name="honeypot"
        value={formData.honeypot}
        onChange={handleChange}
        style={{ display: "none" }}
        autoComplete="off"
        tabIndex={-1}
      />

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? "Enviando..." : "Solicitar Presupuesto"}
      </Button>
    </form>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/BudgetForm.tsx
git commit -m "feat: add BudgetForm component for presupuesto page"
```

---

### Task 12: Create Presupuesto Page

**Files:**
- Create: `src/app/presupuesto/page.tsx`

**Interfaces:**
- Consumes: `<BudgetForm />` component
- Produces: `/presupuesto` route

- [ ] **Step 1: Create presupuesto page**

Create `src/app/presupuesto/page.tsx`:

```typescript
import { PageHeader } from "@/components/sections/PageHeader";
import { BudgetForm } from "@/components/sections/BudgetForm";

export default function PresupuestoPage() {
  return (
    <main>
      <PageHeader
        title="Solicitar Presupuesto"
        subtitle="Cuéntanos sobre tu proyecto y recibirás un presupuesto personalizado"
      />
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <BudgetForm />
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Test presupuesto page**

Run: `npm run dev`
Visit: `http://localhost:3000/presupuesto`
Expected: Form with all fields visible

- [ ] **Step 3: Commit**

```bash
git add src/app/presupuesto/page.tsx
git commit -m "feat: add presupuesto page with budget inquiry form"
```

---

### Task 13: Create AgenticIATabs Component

**Files:**
- Create: `src/components/sections/AgenticIATabs.tsx`

**Interfaces:**
- Consumes: `tabs: AgenticIATab[]` (props)
- Produces: `<AgenticIATabs tabs={...} />` component with tab switching

- [ ] **Step 1: Create AgenticIATabs component**

Create `src/components/sections/AgenticIATabs.tsx`:

```typescript
"use client";

import { useState } from "react";
import { AgenticIATab } from "@/content/agentic-ia";

interface AgenticIATabsProps {
  tabs: AgenticIATab[];
}

export const AgenticIATabs = ({ tabs }: AgenticIATabsProps) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-8 border-b border-gray-800 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 whitespace-nowrap font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "text-blue-400 border-blue-400"
                  : "text-gray-400 hover:text-gray-300 border-transparent"
              }`}
            >
              {tab.labelEs}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="prose prose-invert max-w-none">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={activeTab === tab.id ? "block" : "hidden"}
            >
              <div className="text-gray-300 space-y-4 whitespace-pre-wrap">
                {tab.content}
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
git add src/components/sections/AgenticIATabs.tsx
git commit -m "feat: add AgenticIATabs component with tab switching"
```

---

### Task 14: Create Agentic IA Page

**Files:**
- Create: `src/app/agentic-ia/page.tsx`

**Interfaces:**
- Consumes: `AGENTIC_IA_CONTENT` from `src/content/agentic-ia.ts`
- Produces: `/agentic-ia` route

- [ ] **Step 1: Create agentic-ia page**

Create `src/app/agentic-ia/page.tsx`:

```typescript
import { PageHeader } from "@/components/sections/PageHeader";
import { AgenticIATabs } from "@/components/sections/AgenticIATabs";
import { AGENTIC_IA_CONTENT } from "@/content/agentic-ia";

export default function AgenticIAPage() {
  return (
    <main>
      <PageHeader
        title="Agentic IA"
        subtitle="Tu diferenciador: Automatización inteligente de procesos de seguridad"
      />
      <AgenticIATabs tabs={AGENTIC_IA_CONTENT} />
    </main>
  );
}
```

- [ ] **Step 2: Test agentic-ia page**

Run: `npm run dev`
Visit: `http://localhost:3000/agentic-ia`
Expected: Tabs visible, content switches when clicking tabs

- [ ] **Step 3: Commit**

```bash
git add src/app/agentic-ia/page.tsx
git commit -m "feat: add Agentic IA page with tabbed content"
```

---

### Task 15: Update Landing Page with CTAs

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: Existing sections + new CTA buttons
- Produces: Links to `/portfolio`, `/presupuesto`, `/agentic-ia`

- [ ] **Step 1: Update landing page**

Modify `src/app/page.tsx`:

```typescript
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { Demos } from "@/components/sections/Demos";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Services />
      
      {/* CTA Section to Sub-Pages */}
      <section className="py-20 bg-gray-900 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Explora más
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/portfolio" className="group">
              <div className="p-8 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-all text-center">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400">
                  Portfolio
                </h3>
                <p className="text-gray-300 mb-4">
                  Proyectos completados y resultados demostrables
                </p>
                <Button>Ver Proyectos →</Button>
              </div>
            </Link>

            <Link href="/presupuesto" className="group">
              <div className="p-8 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-all text-center">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400">
                  Presupuesto
                </h3>
                <p className="text-gray-300 mb-4">
                  Solicita un presupuesto personalizado para tu proyecto
                </p>
                <Button>Solicitar Presupuesto →</Button>
              </div>
            </Link>

            <Link href="/agentic-ia" className="group">
              <div className="p-8 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-all text-center">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400">
                  Agentic IA
                </h3>
                <p className="text-gray-300 mb-4">
                  El diferenciador: Automatización inteligente
                </p>
                <Button>Descubre Cómo →</Button>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Demos />
      <Contact />
    </main>
  );
}
```

- [ ] **Step 2: Test landing page**

Run: `npm run dev`
Visit: `http://localhost:3000`
Expected: CTA cards visible, clicking goes to respective pages

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add CTA section to landing page linking to sub-pages"
```

---

### Task 16: Integration Testing & Final Verification

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All pages and navigation
- Produces: Working site with all routes accessible

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Test all navigation links**

Visit each page via header navigation:
- `http://localhost:3000` - Landing page
- `http://localhost:3000/portfolio` - Portfolio with case studies (click to expand)
- `http://localhost:3000/presupuesto` - Budget form
- `http://localhost:3000/agentic-ia` - Tabbed Agentic IA content

Expected: All pages load, navigation works, no console errors

- [ ] **Step 3: Test responsive design**

In DevTools, test mobile (375px), tablet (768px), desktop (1024px+)
Expected: Layout adapts, header menu toggles on mobile

- [ ] **Step 4: Test interactivity**

- Portfolio: Click case studies → modal appears with full details
- Presupuesto: Fill form → submit (should go to existing API)
- Agentic IA: Click tabs → content switches smoothly

- [ ] **Step 5: Test styling consistency**

All pages use dark theme, buttons are consistent, spacing uniform
Expected: Visual continuity across pages

- [ ] **Step 6: Production build test**

Run: `npm run build`
Expected: Build completes without errors

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete web restructure with all pages and navigation"
```

- [ ] **Step 8: Push to main**

```bash
git push origin main
```

---

## Success Criteria Checklist

- [ ] All three sub-pages (`/portfolio`, `/presupuesto`, `/agentic-ia`) exist and are routable
- [ ] Header navigation works on all pages
- [ ] Landing page has CTA cards linking to sub-pages
- [ ] Portfolio grid displays case studies with expand/modal interaction
- [ ] Presupuesto form validates, submits, and shows success/error states
- [ ] Agentic IA tabs switch between 5 sections smoothly
- [ ] All pages are mobile-responsive (header menu, grid layout, forms)
- [ ] Styling is consistent with existing dark theme
- [ ] No broken links between pages
- [ ] Production build completes without errors
- [ ] Header persists across all pages via layout.tsx

---

## Notes for Implementation

1. **Portfolio data is placeholder** - Update `PORTFOLIO_CASES` with real projects as you build them
2. **Agentic IA content is partial** - Expand each tab with more detailed content
3. **Form submissions use existing API** - The form POSTs to `/api/contact` which already handles it
4. **Images are referenced** - Update image paths in portfolio data once you have assets
5. **Mobile menu closes on link** - Already handled in Header component
6. **Modal scrolling** - Modal has max-height and overflow for long content
7. **Accessibility** - Added alt text, labels, ARIA attributes where needed
8. **SEO metadata** - Consider adding page-specific metadata in future (head tags)
