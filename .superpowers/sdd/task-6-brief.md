## Task 6: Delete the now-unused `SecurityServices` and `AgenticIAFeatures` components

**Files:**
- Delete: `src/components/sections/SecurityServices.tsx`
- Delete: `src/components/sections/AgenticIAFeatures.tsx`

**Interfaces:**
- Consumes: none. This task must run after Task 5 (once `page.tsx` no longer imports these two files, they have zero remaining callers in the repo).

- [ ] **Step 1: Confirm no remaining references before deleting**

Run:
```bash
grep -rn "SecurityServices\b" src --include=*.tsx --include=*.ts
grep -rn "AgenticIAFeatures\b" src --include=*.tsx --include=*.ts
```
Expected: each command's only match is the component's own file definition (`export const SecurityServices` / `export const AgenticIAFeatures`) — no import sites anywhere else. If any other file still references them, stop and re-check Task 5 was completed correctly before deleting.

- [ ] **Step 2: Delete the files**

```bash
git rm src/components/sections/SecurityServices.tsx src/components/sections/AgenticIAFeatures.tsx
```

- [ ] **Step 3: Verify with TypeScript**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove SecurityServices and AgenticIAFeatures, unused after home redesign"
```

---

## Final check (after all tasks)

- [ ] Run `npx tsc --noEmit` one more time from repo root — must be clean.
- [ ] Run `npm run build` — must complete without errors (this also runs `prisma generate` per the existing `build` script; that's expected and unrelated to this change).
- [ ] Manually browse `/`, `/portfolio`, `/agentic-ia`, `/security-services`, `/agentes`, `/presupuesto` and confirm: Home shows the new chat layout with no footer; every other page is visually unchanged except the header nav is now hamburger-only.
