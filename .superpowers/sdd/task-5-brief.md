# Task 5: Create Modal Component

**Files:**
- Create: `src/components/ui/Modal.tsx`

**Interfaces:**
- Consumes: `isOpen`, `onClose`, `title`, `children` (props)
- Produces: `<Modal isOpen={bool} onClose={func} title="..." children={...} />` component

## Step 1: Create Modal component

Create `src/components/ui/Modal.tsx`:

```typescript
"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        <div className="flex justify-between items-center p-6 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
```

## Step 2: Commit

```bash
git add src/components/ui/Modal.tsx
git commit -m "feat: add Modal component for case study details"
```
