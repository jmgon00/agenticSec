# Home Chat Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the marketing-style Home page with a full-viewport title + mock chat-inbox layout, and collapse the site-wide header navigation to a single hamburger menu.

**Architecture:** Next.js 16 App Router, client components (`"use client"`) for anything with local state (Header, MobileMenu, ChatInbox). Tailwind v4 CSS-first theming (`@theme` in `src/app/globals.css`) — reuse existing `cyan-*`/`gray-*`/`accent` utility tokens (already remapped to the blue/neutral palette), do not introduce new hardcoded hex colors. Reuse the existing shared `Button` and `Input` components from `src/components/ui/` rather than raw `<button>`/`<input>` where they fit.

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript, Tailwind CSS v4.

## Global Constraints

- No test framework exists in this repo (no jest/vitest/testing-library, no `*.test.*` files). Verification is: `npx tsc --noEmit` (must stay clean — it is clean on the current `main`) + manual check via `npm run dev` and a browser/curl request. Do not add a test framework as part of this plan — out of scope.
- `npm run lint` already fails on `main` with pre-existing errors unrelated to this work (`@typescript-eslint/no-explicit-any` in `src/lib/agents/`). Do not treat those as something to fix here; only make sure files you create/touch in this plan don't add *new* lint errors.
- Reuse the existing `cyan-*` (now blue), `magenta-*` (now yellow), `gray-*`/`accent` Tailwind tokens for all color classes — see `src/app/globals.css` `@theme` block. Do not hardcode new hex colors.
- Every new component is a named export (`export const X = () => ...`), matching every existing component in `src/components/sections/` and `src/components/ui/`.
- This plan touches only: `src/components/sections/Header.tsx`, `src/components/sections/MobileMenu.tsx` (new), `src/components/sections/ChatInbox.tsx` (new), `src/components/sections/ConditionalFooter.tsx` (new), `src/app/layout.tsx`, `src/components/sections/Hero.tsx`, `src/app/page.tsx`. It deletes `src/components/sections/SecurityServices.tsx` and `src/components/sections/AgenticIAFeatures.tsx`. No other page (`/portfolio`, `/agentic-ia`, `/security-services`, `/agentes`, `/presupuesto`) is touched.
- Spec reference: `docs/superpowers/specs/2026-07-09-home-chat-redesign-design.md`.

---

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

## Task 2: Hide the global Footer on Home only

**Files:**
- Create: `src/components/sections/ConditionalFooter.tsx`
- Modify: `src/app/layout.tsx:1-45` (swap the `Footer` import/usage for `ConditionalFooter`)

**Interfaces:**
- Consumes: existing `Footer` component (`src/components/sections/Footer.tsx`, named export `Footer`, no props) — do not modify `Footer.tsx` itself.
- Produces: `ConditionalFooter` component, named export, no props, for use in `layout.tsx`.

- [ ] **Step 1: Create `ConditionalFooter.tsx`**

```tsx
"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export const ConditionalFooter = () => {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <Footer />;
};
```

- [ ] **Step 2: Update `layout.tsx` to use it**

In `src/app/layout.tsx`, change the import:

```tsx
import { Footer } from "@/components/sections/Footer";
```
to:
```tsx
import { ConditionalFooter } from "@/components/sections/ConditionalFooter";
```

And change the JSX body from:

```tsx
      <body className="bg-gray-900 text-white">
        <Header />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
```
to:
```tsx
      <body className="bg-gray-900 text-white">
        <Header />
        <main className="pt-16">{children}</main>
        <ConditionalFooter />
      </body>
```

Also delete the now-stale comment above `Home` in `src/app/page.tsx` that references Footer duplication — this is handled in Task 5, skip here.

- [ ] **Step 3: Verify with TypeScript**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, then in another terminal:
```bash
curl -s http://localhost:3000/ | grep -c "footer"
curl -s http://localhost:3000/portfolio | grep -c "footer"
```
Expected: the `/` request shows fewer (or zero) matches for footer-related markup than `/portfolio` — confirming Home no longer renders the Footer while `/portfolio` still does. (Exact match count depends on Footer's internal markup; the point is `/` < `/portfolio`.)

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/ConditionalFooter.tsx src/app/layout.tsx
git commit -m "feat: hide global footer on home only"
```

---

## Task 3: Build the `ChatInbox` mock chat component

**Files:**
- Create: `src/components/sections/ChatInbox.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/Button` (props: `children`, `variant?`, `size?`, plus all native button props — `type`, `disabled`, etc.), `Input` from `@/components/ui/Input` (props: all native input props, plus optional `label`/`error`, which this task does not use).
- Produces: `ChatInbox` component, named export, no props, self-contained (owns its own message state). Later tasks (Task 5) import it as `import { ChatInbox } from "@/components/sections/ChatInbox";` and render `<ChatInbox />` with no props.

- [ ] **Step 1: Create `ChatInbox.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "bot",
  text: "👋 Hola, soy el asistente de AgenticSec. Preguntame lo que necesites — muy pronto voy a poder responderte con IA de verdad.",
};

const MOCK_REPLY_DELAY_MS = 600;
const MOCK_REPLY_TEXT = "Próximamente vas a poder hablar con nuestro agente de IA acá 🤖";

