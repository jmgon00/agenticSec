# Website Expansion Design: Agentic IA + Security Services

**Date:** 2026-07-06  
**Author:** Juan Manuel González  
**Status:** Approved

---

## 1. Vision & Goals

Create a comprehensive platform that serves two primary value propositions:

1. **Agentic IA:** Showcase workflow projects using AI agents, demonstrating your expertise and evolution in agentic AI development
2. **Security Services:** Establish a channel to acquire clients for security analysis and audits targeting small/medium enterprises (PyMEs)

Both sections leverage a reusable portfolio system to scale content sustainably.

---

## 2. Target Audience & Use Cases

### Agentic IA Section
- **Audience:** Developers, AI enthusiasts, potential AI clients
- **Goals:** Demonstrate your technical depth, attract collaborators, build credibility

### Security Services Section
- **Audience:** Small/medium enterprises (PyMEs) seeking security analysis
- **Goals:** Educate on security audit value, capture consulting leads, establish trust through process transparency
- **Key insight:** Audience doesn't know what to expect from security analysis → need educational approach

---

## 3. Architecture Overview

### 3.1 Portfolio Item System (Content-First)

Generic, reusable system representing any "portfolio item" (IA project or security case study).

**Data Structure:**
```typescript
interface PortfolioItem {
  id: string;
  title: string;
  category: "agentic-ia" | "security-case";
  description: string;
  thumbnail?: string;
  tags: string[];
  featured?: boolean;
  content: {
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
  };
}

interface SecurityService {
  id: string;
  name: string;
  icon: string;
  shortDescription: string;
  fullDescription: string;
  whatIncludes: string[];
  forWho: string;
  price?: string; // null for "solicitar presupuesto"
}
```

### 3.2 File Structure

```
src/
├── content/
│   ├── portfolio/
│   │   ├── agentic-ia.ts        # IA projects data
│   │   └── security-cases.ts    # Security case studies
│   └── services/
│       └── security.ts          # Security services data
├── components/sections/
│   ├── PortfolioGrid.tsx        # Gallery grid (existing, adapt)
│   ├── PortfolioItemModal.tsx   # Detail modal (new)
│   ├── SecurityServices.tsx     # Home teaser section (new)
│   ├── SecurityServiceCard.tsx  # Service card component (new)
│   ├── ConsultationForm.tsx     # Reusable consultation form (new)
│   └── ProcessTimeline.tsx      # Process timeline visualization (new)
├── app/
│   ├── security-services/page.tsx   # Dedicated page (new)
│   ├── agentic-ia/page.tsx          # Improved existing page
│   └── api/
│       └── consultation/route.ts    # API for consultation form (new)
```

---

## 4. Pages & Sections

### 4.1 Home Page (Enhanced)

**Structure:**
1. **Hero Section** (unchanged)
2. **Security Services Teaser**
   - 3 cards showing: Web Vulnerability Analysis, Server/Infrastructure Audit, Compliance Security Audit
   - Each card: icon + name + 1-2 line description
   - CTA: "Ver todos los servicios" → `/security-services`
3. **Agentic IA Teaser**
   - 2-3 featured IA projects in grid
   - Each card: thumbnail + title + short description + tech tags
   - CTA: "Ver todos los proyectos" → `/agentic-ia`
4. **Footer** (coherent across all pages)

**Navigation Header (Updated):**
- Logo
- Nav: Inicio | Agentic IA | Servicios de Seguridad | Contacto
- Mobile: hamburger menu

---

### 4.2 Page: `/security-services` (New)

**Sections:**
1. **PageHeader**
   - Title: "Servicios de Seguridad para PyMEs"
   - Subtitle: Value proposition for SMEs
   
2. **Services Catalog**
   - 3 expandable sections or large cards:
     - Web Vulnerability Analysis
     - Server/Infrastructure Audit & Penetration Testing
     - Compliance Security Audit
   - Each shows: What's included, Who it's for, Next steps (form)

3. **Success Cases**
   - 2-3 anonymized case studies (e.g., "E-commerce with 50k users discovered 8 critical vulnerabilities")
   - Cards with problem → solution → results

4. **Testimonials**
   - 2-3 client quotes (anonymized)

5. **Work Process**
   - Visual timeline: Contact → Diagnosis → Audit → Report → Follow-up

6. **Consultation Form**
   - Fields: Name, Email, Phone, Company, Company Size, Service Interest, Message
   - CTA: "Solicitar Presupuesto"
   - Sends to backend + email notification

---

### 4.3 Page: `/agentic-ia` (Enhanced)

**Sections:**
1. **PageHeader**
   - Title: "Proyectos de IA Agentic"
   - Subtitle: Your approach with agentic workflows

2. **Filters/Tabs (Optional)**
   - By category: workflows, automation, analysis, etc.
   - By technology: Claude, LangChain, custom agents, etc.

