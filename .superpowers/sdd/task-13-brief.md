# Task 13: Create AgenticIATabs Component

**Files:**
- Create: `src/components/sections/AgenticIATabs.tsx`

**Interfaces:**
- Consumes: `tabs: AgenticIATab[]` (props)
- Produces: `<AgenticIATabs tabs={...} />` component with tab switching

**Dependencies:**
- Imports from `src/content/agentic-ia` the `AgenticIATab` interface

## Step 1: Create AgenticIATabs component

Create `src/components/sections/AgenticIATabs.tsx`:

```typescript
"use client";

import { useState } from "react";
import { AgenticIATab } from "@/content/agentic-ia";

interface AgenticIATabsProps {
  tabs: AgenticIATab[];
}

export const AgenticIATabs = ({ tabs }: AgenticIATabsProps) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-8 border-b border-gray-800 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 whitespace-nowrap font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "text-blue-400 border-blue-400"
                  : "text-gray-400 hover:text-gray-300 border-transparent"
              }`}
            >
              {tab.labelEs}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="prose prose-invert max-w-none">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={activeTab === tab.id ? "block" : "hidden"}
            >
              <div className="text-gray-300 space-y-4 whitespace-pre-wrap">
                {tab.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
```

## Step 2: Commit

```bash
git add src/components/sections/AgenticIATabs.tsx
git commit -m "feat: add AgenticIATabs component with tab switching"
```
