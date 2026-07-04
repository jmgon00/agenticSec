# Visual Redesign - Startup Modern Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform website from basic dark theme to premium startup design with Geist font, cyan/magenta palette, glassmorphism, and subtle animations.

**Architecture:**
- Update global CSS with new colors, animations, and glassmorphism utilities
- Configure Tailwind with custom theme (colors, font, animations, shadows)
- Progressively update components (buttons, cards, inputs, hero) with new styling
- Apply consistent theme across all pages
- Verify animations work smoothly and theme is cohesive

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Geist Font

## Global Constraints

- New primary color: `#00D9FF` (Cyan) — use throughout UI
- New secondary color: `#FF006E` (Magenta) — for variants/errors
- Font: Geist (Bold/SemiBold for titles, Regular for body)
- Glassmorphism: `bg-gray-900/50 backdrop-blur-lg` standard
- Animations: 300ms ease-out for interactions, 3s+ for continuous
- All components must maintain accessibility (contrast, focus states)
- No breaking changes to layout or functionality

---

## Task 1: Update globals.css with Colors & Animations

**Files:**
- Modify: `src/app/globals.css` (complete rewrite of color variables and additions)

**Interfaces:**
- Produces: CSS variables for cyan, magenta, grays + keyframe animations (gradientFlow, float, fadeInUp, slideUp)

- [ ] **Step 1: Replace color variables in :root**

Replace the entire `:root` block with:

```css
:root {
  --foreground: #ffffff;
  --background: #0a0e27;
  --primary: #00D9FF;
  --primary-dark: #00B8CC;
  --secondary: #FF006E;
  --secondary-light: #FF4D8D;
  --accent: #00F5FF;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --gray-950: #030712;
}
```

- [ ] **Step 2: Add keyframe animations before the closing style tag**

Add these animations at the end of globals.css, before any closing tags:

```css
/* Animations */
@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes textGradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Glassmorphism utility */
.glass {
  background: rgba(17, 24, 39, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 217, 255, 0.2);
}

.glass-xl {
  background: rgba(17, 24, 39, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 217, 255, 0.2);
}

/* Glow effects */
.glow-cyan {
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.4),
              inset 0 0 20px rgba(0, 217, 255, 0.1);
}

.glow-magenta {
  box-shadow: 0 0 20px rgba(255, 0, 110, 0.4),
              inset 0 0 20px rgba(255, 0, 110, 0.1);
}
```

- [ ] **Step 3: Update body styles**

Keep the existing body and heading styles, but update colors:

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    "Helvetica Neue", Arial, sans-serif;
  background-color: var(--background);
  color: var(--foreground);
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.2;
}

a {
  text-decoration: none;
  color: var(--primary);
  transition: color 200ms ease-in-out;
}

a:hover {
  color: var(--accent);
}
```

- [ ] **Step 4: Update selection & focus states**

```css
::selection {
  background-color: var(--primary);
  color: var(--background);
}

:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Test CSS loads without errors**

