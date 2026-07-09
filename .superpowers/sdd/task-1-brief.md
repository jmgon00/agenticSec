## Task 1: Collapse Header to a hamburger-only nav with a slide-in `MobileMenu`

**Files:**
- Create: `src/components/sections/MobileMenu.tsx`
- Modify: `src/components/sections/Header.tsx` (full rewrite of the component body)

**Interfaces:**
- Produces: `MobileMenu` component with props `{ links: { href: string; label: string }[]; open: boolean; onClose: () => void }`, named export `MobileMenu`.
- Consumes: none (this task has no dependency on other tasks).

- [ ] **Step 1: Create `MobileMenu.tsx`**

```tsx
"use client";

import Link from "next/link";

interface MobileMenuLink {
  href: string;
  label: string;
}

interface MobileMenuProps {
  links: MobileMenuLink[];
  open: boolean;
  onClose: () => void;
}

export const MobileMenu = ({ links, open, onClose }: MobileMenuProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <nav className="absolute top-0 right-0 h-full w-64 bg-gray-950 border-l border-gray-800 flex flex-col p-6 gap-2">
        <button
          type="button"
          aria-label="Cerrar menú"
          className="self-end text-white hover:text-cyan-400 mb-4 text-2xl leading-none transition-colors duration-200"
          onClick={onClose}
        >
          ×
        </button>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-gray-300 hover:text-cyan-400 px-2 py-3 rounded transition-colors duration-200 text-lg"
            onClick={onClose}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};
```

- [ ] **Step 2: Rewrite `Header.tsx` to drop the inline desktop/mobile nav lists and use `MobileMenu`**

Replace the entire file content with:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileMenu } from "./MobileMenu";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/presupuesto", label: "Presupuesto" },
  { href: "/agentes", label: "Agentes 🤖" },
  { href: "/agentic-ia", label: "Agentic IA" },
  { href: "/security-services", label: "Servicios de Seguridad" },
];

export const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-gray-800 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-white hover:text-cyan-400 font-bold text-xl transition-colors duration-200">
            AgenticSec
          </Link>

          <button
            type="button"
            aria-label="Abrir menú"
            className="text-white hover:text-cyan-400 transition-colors duration-200"
            onClick={() => setMenuOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <MobileMenu links={navLinks} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
};
```

- [ ] **Step 3: Verify with TypeScript**

Run: `npx tsc --noEmit`
Expected: no output (clean, same as before this task).

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/MobileMenu.tsx src/components/sections/Header.tsx
git commit -m "feat: collapse header nav to a hamburger + slide-in menu on all pages"
```

---

