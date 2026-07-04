# Task 2: Create Portfolio Data Structure

**Files:**
- Create: `src/content/portfolio.ts`

**Interfaces:**
- Consumes: None
- Produces: `PORTFOLIO_CASES` array with type `CaseStudy[]`

## Step 1: Define portfolio data structure

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

## Step 2: Commit

```bash
git add src/content/portfolio.ts
git commit -m "feat: add portfolio data structure and initial case studies"
```
