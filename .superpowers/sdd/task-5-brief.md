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

