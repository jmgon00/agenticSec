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

