# Home Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the home page to showcase only the Interactiv3Web brand and Agentic IA feature, removing all other sections (About, Services, Portfolio, Budget, Demos, Contact CTA).

**Architecture:** The home page will be drastically simplified to a two-section layout: (1) a hero section displaying "Interactiv3Web" as the main title with "Seguridad con Inteligencia Artificial" as the subtitle, and (2) a new Agentic IA preview section featuring 4 feature cards (Automatización, Análisis en Tiempo Real, Reportes, Escalabilidad) with a CTA to navigate to the full Agentic IA page. All other sections will be removed from the home page entirely.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS 4, TypeScript 5

## Global Constraints

- Follow existing color scheme: cyan-400 primary, magenta-400 accent
- Maintain glassmorphism design pattern with backdrop-blur-lg and border borders
- Use existing Button component from `@/components/ui/Button`
- No breaking changes to existing page routes (portfolio, presupuesto, agentic-ia remain functional)
- All new components must use "use client" directive

---

### Task 1: Update Hero Content Configuration

**Files:**
- Modify: `src/content/config.ts:13-17`

**Interfaces:**
- Consumes: Nothing (standalone config update)
- Produces: Updated `HERO` object with new title and subtitle for consumption by Hero component

**Steps:**

- [ ] **Step 1: Update the HERO configuration**

Open `src/content/config.ts` and replace the HERO object:

```typescript
export const HERO = {
  title: "Interactiv3Web",
  subtitle: "Seguridad con Inteligencia Artificial",
  cta: "Descubre cómo",
};
```

- [ ] **Step 2: Verify the change**

Check that the file now shows the new title and subtitle values.

- [ ] **Step 3: Commit**

```bash
git add src/content/config.ts
git commit -m "feat: update Hero content for Interactiv3Web brand"
```

---

### Task 2: Create AgenticIAFeatures Component

**Files:**
- Create: `src/components/sections/AgenticIAFeatures.tsx`

**Interfaces:**
- Consumes: Button component from `@/components/ui/Button`
- Produces: `AgenticIAFeatures` export (React component), renders 4 feature cards with title, description, icon, and CTA button

**Steps:**

- [ ] **Step 1: Create the component file**

Create `src/components/sections/AgenticIAFeatures.tsx` with the following content:

```typescript
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

const features = [
  {
    id: "automation",
    icon: "⚙️",
    title: "Automatización Inteligente",
    description: "IA que trabaja 24/7 sin intervención humana, ejecutando tareas complejas de forma autónoma.",
  },
  {
    id: "real-time",
    icon: "⚡",
    title: "Análisis en Tiempo Real",
    description: "Procesa datos de seguridad al instante, identificando amenazas antes de que causen daño.",
  },
  {
    id: "reports",
    icon: "📊",
    title: "Reportes Automáticos",
    description: "Genera informes de compliance y seguridad sin esfuerzo manual, siempre actualizados.",
  },
  {
    id: "scalability",
    icon: "📈",
    title: "Escalabilidad",
    description: "Maneja múltiples tareas simultáneamente, creciendo con tu organización sin límites.",
  },
];

export const AgenticIAFeatures = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-dark-base px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-4 text-center">
          Agentic IA
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Automatización inteligente para seguridad. Agentes autónomos que trabajan para ti.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-6 hover:border-cyan-400 hover:shadow-cyan-lg transition-all duration-200 ease-out"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/agentic-ia">
            <Button size="lg">
              Explorar Agentic IA →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
```

- [ ] **Step 2: Verify the component renders correctly**

Check that the file is created and has proper syntax highlighting.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/AgenticIAFeatures.tsx
git commit -m "feat: create AgenticIAFeatures component with 4 feature cards"
```

---

### Task 3: Update Home Page Structure

**Files:**
- Modify: `src/app/page.tsx:1-68`

**Interfaces:**
- Consumes: `Hero` component, `AgenticIAFeatures` component, `Footer` component
- Produces: Simplified home page with only Hero and AgenticIAFeatures sections

**Steps:**

- [ ] **Step 1: Replace the entire page.tsx content**

Open `src/app/page.tsx` and replace its content with:

```typescript
import { Hero } from "@/components/sections/Hero";
import { AgenticIAFeatures } from "@/components/sections/AgenticIAFeatures";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <AgenticIAFeatures />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 2: Verify imports are correct**