Run: `npm run build`
Expected: Build succeeds, no CSS errors

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "style: update globals.css with cyan/magenta palette, animations, glassmorphism"
```

---

## Task 2: Update tailwind.config.ts with Theme

**Files:**
- Modify: `tailwind.config.ts`

**Interfaces:**
- Consumes: Color variables from globals.css
- Produces: Tailwind theme with cyan/magenta colors, custom animations, glow shadows, Geist font configuration

- [ ] **Step 1: Add Geist font configuration**

Replace the entire `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        cyan: {
          50: "#f0f9ff",
          100: "#e0f8ff",
          400: "#00D9FF",
          500: "#00C2E0",
          600: "#00B8CC",
        },
        magenta: {
          400: "#FF006E",
          500: "#FF0066",
          600: "#E60060",
        },
        accent: "#00F5FF",
        primary: "#00D9FF",
        dark: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
          base: "#0a0e27",
        },
      },
      backgroundColor: {
        glass: "rgba(17, 24, 39, 0.5)",
        "glass-xl": "rgba(17, 24, 39, 0.5)",
      },
      backdropBlur: {
        lg: "8px",
        xl: "12px",
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 217, 255, 0.4), inset 0 0 20px rgba(0, 217, 255, 0.1)",
        "glow-magenta": "0 0 20px rgba(255, 0, 110, 0.4), inset 0 0 20px rgba(255, 0, 110, 0.1)",
        "cyan-lg": "0 0 30px rgba(0, 217, 255, 0.3)",
      },
      keyframes: {
        gradientFlow: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        fadeInUp: {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        slideUp: {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        textGradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        gradientFlow: "gradientFlow 3s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
        fadeInUp: "fadeInUp 0.6s ease-out",
        slideUp: "slideUp 0.6s ease-out",
        textGradient: "textGradient 3s ease-in-out infinite",
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Test TypeScript compilation**

Run: `npm run build`
Expected: Tailwind config compiles without errors

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "style: add Geist font, cyan/magenta colors, animations, glow shadows to Tailwind"
```

---

## Task 3: Update Button Component

**Files:**
- Modify: `src/components/ui/Button.tsx`

**Interfaces:**
- Consumes: Tailwind colors (cyan, magenta) + animations from config
- Produces: Button component with cyan/magenta styling, glow effects, hover animations

- [ ] **Step 1: Update Button.tsx**

Replace entire file:

```typescript
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles = `
    font-semibold rounded-lg transition-all duration-300 ease-out
    flex items-center justify-center gap-2
    hover:scale-105 active:scale-95
  `;

  const variantStyles = {
    primary: `
      bg-cyan-400 text-dark-base hover:shadow-glow-cyan hover:shadow-cyan-lg
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    `,
    secondary: `
      bg-magenta-400 text-white hover:shadow-glow-magenta
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    `,
    outline: `
      border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-dark-base
      transition-colors disabled:opacity-50 disabled:cursor-not-allowed
    `,
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

- [ ] **Step 2: Test button renders**

Run: `npm run dev`
Visit any page with a button, verify:
- Cyan background color
- Hover: scales up + glow effect
- Click: scales down smoothly

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "style: update Button with cyan/magenta styling, glow effects, smooth animations"
```

---

## Task 4: Update Card Component

**Files:**
- Modify: `src/components/ui/Card.tsx`

**Interfaces:**
- Consumes: Glassmorphism utilities from globals.css + Tailwind animations
- Produces: Card component with glassmorphism, cyan borders on hover, smooth animations

- [ ] **Step 1: Update Card.tsx**

Replace entire file:

```typescript
import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = ({ children, className = "", ...props }: CardProps) => {
  return (
    <div
      className={`
        bg-gray-900/50 backdrop-blur-lg border border-gray-800
        rounded-lg p-6 transition-all duration-300 ease-out
        hover:border-cyan-400 hover:-translate-y-1 hover:shadow-cyan-lg
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
```

- [ ] **Step 2: Test card rendering**

Run: `npm run dev`
Visit `/portfolio` page, verify:
- Cards have subtle glassmorphism (semi-transparent + blur)
- Hover: border turns cyan + lifts up (-1px translate) + glow appears

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Card.tsx
git commit -m "style: update Card with glassmorphism, cyan hover border, lift animation"
```

---

## Task 5: Update Hero Component

**Files:**
- Modify: `src/components/sections/Hero.tsx`

**Interfaces:**
- Consumes: Button component (updated), Tailwind animations, CSS gradients
- Produces: Hero section with animated gradient title, particles, proper spacing

- [ ] **Step 1: Update Hero.tsx**

Replace entire file:

```typescript
"use client";

import { HERO } from "@/content/config";
import { Button } from "@/components/ui/Button";

export const Hero = () => {
  const scrollToContact = () => {
    const contactSection = document.getElementById("contact");
    contactSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-base via-gray-950 to-gray-900 px-4 pt-20 relative overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full opacity-50 animate-float" style={{animationDelay: "0s"}}></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-magenta-400 rounded-full opacity-50 animate-float" style={{animationDelay: "2s"}}></div>
        <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-cyan-400 rounded-full opacity-50 animate-float" style={{animationDelay: "4s"}}></div>
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-accent rounded-full opacity-40 animate-float" style={{animationDelay: "1s"}}></div>
      </div>

      <div className="text-center max-w-3xl relative z-10">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 via-magenta-400 to-cyan-400 bg-clip-text text-transparent animate-textGradient bg-[length:200%_auto]">
          {HERO.title}
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8 font-light">
          {HERO.subtitle}
        </p>
        <Button size="lg" onClick={scrollToContact}>
          {HERO.cta}
        </Button>
      </div>
    </section>
  );
};
```

- [ ] **Step 2: Test hero section**

Run: `npm run dev`
Visit homepage, verify:
- Title has animated cyan→magenta→cyan gradient
- Subtitle in gray-300 is elegant and readable
- CTA button is cyan with glow
- Particles float smoothly in background

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/Hero.tsx
git commit -m "style: update Hero with animated gradient title, floating particles, modern spacing"
```

---

## Task 6: Update Header Component

**Files:**
- Modify: `src/components/sections/Header.tsx`

**Interfaces:**
- Consumes: Tailwind colors, transitions
- Produces: Header with cyan accents on hover, smooth animations

- [ ] **Step 1: Update Header.tsx**

Modify the Header to add hover effects and cyan accents:

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
          <Link
            href="/"
            className="text-white font-bold text-xl hover:text-cyan-400 transition-colors duration-200"
          >
            JMG
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-cyan-400 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white hover:text-cyan-400 transition-colors duration-200"
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
                className="text-gray-300 hover:text-cyan-400 px-2 py-2 rounded transition-colors duration-200"
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

- [ ] **Step 2: Test header**

Run: `npm run dev`
Verify:
- Logo + nav links turn cyan on hover
- Transitions smooth (200ms)
- Mobile menu works

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/Header.tsx
git commit -m "style: add cyan hover effects, smooth transitions to Header"
```

---

## Task 7: Update Input & Modal Components

**Files:**
- Modify: `src/components/ui/Input.tsx`
- Modify: `src/components/ui/Modal.tsx`

**Interfaces:**
- Consumes: Tailwind colors, glassmorphism utilities
- Produces: Input with cyan focus glow, Modal with glassmorphism

- [ ] **Step 1: Update Input.tsx**

Replace entire file:

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({
  label,
  error,
  className = "",
  ...props
}: InputProps) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {props.required && <span className="text-magenta-400"> *</span>}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2 bg-gray-900/30 border rounded-lg
          text-white placeholder-gray-500 transition-all duration-200
          focus:outline-none focus:border-cyan-400 focus:shadow-cyan-lg focus:shadow-glow-cyan
          ${error ? "border-magenta-400" : "border-gray-800"}
          backdrop-blur-sm
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-magenta-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Update Modal.tsx**

Replace entire file:

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
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-cyan-400/30 glass-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-800 sticky top-0 bg-gray-900/80 backdrop-blur-lg">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-cyan-400 text-2xl transition-colors duration-200"
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

- [ ] **Step 3: Test components**

Run: `npm run dev`
Visit `/presupuesto` and `/portfolio`:
- Inputs have cyan glow on focus
- Modal has glassmorphism effect

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Input.tsx src/components/ui/Modal.tsx
git commit -m "style: add glassmorphism + cyan focus effects to Input and Modal"
```

---

## Task 8: Apply Theme to All Pages & Final Testing

**Files:**
- Verify all pages render correctly with new theme

**Interfaces:**
- Consumes: All updated components
- Produces: Cohesive startup design across entire site

- [ ] **Step 1: Visual inspection of all pages**

Run: `npm run dev`

Visit each page and verify:
- `/`: Hero with gradient title, particles, cyan CTA, glassmorphic cards
- `/portfolio`: Cards with glassmorphism, cyan hover borders, modal works
- `/presupuesto`: Form inputs with cyan focus, glassmorphic form
- `/agentic-ia`: Tabs with cyan active state, clean typography

- [ ] **Step 2: Test on mobile**

DevTools mobile view:
- Header responsive
- Hero readable
- Cards stack properly
- No horizontal scroll

- [ ] **Step 3: Test animations performance**

Run: `npm run build`
Expected: Build succeeds, no errors
Verify animations don't cause jank (use DevTools Performance tab if available)

- [ ] **Step 4: Verify dark theme consistency**

All backgrounds: dark-base (#0a0e27) or gray-900/gray-950
All text: white or gray-300
All accents: cyan-400 or magenta-400
No light colors leaking through

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "style: complete visual redesign - startup modern minimal design system implemented and tested"
```

---

## Success Criteria

- [ ] All colors updated to cyan/magenta palette
- [ ] Glassmorphism applied to cards, inputs, modals
- [ ] Button has glow effect and smooth hover animations
- [ ] Hero has animated gradient title + floating particles
- [ ] Header has cyan hover effects
- [ ] All animations smooth (300ms or 3s+)
- [ ] Mobile responsive maintained
- [ ] Dark theme consistent across all pages
- [ ] No broken components or functionality
- [ ] Build succeeds without errors

---

## Notes

- If Geist font doesn't load, system fonts fallback (no visual break)
- Glassmorphism works on modern browsers; older browsers get solid backgrounds
- All animations use CSS (no JavaScript), ensuring smooth 60fps
- Glow effects use `box-shadow` (GPU accelerated)
- Particles are pure CSS animations (no performance impact)