async function getMockReply(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_REPLY_DELAY_MS));
  return MOCK_REPLY_TEXT;
}

export const ChatInbox = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    setInput("");
    setSending(true);

    const replyText = await getMockReply();
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "bot", text: replyText }]);
    setSending(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 max-w-2xl w-full mx-auto px-4 pb-4">
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "self-end bg-cyan-500 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]"
                : "self-start bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[80%]"
            }
          >
            {message.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-800 pt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu mensaje..."
          className="flex-1"
        />
        <Button type="submit" disabled={sending}>
          Enviar
        </Button>
      </form>
    </div>
  );
};
```

- [ ] **Step 2: Verify with TypeScript**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/ChatInbox.tsx
git commit -m "feat: add ChatInbox mock chat component"
```

---

## Task 4: Simplify `Hero` to a compact title/subtitle block

**Files:**
- Modify: `src/components/sections/Hero.tsx` (full rewrite)

**Interfaces:**
- Consumes: `HERO` from `@/content/config` (existing, has `.title` and `.subtitle` string fields — unchanged).
- Produces: `Hero` component, named export, no props. Task 5 renders it above `ChatInbox` with no props.

- [ ] **Step 1: Replace `Hero.tsx` content**

```tsx
"use client";

import { HERO } from "@/content/config";

export const Hero = () => {
  return (
    <section className="text-center px-4 py-6 shrink-0">
      <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-magenta-400 to-cyan-400 bg-clip-text text-transparent animate-textGradient bg-[length:200%_auto]">
        {HERO.title}
      </h1>
      <p className="text-base md:text-lg text-gray-300 font-light">
        {HERO.subtitle}
      </p>
    </section>
  );
};
```

- [ ] **Step 2: Verify with TypeScript**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Hero.tsx
git commit -m "feat: simplify Hero to a compact title/subtitle block"
```

---

## Task 5: Rewrite the Home page to render `Hero` + `ChatInbox` only

**Files:**
- Modify: `src/app/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `Hero` from `@/components/sections/Hero` (Task 4, no props), `ChatInbox` from `@/components/sections/ChatInbox` (Task 3, no props).
- Produces: the `/` route's rendered output — later tasks don't depend on this, but this is the integration point tied together by Tasks 1–4.

- [ ] **Step 1: Replace `page.tsx` content**

```tsx
import { Hero } from "@/components/sections/Hero";
import { ChatInbox } from "@/components/sections/ChatInbox";

export default function Home() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <Hero />
      <ChatInbox />
    </div>
  );
}
```

- [ ] **Step 2: Verify with TypeScript**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Manual verification — start the dev server and check the page loads**

Run: `npm run dev` (if not already running), then:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
```
Expected: `200`

Then open `http://localhost:3000/` in a browser and confirm visually:
- Only the title ("AgenticSec"), subtitle ("Seguridad con Inteligencia Artificial"), and the chat box are visible — no security services grid, no Agentic IA feature cards, no footer.
- The page does not scroll (fits in one viewport).
- Typing a message and clicking "Enviar" shows your message on the right, then after ~600ms the bot reply appears on the left.
- Clicking the hamburger icon (top right) opens the slide-in menu with all 6 links; clicking a link or the backdrop closes it.
- Visiting `/portfolio` (or any other existing page) still shows the hamburger-only header, but the Footer still renders at the bottom of that page.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: rebuild home page as title + chat inbox"
```

---

## Task 6: Delete the now-unused `SecurityServices` and `AgenticIAFeatures` components

**Files:**
- Delete: `src/components/sections/SecurityServices.tsx`
- Delete: `src/components/sections/AgenticIAFeatures.tsx`

**Interfaces:**
- Consumes: none. This task must run after Task 5 (once `page.tsx` no longer imports these two files, they have zero remaining callers in the repo).

- [ ] **Step 1: Confirm no remaining references before deleting**

Run:
```bash
grep -rn "SecurityServices\b" src --include=*.tsx --include=*.ts
grep -rn "AgenticIAFeatures\b" src --include=*.tsx --include=*.ts
```
Expected: each command's only match is the component's own file definition (`export const SecurityServices` / `export const AgenticIAFeatures`) — no import sites anywhere else. If any other file still references them, stop and re-check Task 5 was completed correctly before deleting.

- [ ] **Step 2: Delete the files**

```bash
git rm src/components/sections/SecurityServices.tsx src/components/sections/AgenticIAFeatures.tsx
```

- [ ] **Step 3: Verify with TypeScript**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove SecurityServices and AgenticIAFeatures, unused after home redesign"
```

---

## Final check (after all tasks)

- [ ] Run `npx tsc --noEmit` one more time from repo root — must be clean.
- [ ] Run `npm run build` — must complete without errors (this also runs `prisma generate` per the existing `build` script; that's expected and unrelated to this change).
- [ ] Manually browse `/`, `/portfolio`, `/agentic-ia`, `/security-services`, `/agentes`, `/presupuesto` and confirm: Home shows the new chat layout with no footer; every other page is visually unchanged except the header nav is now hamburger-only.
