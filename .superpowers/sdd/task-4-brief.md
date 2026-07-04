# Task 4: Create PageHeader Component

**Files:**
- Create: `src/components/sections/PageHeader.tsx`

**Interfaces:**
- Consumes: `title`, `subtitle` (props)
- Produces: `<PageHeader title="..." subtitle="..." />` component

## Step 1: Create PageHeader component

Create `src/components/sections/PageHeader.tsx`:

```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  return (
    <section className="min-h-[40vh] flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 px-4 py-20">
      <div className="text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-gray-300">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
};
```

## Step 2: Commit

```bash
git add src/components/sections/PageHeader.tsx
git commit -m "feat: add PageHeader component for page titles"
```