Check that both `Hero` and `AgenticIAFeatures` are imported and no unused imports remain.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: simplify home page to Hero + AgenticIAFeatures sections"
```

---

### Task 4: Update Hero Component CTA

**Files:**
- Modify: `src/components/sections/Hero.tsx:7-10`

**Interfaces:**
- Consumes: `HERO` config from `src/content/config.ts` (which was updated in Task 1)
- Produces: Hero component with updated CTA that scrolls to AgenticIAFeatures section

**Steps:**

- [ ] **Step 1: Add an ID to the AgenticIAFeatures section**

First, update `src/components/sections/AgenticIAFeatures.tsx` to add an ID to the section:

Change line 15 from:
```typescript
<section className="py-20 bg-gradient-to-b from-gray-900 to-dark-base px-4">
```

To:
```typescript
<section id="agentic-ia" className="py-20 bg-gradient-to-b from-gray-900 to-dark-base px-4">
```

- [ ] **Step 2: Update Hero component scroll target**

Open `src/components/sections/Hero.tsx` and update the `scrollToContact` function to scroll to the new section:

Change:
```typescript
const scrollToContact = () => {
  const contactSection = document.getElementById("contact");
  contactSection?.scrollIntoView({ behavior: "smooth" });
};
```

To:
```typescript
const scrollToAgenticIA = () => {
  const section = document.getElementById("agentic-ia");
  section?.scrollIntoView({ behavior: "smooth" });
};
```

- [ ] **Step 3: Update the button onClick handler**

Change the Button element from:
```typescript
<Button size="lg" onClick={scrollToContact}>
  {HERO.cta}
</Button>
```

To:
```typescript
<Button size="lg" onClick={scrollToAgenticIA}>
  {HERO.cta}
</Button>
```

- [ ] **Step 4: Verify the changes**

Check that the Hero component now has `scrollToAgenticIA` function and the button calls it.

- [ ] **Step 5: Commit both changes**

```bash
git add src/components/sections/AgenticIAFeatures.tsx src/components/sections/Hero.tsx
git commit -m "feat: connect Hero CTA to AgenticIAFeatures section"
```

---

### Task 5: Test Home Page in Browser

**Files:**
- None (testing only)

**Interfaces:**
- Consumes: Home page, Hero component, AgenticIAFeatures component
- Produces: Visual verification that home page displays correctly

**Steps:**

- [ ] **Step 1: Open the home page in browser**

Navigate to `http://localhost:3000` in your browser.

- [ ] **Step 2: Verify Hero section displays correctly**

Check that:
- Title "Interactiv3Web" displays prominently
- Subtitle "Seguridad con Inteligencia Artificial" displays below title
- "Descubre cómo" button is visible
- Floating particles animate in the background

- [ ] **Step 3: Click the "Descubre cómo" button**

Verify that:
- Page smoothly scrolls to the AgenticIAFeatures section
- No console errors appear
- Scroll animation works smoothly

- [ ] **Step 4: Verify AgenticIAFeatures section**

Check that:
- "Agentic IA" heading displays
- Subtitle text is visible
- All 4 feature cards render (Automatización, Análisis en Tiempo Real, Reportes, Escalabilidad)
- Each card shows icon, title, and description
- Hover effects work (border turns cyan, shadow appears)
- "Explorar Agentic IA →" button is visible at bottom

- [ ] **Step 5: Click "Explorar Agentic IA" button**

Verify that:
- Page navigates to `/agentic-ia` successfully
- No 404 error appears

- [ ] **Step 6: Navigate back to home**

Verify that:
- Home page loads correctly
- All sections display as expected

- [ ] **Step 7: Test responsive design**

Check the page on different screen sizes:
- Desktop (1920px): 4 cards in one row
- Tablet (768px): 2 cards per row
- Mobile (375px): 1 card per row

- [ ] **Step 8: Commit test results**

```bash
git add -A
git commit -m "test: verify home page reorganization works in browser"
```

---

## Summary

This plan implements a complete reorganization of the home page:

1. **Task 1:** Updates the Hero section title and subtitle in the config
2. **Task 2:** Creates a new AgenticIAFeatures component with 4 feature cards
3. **Task 3:** Simplifies the home page to remove About, Services, Demos, Portfolio/Budget CTAs
4. **Task 4:** Connects the Hero CTA button to scroll to the AgenticIAFeatures section
5. **Task 5:** Comprehensive browser testing to ensure all sections work correctly

All sections work together to create a clean, focused home page that emphasizes the Interactiv3Web brand and Agentic IA capabilities.
