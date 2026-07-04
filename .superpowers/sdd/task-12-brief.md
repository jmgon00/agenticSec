# Task 12: Create Presupuesto Page

**Files:**
- Create: `src/app/presupuesto/page.tsx`

**Interfaces:**
- Consumes: `<BudgetForm />` component
- Produces: `/presupuesto` route

**Dependencies:**
- Uses `<PageHeader />` from `src/components/sections/PageHeader`
- Uses `<BudgetForm />` from `src/components/sections/BudgetForm`

## Step 1: Create presupuesto page

Create `src/app/presupuesto/page.tsx`:

```typescript
import { PageHeader } from "@/components/sections/PageHeader";
import { BudgetForm } from "@/components/sections/BudgetForm";

export default function PresupuestoPage() {
  return (
    <main>
      <PageHeader
        title="Solicitar Presupuesto"
        subtitle="Cuéntanos sobre tu proyecto y recibirás un presupuesto personalizado"
      />
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <BudgetForm />
        </div>
      </section>
    </main>
  );
}
```

## Step 2: Commit

```bash
git add src/app/presupuesto/page.tsx
git commit -m "feat: add presupuesto page with budget inquiry form"
```
