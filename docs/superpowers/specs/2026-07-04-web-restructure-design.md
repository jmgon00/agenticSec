# Web Restructure Design - Hybrid Landing + Sub-Pages
**Date:** 2026-07-04  
**Project:** interactiv3Web  
**Status:** Approved for implementation

---

## Overview

Restructure the website from single-page to a hybrid model with a landing page (`/`) and three dedicated sub-pages (`/portfolio`, `/presupuesto`, `/agentic-ia`). This allows better organization, deeper content, and strategic positioning of Agentic IA as the key differentiator.

---

## Navigation Architecture

### Pages and Routes

| Route | Purpose | Content Type |
|-------|---------|--------------|
| `/` | Landing page | Hero, About (summary), Services (summary), CTAs, Footer |
| `/portfolio` | Portfolio of work | Grid of case studies with expandable modals |
| `/presupuesto` | Budget inquiry | Contact form for custom quote requests |
| `/agentic-ia` | Product/service showcase | Tabbed interface with deep content |

### Header/Navigation (Persistent)

- Logo/brand link → `/`
- Navigation links: Home, Portfolio, Presupuesto, Agentic IA
- Consistent across all pages
- Responsive menu for mobile

---

## Page Specifications

### 1. Landing Page (`/`)

**Purpose:** Quick introduction, drive traffic to sub-pages

**Sections:**
1. Hero - Main pitch and value proposition
2. About - Brief summary of who you are
3. Services - Quick overview of what you offer
4. CTAs to sub-pages:
   - "Ver Portfolio" → `/portfolio`
   - "Solicitar Presupuesto" → `/presupuesto`
   - "Descubre Agentic IA" → `/agentic-ia`
5. Footer - Links, contact info

**Structure:** Keep existing layout, add navigation links to new pages

---

### 2. Portfolio Page (`/portfolio`)

**Purpose:** Showcase analysis, results, and project success

**Layout:** Fluid masonry grid, responsive design
- Each case study appears as a clickable card
- Mix of sizes for visual interest and flow
- Includes text and visual space (images, videos)

**Card Content:**
- Project/analysis title
- Problem → Solution → Results
- Technologies/tools used
- Visual assets (screenshots, videos)

**Interactivity:**
- **Desktop:** Hover shows preview, click expands to modal or detailed view
- **Mobile:** Tap/click to expand full details in modal or overlay

**Data Structure (to be populated later):**
```
[
  {
    id: string,
    title: string,
    category: string,
    problem: string,
    solution: string,
    results: string,
    technologies: string[],
    image: string,
    video?: string
  }
]
```

---

### 3. Budget/Presupuesto Page (`/presupuesto`)

**Purpose:** Collect inquiry details for custom quote requests (MVP)

**Form Fields:**
- `name` (text, required)
- `email` (email, required)
- `company` (text, optional)
- `projectType` (select: Análisis, Automatización, Desarrollo, Otro)
- `description` (textarea, required)
- `timeline` (select: ASAP, 1-3 months, 3-6 months, flexible)
- `tentativeBudget` (text, optional)
- `preferredContact` (radio: Email, WhatsApp, Phone)

**Form Behavior:**
- Client-side validation
- Submit to existing `/api/contact` endpoint or new `/api/budget` endpoint
- Success state: confirmation message + email sent
- Error handling: clear error messages

**Future Enhancement (Not MVP):**
- Convert to interactive calculator (option A from brainstorm)
- Real-time price estimates based on selections

**Note:** Reuse existing Contact form component with modifications for budget-specific fields

---

### 4. Agentic IA Page (`/agentic-ia`)

**Purpose:** Showcase Agentic IA as key differentiator with deep, multi-angle content

**Layout:** Tabbed interface with 5 main sections

**Tabs:**

1. **Concepto (Concept)**
   - What is Agentic IA?
   - Conceptual explanation + technical details
   - Why it's different from traditional AI
   - Length: 500-1000 words + visuals

2. **Para tu negocio (For Your Business)**
   - Why it matters to clients
   - Real-world applications and benefits
   - Industry-specific use cases
   - Length: 600-1000 words + case examples

3. **Mi metodología (My Methodology)**
   - Your unique approach to implementing Agentic IA
   - Differentiator: how you use it differently
   - Process/workflow
   - Length: 800-1200 words + diagrams/flow charts

4. **Casos de uso (Use Cases)**
   - Concrete, real-world examples
   - For each case: problem → solution → result
   - Can link to portfolio items if applicable
   - Length: Multiple subsections, visually organized

5. **Pruébalo (Try It)**
   - Interactive demo or tool (if available now, otherwise placeholder)
   - Allow user to experience Agentic IA firsthand
   - Fallback: video demo or detailed walkthrough

**Content Style:**
- Mix of text, images, videos, diagrams
- Fluid between sections and whitespace
- Accessible to both technical and non-technical audiences
- Engaging, not overwhelming

---

## Technical Implementation

### Component Architecture

**New Components Needed:**
- `PortfolioGrid` - Masonry layout container
- `CaseStudyCard` - Individual case study card
- `CaseStudyModal` - Expanded view for case study
- `BudgetForm` - Form for presupuesto page
- `AgenticIATabs` - Tab navigation and content
- `PageHeader` - Page-level hero/title component

**Reusable Components (Existing):**
- `Button` - CTAs, form submissions
- `Card` - Layout base
- `Input`, `Select`, `Textarea` - Form fields

### Data Management

**Portfolio cases:** Store in `content/portfolio.ts` (similar to config pattern)
**Agentic IA content:** Store in `content/agentic-ia.ts` (by tab)
**Form submissions:** POST to `/api/budget` (or extend `/api/contact`)

### Routing

```
src/app/
├── page.tsx (landing)
├── portfolio/
│   └── page.tsx
├── presupuesto/
│   └── page.tsx
├── agentic-ia/
│   └── page.tsx
├── layout.tsx (with header/nav)
└── api/
    └── budget/ (or extend contact)
```

### Styling

- Maintain existing Tailwind CSS approach
- Keep dark theme consistent
- Ensure responsiveness (mobile-first)
- Grid layouts for portfolio (CSS Grid or Tailwind grid utilities)

---

## Success Criteria

- [ ] All three sub-pages exist and are routable
- [ ] Navigation header works on all pages
- [ ] Portfolio grid displays cases with expand/modal interaction
- [ ] Presupuesto form submits successfully
- [ ] Agentic IA tabs switch between sections smoothly
- [ ] All pages are mobile-responsive
- [ ] Styling is consistent with landing page
- [ ] No broken links between pages

---

## Out of Scope (Future)

- Budget calculator with real-time pricing (future enhancement)
- Interactive Agentic IA demo tool (if not available now)
- Advanced analytics/tracking
- CMS integration (static content for now)

---

## Notes

- Portfolio cases can be populated incrementally as you build them
- Agentic IA content is the key differentiator—should be well-polished and compelling
- Form submissions need proper email notifications (use existing setup or extend it)
- Consider future expansion: blog, testimonials, pricing tiers
