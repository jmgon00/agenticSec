# Task 3 Report: Endpoint — accept and validate `osintSearch`, never persisted

## What I implemented

Extended `src/app/api/agents/[agent-id]/assessment/run/route.ts`'s zod schema with an optional
`osintSearch` object (`nombreCompleto` required, `telefono`/`dni` optional, `consent: z.literal(true)`
required). When present, its fields are forwarded to `runPersonalAssessment(answers, osintInput)`
(Task 2's orchestrator); when absent, the orchestrator is called with just `answers`, exactly as
before this task. Also added `export const maxDuration = 120` (the brief's exact route content
includes this — OSINT search adds a second LLM round-trip via `runOsintSearch`, so the route needs
more time budget than the default).

Critically: `osintSearch` is **never** referenced in either `prisma.personalAssessmentRun.create`
or `.update` — those calls are untouched from before this task except that `.update`'s `data`
still only draws from `outcome.findings` / `outcome.summary` / `outcome.riskScore` (the orchestrator's
*result*, not the raw search input).

Confirmed before editing that both target files matched the brief's assumptions exactly (no drift) —
mocks for `@/lib/db` and `@/lib/agents/assessment/orchestrator` were in the expected shape, and the
current 4-test suite matched what the brief describes.

Note: `.superpowers/sdd/task-3-report.md` already contained a report from an earlier task also
numbered "Task 3" (question metadata for the assessment form, `src/lib/agents/assessment/questions.ts`,
committed as `77bfe53`). Per the brief's explicit report-file path, I overwrote it with this report.
That earlier task's work is untouched — only this report file's content changed.

## TDD Evidence

### RED

Command: `npx vitest run "src/app/api/agents/[agent-id]/assessment/run/route.test.ts"`

Result (2 of 6 failing, as expected — schema had no `osintSearch` field yet):

```
❯ src/app/api/agents/[agent-id]/assessment/run/route.test.ts (6 tests | 2 failed) 21ms
   × passes osintSearch to the orchestrator but never persists it 5ms
   × rejects osintSearch without explicit consent 2ms

AssertionError: expected "vi.fn()" to be called with arguments: [ { …(28) }, ObjectContaining{…} ]
  1st vi.fn() call:  (only the 28-key answers object — no second osintSearch arg)

AssertionError: expected 404 to be 400 // Object.is equality
 - Expected: 400
 + Received: 404
```

Why expected: the old schema silently strips unknown keys (zod default, not `.strict()`), so
`osintSearch` in the body was dropped entirely — `runPersonalAssessment` was called with a single
argument (test 1 fails on the `toHaveBeenCalledWith` assertion), and the `consent: false` payload
wasn't rejected by validation, so the request fell through to the agent lookup, which returned 404
(mock not primed for that test) instead of the desired 400 (test 2 fails, for a related but slightly
different proximate reason than "explicitly rejected" — either way, confirms the field didn't exist
in the schema yet).

### GREEN

Command: `npx vitest run "src/app/api/agents/[agent-id]/assessment/run/route.test.ts"`

```
Test Files  1 passed (1)
     Tests  6 passed (6)
  Duration  390ms
```

All 6 tests pass: the 4 pre-existing + the 2 new ones.

## Full test suite result

Command: `npm test`

```
Test Files  10 passed (10)
     Tests  60 passed (60)
  Duration  1.12s
```

No regressions. `npx tsc --noEmit` also ran clean (no output, exit 0).

## Files changed

- `E:\Cloude projects\interactiv3Web\src\app\api\agents\[agent-id]\assessment\run\route.ts` — added
  `maxDuration = 120`, `osintSearchSchema`, `osintSearch` field on `requestSchema`, and conditional
  forwarding to `runPersonalAssessment`.
- `E:\Cloude projects\interactiv3Web\src\app\api\agents\[agent-id]\assessment\run\route.test.ts` —
  appended the two new test cases from the brief to the existing `describe` block.

Both replacements are byte-for-byte what the brief specified (verified by re-reading the final
route.ts against the brief's Step 4 code block). Committed as `bcd56ea`.

## Self-review findings (persistence-guarantee trace)

Grepped every occurrence of `osintSearch` in the final `route.ts`:

```
52:const osintSearchSchema = z.object({
62:  osintSearch: osintSearchSchema.optional(),
79:    const { userEmail, answers, osintSearch } = parsed.data
114:      const outcome = osintSearch
116:            nombreCompleto: osintSearch.nombreCompleto,
117:            telefono: osintSearch.telefono,
118:            dni: osintSearch.dni,
```

- Lines 52/62: schema definition only.
- Line 79: destructured from `parsed.data`, a local const — not exported, not global.
- Lines 114-118: used exclusively to build the second positional argument passed into
  `runPersonalAssessment`. This is the *only* place `osintSearch`'s fields are read after
  destructuring.
- `osintSearch` (or `nombreCompleto`/`telefono`/`dni`) does **not** appear anywhere in the
  `prisma.personalAssessmentRun.create` call (lines 104-111 — `data` is `{ agentId, userEmail,
  answers, status }`) or the `.update` call (lines 122-130 — `data` is `{ status, findings: outcome.findings,
  summary: outcome.summary, riskScore: outcome.riskScore }`). Both call sites are untouched from
  before this task except for what `outcome` already contained.
- `outcome` comes from `runPersonalAssessment`'s return value (`AssessmentOutcome`: `findings`,
  `summary`, `riskScore`) — this is the orchestrator's *result*, not an echo of the raw input.
  I additionally read `src/lib/agents/assessment/orchestrator.ts` and
  `src/lib/agents/assessment/osint-search.ts` (both from Task 1/2, already reviewed/committed, out
  of scope for me to modify) to confirm the LLM call in `runOsintSearch` is explicitly instructed
  ("NUNCA repitas textualmente el teléfono, DNI o dirección encontrados") not to echo raw PII into
  the structured `evidence` field that ends up in `findings`. This is a prompt-level (not
  code-enforced) safeguard belonging to Task 1/2's scope — noted here for completeness, not
  something I changed or need to fix.
- Conclusion: within `route.ts`, the persistence guarantee is a **hard, code-level** guarantee —
  there is no code path, conditional or otherwise, where `osintSearch`'s raw fields reach either
  Prisma call. This is deterministic, not dependent on LLM behavior.

Test verifies this genuinely, not just a 200 status: it asserts `runPersonalAssessment` was called
with the raw `osintSearch` (via `toHaveBeenCalledWith(..., expect.objectContaining({ nombreCompleto: "Juan Pérez" }))`),
then separately serializes the actual `create` and `update` mock call args with `JSON.stringify` and
asserts the fake name/phone/DNI strings are absent from each — a true black-box check on what would
actually be sent to Prisma.

`consent: false` (and by extension a missing `consent` field, since `z.literal(true)` requires the
literal value `true`) is rejected: the schema uses `z.literal(true)`, so anything other than the
literal boolean `true` fails validation, causing `requestSchema.safeParse` to fail and the route to
return 400 before ever reaching Prisma or the orchestrator. Test 6 ("rejects osintSearch without
explicit consent") confirms this at 400.

## Issues or concerns

None. Only the two named files were touched (plus this report file, which overwrote a stale report
from a differently-scoped earlier "Task 3"). Full suite green, typecheck clean, privacy guarantee
traced and confirmed at the code level.
