# Task 14: Create Agentic IA Page

**Files:**
- Create: `src/app/agentic-ia/page.tsx`

**Interfaces:**
- Consumes: `AGENTIC_IA_CONTENT` from `src/content/agentic-ia.ts`
- Produces: `/agentic-ia` route

**Dependencies:**
- Uses `<PageHeader />` from `src/components/sections/PageHeader`
- Uses `<AgenticIATabs />` from `src/components/sections/AgenticIATabs`
- Imports `AGENTIC_IA_CONTENT` from `src/content/agentic-ia`

## Step 1: Create agentic-ia page

Create `src/app/agentic-ia/page.tsx`:

```typescript
import { PageHeader } from "@/components/sections/PageHeader";
import { AgenticIATabs } from "@/components/sections/AgenticIATabs";
import { AGENTIC_IA_CONTENT } from "@/content/agentic-ia";

export default function AgenticIAPage() {
  return (
    <main>
      <PageHeader
        title="Agentic IA"
        subtitle="Tu diferenciador: Automatización inteligente de procesos de seguridad"
      />
      <AgenticIATabs tabs={AGENTIC_IA_CONTENT} />
    </main>
  );
}
```

## Step 2: Commit

```bash
git add src/app/agentic-ia/page.tsx
git commit -m "feat: add Agentic IA page with tabbed content"
```
