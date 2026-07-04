# Task 9: Create PortfolioGrid Component

**Files:**
- Create: `src/components/sections/PortfolioGrid.tsx`

**Interfaces:**
- Consumes: `cases: CaseStudy[]` (props), state: `selectedCase`
- Produces: `<PortfolioGrid cases={...} />` component with grid + modal

**Dependencies:**
- Imports from `src/content/portfolio` the `CaseStudy` interface
- Uses `<CaseStudyCard />` from `src/components/sections/CaseStudyCard`
- Uses `<CaseStudyModal />` from `src/components/sections/CaseStudyModal`

## Step 1: Create PortfolioGrid component

Create `src/components/sections/PortfolioGrid.tsx`:

```typescript
"use client";

import { useState } from "react";
import { CaseStudy } from "@/content/portfolio";
import { CaseStudyCard } from "./CaseStudyCard";
import { CaseStudyModal } from "./CaseStudyModal";

interface PortfolioGridProps {
  cases: CaseStudy[];
}

export const PortfolioGrid = ({ cases }: PortfolioGridProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedCase = cases.find((c) => c.id === selectedId) || null;

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
          {cases.map((caseStudy) => (
            <CaseStudyCard
              key={caseStudy.id}
              caseStudy={caseStudy}
              onExpand={(id) => setSelectedId(id)}
            />
          ))}
        </div>

        <CaseStudyModal
          caseStudy={selectedCase}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </section>
  );
};
```

## Step 2: Commit

```bash
git add src/components/sections/PortfolioGrid.tsx
git commit -m "feat: add PortfolioGrid component with case study grid and modal"
```