3. **Portfolio Grid**
   - Clickable cards
   - Each project card: thumbnail + title + description + tech tags
   - Click → opens modal with detailed content (variable by project)

4. **Content Variability**
   - **Simple project:** Name, description, tech stack, repo link
   - **Detailed project:** Above + workflow diagram, results, benchmarks, documentation, demo link
   - **With demo:** Embed video or live demo

5. **Scalability**
   - Add new projects without changing components
   - Data-driven from `content/portfolio/agentic-ia.ts`

---

### 4.4 Contact/Consultation Forms (Contextualized)

**Home Contact Form:**
- Generic or dual CTA options
- "Consult about Security" or "Consult about IA"

**Security Services Form:**
- Pre-filled context: service type field
- Located on `/security-services` page
- Focused on lead capture + diagnosis

**IA Section Form:**
- Context: inquiry about IA projects
- Located on `/agentic-ia` page (footer or dedicated section)

---

## 5. Components & Reusability

| Component | Purpose | Reused For |
|-----------|---------|-----------|
| `PortfolioGrid` | Gallery layout | IA projects, security cases |
| `PortfolioItemModal` | Detail view | IA projects, security cases |
| `ConsultationForm` | Consultation input | Home, security-services, agentic-ia |
| `SecurityServiceCard` | Service display | Home teaser, security-services page |
| `ProcessTimeline` | Visual process | Security services page |

---

## 6. Data Management

### Agentic IA Projects (`content/portfolio/agentic-ia.ts`)
```typescript
export const AGENTIC_IA_PROJECTS: PortfolioItem[] = [
  {
    id: "project-1",
    title: "Project Name",
    category: "agentic-ia",
    description: "...",
    featured: true,
    content: { /* variable per project */ }
  },
  // ... more projects
];
```

### Security Cases (`content/portfolio/security-cases.ts`)
```typescript
export const SECURITY_CASES: PortfolioItem[] = [
  {
    id: "case-1",
    title: "E-commerce Vulnerability Analysis",
    category: "security-case",
    description: "...",
    content: { /* anonymized details */ }
  },
  // ... more cases
];
```

### Security Services (`content/services/security.ts`)
```typescript
export const SECURITY_SERVICES: SecurityService[] = [
  {
    id: "web-analysis",
    name: "Análisis de Vulnerabilidades en Aplicaciones Web",
    // ...
    price: null, // "solicitar presupuesto"
  },
  // ... other services
];
```

---

## 7. User Flows

### Flow 1: Discover Security Services
1. User lands on home
2. Sees Security Services teaser (3 cards)
3. Clicks "Ver todos los servicios"
4. Lands on `/security-services`
5. Reads about each service + sees cases + process
6. Fills consultation form
7. System sends lead notification

### Flow 2: Explore IA Projects
1. User lands on home
2. Sees Agentic IA teaser (2-3 featured projects)
3. Clicks "Ver todos los proyectos"
4. Lands on `/agentic-ia`
5. Browses/filters projects
6. Clicks project card → modal with details
7. Optionally views demo or repo

### Flow 3: Lead Capture
1. User on any page
2. Clicks "Contacto" or service-specific CTA
3. Form pre-filled with context
4. Submits
5. Backend saves + sends email notification to you

---

## 8. Technical Considerations

- **Database:** Use Prisma (already in place) for consultation/lead storage
- **API Endpoints:** POST `/api/consultation` to handle form submissions
- **Styling:** Maintain Tailwind v4 consistency (gradients, animations, dark mode)
- **Performance:** Lazy-load modals, optimize images for portfolio items
- **SEO:** Add metadata to new pages
- **Mobile:** Ensure responsive design on all new components

---

## 9. Implementation Phases

**Phase 1 (Quick wins):**
- Create data structures (portfolio items, security services)
- Build SecurityServiceCard, ProcessTimeline components
- Add Security Services teaser to home
- Update navigation header

**Phase 2 (Core pages):**
- Build `/security-services` page with all sections
- Create ConsultationForm component + backend API
- Build `/agentic-ia` page enhanced version

**Phase 3 (Polish):**
- Add modals and detail views
- Implement filters/tabs for IA projects
- Optimize images, performance
- Test and deploy

---

## 10. Success Criteria

✅ Home shows both Security Services and Agentic IA teasers  
✅ `/security-services` page captures consultation leads  
✅ `/agentic-ia` page displays projects with variable detail levels  
✅ Navigation is intuitive and consistent  
✅ Consultation forms are context-aware  
✅ All pages are responsive and styled consistently  
✅ Deployed on Vercel and working on production

---

## 11. Future Extensibility

This design supports:
- Adding more IA projects without code changes
- Adding more security case studies
- Introducing new service categories
- Reusing PortfolioItem for other content types (blog, testimonials, etc.)
