# Task 1: Create Header Component

**Files:**
- Create: `src/components/sections/Header.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: None (uses Next.js routing)
- Produces: `<Header />` component with navigation links to `/`, `/portfolio`, `/presupuesto`, `/agentic-ia`

## Step 1: Create Header component

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

## Step 2: Update layout.tsx to include Header

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

## Step 3: Test header renders on landing page

Run: `npm run dev`
Visit: `http://localhost:3000`
Expected: Header visible at top with logo and nav links

## Step 4: Commit

```bash
git add src/components/sections/Header.tsx src/app/layout.tsx
git commit -m "feat: add persistent header navigation across all pages"
```
