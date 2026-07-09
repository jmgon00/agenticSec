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

