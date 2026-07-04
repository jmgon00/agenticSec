# Task 7: Create CaseStudyCard Component

**Files:**
- Create: `src/components/sections/CaseStudyCard.tsx`

**Interfaces:**
- Consumes: `caseStudy: CaseStudy`, `onExpand: (id: string) => void` (props)
- Produces: `<CaseStudyCard caseStudy={...} onExpand={func} />` component

**Dependencies:**
- Imports from `src/content/portfolio` the `CaseStudy` interface
- Uses `<Card />` from `src/components/ui/Card`

## Step 1: Create CaseStudyCard component

Create `src/components/sections/CaseStudyCard.tsx`:

```typescript
"use client";

import { CaseStudy } from "@/content/portfolio";
import { Card } from "@/components/ui/Card";

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  onExpand: (id: string) => void;
}

export const CaseStudyCard = ({ caseStudy, onExpand }: CaseStudyCardProps) => {
  return (
    <div
      onClick={() => onExpand(caseStudy.id)}
      className="cursor-pointer group"
    >
      <Card className="h-full overflow-hidden hover:border-blue-500 transition-all transform hover:scale-105">
        <div className="relative h-48 bg-gray-800 overflow-hidden">
          {caseStudy.image ? (
            <img
              src={caseStudy.image}
              alt={caseStudy.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-gray-900">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="text-xs font-semibold text-blue-400 mb-2 uppercase">
            {caseStudy.category}
          </div>
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
            {caseStudy.title}
          </h3>
          <p className="text-sm text-gray-300 line-clamp-2">
            {caseStudy.problem}
          </p>
        </div>
      </Card>
    </div>
  );
};
```

## Step 2: Commit

```bash
git add src/components/sections/CaseStudyCard.tsx
git commit -m "feat: add CaseStudyCard component for portfolio grid"
```
