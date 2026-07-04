# Task 10: Create Portfolio Page

**Files:**
- Create: `src/app/portfolio/page.tsx`

**Interfaces:**
- Consumes: `PORTFOLIO_CASES` from `src/content/portfolio.ts`
- Produces: `/portfolio` route

**Dependencies:**
- Uses `<PageHeader />` from `src/components/sections/PageHeader`
- Uses `<PortfolioGrid />` from `src/components/sections/PortfolioGrid`
- Imports `PORTFOLIO_CASES` from `src/content/portfolio`

## Step 1: Create portfolio page

Create `src/app/portfolio/page.tsx`:

```typescript
import { PageHeader } from "@/components/sections/PageHeader";
import { PortfolioGrid } from "@/components/sections/PortfolioGrid";
import { PORTFOLIO_CASES } from "@/content/portfolio";

export default function PortfolioPage() {
  return (
    <main>
      <PageHeader
        title="Portfolio"
        subtitle="Proyectos completados, análisis realizados y resultados demostrables"
      />
      <PortfolioGrid cases={PORTFOLIO_CASES} />
    </main>
  );
}
```

## Step 2: Commit

```bash
git add src/app/portfolio/page.tsx
git commit -m "feat: add portfolio page with case study grid"
```
