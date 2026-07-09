# Home Chat Redesign — Design Spec

**Date:** 2026-07-09
**Scope:** Home page (`/`) redesign + global Header nav change. First step of a page-by-page redesign; all other pages (Portfolio, Agentic IA, Security Services, Agentes, Presupuesto) are explicitly out of scope for this spec and keep their current layout/behavior.

## Motivation

The current Home is a marketing landing page (Hero + SecurityServices teaser + AgenticIAFeatures teaser) that duplicates content already covered by dedicated pages, and doesn't surface the newest, most distinctive feature of the site (the Agents Gallery / live chat agents). The user wants Home to become a minimal chat-first entry point: a title/subtitle and an inbox-style chat, with page navigation moved behind a hamburger menu. The chat is a static/mocked UI for now — a later task will wire it to a real AI backend.

## 1. Global Header → hamburger navigation

`src/components/sections/Header.tsx` currently renders the 6 nav links (`Inicio`, `Portfolio`, `Presupuesto`, `Agentes 🤖`, `Agentic IA`, `Servicios de Seguridad`) inline, in both a desktop `<nav>` and a mobile dropdown `<nav>` toggled by an existing hamburger button.

Change: collapse to a single presentation for **all** viewport sizes — logo + hamburger icon only in the header bar. Tapping it opens a new `MobileMenu` component: a right-side sliding drawer with a dimmed backdrop, listing the same `navLinks` array vertically. Closes on backdrop click or an "×" button.

This applies globally (every page), since `Header` is rendered once in `src/app/layout.tsx`. Existing page content on non-Home routes is unaffected — only the header chrome changes.

## 2. Footer hidden on Home only

`src/app/layout.tsx` renders `<Footer />` unconditionally after `{children}`. Change: hide it specifically on `/` (Home), since Home becomes a full-viewport, non-scrolling chat surface. All other routes keep the Footer exactly as-is.

Implementation: a small client-side check on `usePathname()` (either inline in `layout.tsx` if it can become a client component wrapper, or a tiny `ConditionalFooter` client component) that skips rendering `Footer` when the path is `/`.

## 3. Home page structure

`src/app/page.tsx` renders exactly two things:

1. A compact title/subtitle block (repurposed `Hero.tsx`, simplified — see below).
2. `ChatInbox`, a new component that fills the remaining viewport height.

No `SecurityServices` or `AgenticIAFeatures` sections remain on Home.

Layout: outer container `flex flex-col h-[calc(100vh-4rem)]` (4rem = the fixed header's height) so the whole page fits in one viewport with no page-level scroll. `ChatInbox` takes `flex-1 min-h-0` so its internal message list scrolls independently.

### Hero simplification

`Hero.tsx` keeps rendering `HERO.title` / `HERO.subtitle` from `src/content/config.ts`, but drops: `min-h-screen`, the centered full-page flex layout, the floating particle divs, and the large animated gradient background. It becomes a short header block (title + subtitle, compact vertical padding) sitting above the chat.

## 4. `ChatInbox` component (new)

Path: `src/components/sections/ChatInbox.tsx`.

State:
- `messages: { id: string; role: "user" | "bot"; text: string }[]`, seeded on mount with one bot welcome message: *"👋 Hola, soy el asistente de AgenticSec. Preguntame lo que necesites — muy pronto voy a poder responderte con IA de verdad."*
- `input: string` for the controlled text field.

Behavior:
- Submitting non-empty input appends a `user` message immediately, clears the input, then after a short delay (~600ms, to read as a "typing" beat rather than an instant canned reply) appends a fixed `bot` message: *"Próximamente vas a poder hablar con nuestro agente de IA acá 🤖"*.
- The delayed-reply logic lives in one isolated function (e.g. `getMockReply(userText: string): Promise<string>`) so swapping in a real API call later is a localized change, not a rewrite of the component.

UI: scrollable message list (auto-scrolls to bottom on new message), user bubbles right-aligned in the new primary blue, bot bubbles left-aligned in neutral gray, text input + "Enviar" button fixed at the bottom of the component.

## 5. Cleanup

`SecurityServices.tsx` and `AgenticIAFeatures.tsx` are only referenced from the current `page.tsx` (verified via repo-wide search — no other page imports them). Once removed from Home they have no remaining callers, so they are deleted outright rather than left orphaned (matching the existing orphaned `Demos.tsx`, which is out of scope to touch here).

## Out of scope

- Wiring `ChatInbox` to a real AI/agent backend (explicitly deferred).
- Any change to Portfolio, Agentic IA, Security Services, Agentes, or Presupuesto pages — those are future steps in the page-by-page pass.
- Persisting chat messages (localStorage/DB) — this is a stateless, in-memory mock for now.
