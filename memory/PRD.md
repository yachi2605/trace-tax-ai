# TraceTax AI — PRD

## Original problem statement

Case study submission for GreenGrowth CPAs AI Engineer role. Build a
polished, responsive **frontend prototype** called **TraceTax AI** that
addresses three case-study challenges combined into one cohesive product:

- **Challenge 01 — Source Document Traceability**
- **Challenge 08 — Clickable vs. Editable**
- **Challenge 10 — Trustworthy AI**

The primary user is a CPA (Maya Chen) reviewing Jordan Lee's 2025
individual federal return. The grader will evaluate frontend / UX /
information architecture / working interactions — not backend
infrastructure, real OCR, or a real AI model.

## Architecture

- **React 19 + Tailwind + shadcn/ui + lucide-react + react-router-dom + sonner**
- **No backend** — all data mocked in `src/data/*.js`
- **State:** React Context + `useReducer` (`src/store/appStore.jsx`) persists
  corrections + audit events for the active browser session only.
- **Routing:** `/` (queue), `/returns/:returnId`, `/documents`, `/activity`.
- **Design language:** Chivo headings + IBM Plex Sans body + IBM Plex Mono
  for all numerical values. Navy `#0A2540` primary, restrained amber/red/green
  status colors. Nine-state shared visual language via `StatusBadge` component.

## User personas

- **Maya Chen, CPA (Senior Reviewer)** — primary user. Needs to trace,
  understand, and correct AI-generated tax values without leaving the review
  workflow.
- **Jordan Lee (Client)** — fictional client whose 2025 return is being reviewed.

## Core requirements (static)

- Review queue with 8–12 fictional returns, filters, and search
- Three-panel return workspace (section nav / fields / evidence)
- Nine field states with a shared visual language
- Confidence indicators with plain-language reasoning
- Simulated source document previews with region highlights
- Correction workflows: accept AI / keep current (with reason) / manual override (with reason)
- Original AI recommendation + evidence preserved after correction
- Locked-field explanations
- Conflict resolver
- Missing-source workflow with "Request from client"
- Aggregated-value breakdowns
- Global + per-field audit trail
- Empty search / filter states
- Toast confirmations
- Accessibility (keyboard focus, semantic buttons, labels, tooltips, contrast, icons + text)

## What's been implemented (2026-01-14)

- ✅ Review Queue with 12 fictional returns, 6 filter tabs, search, empty state, reset filters
- ✅ Return Workspace with three-panel layout, section nav, breadcrumbs, live progress/issue counters
- ✅ 13 tax fields for Jordan Lee spanning all edge cases
- ✅ 7 mock source documents with page-level region metadata
- ✅ StatusBadge, ConfidenceIndicator, LockedExplanation shared components
- ✅ EvidencePanel with Summary / Source / Reasoning / History tabs
- ✅ DocumentPreview with W-2, W-2c, 1099-INT, 1098, donation receipt, worksheet simulated layouts + amber highlight overlay + zoom
- ✅ ReviewActionDialog with accept / keep / manual modes, required-reason validation
- ✅ Conflict resolver, request-document, resolve-conflict workflows
- ✅ Aggregation breakdown view (Interest = 1099-INT sum)
- ✅ Activity page with 16 initial audit events + live events from user actions
- ✅ Documents page with document library + preview
- ✅ TopBar with brand mark + primary nav + reviewer profile
- ✅ Toast confirmations on all correction actions
- ✅ README with challenges addressed, functional vs. simulated, design decisions, tech stack, run/deploy instructions
- ✅ Frontend testing: 25/25 acceptance criteria passed (iteration_1.json)

## Prioritized backlog (P0/P1/P2)

**P1** (would enhance case study submission):
- Add a tablet/narrower drawer mode for the evidence panel (currently desktop-optimized)
- Add keyboard shortcuts (arrow keys to navigate fields, `a` to accept, `k` to keep, `e` to enter value)
- Wire up more than Jordan Lee — let a second return (e.g. Camille Rousseau, Sch E) show real fields

**P2** (nice-to-have):
- Filter/search inside the Activity page (by actor, by date)
- Export audit trail as CSV/PDF
- Compare-side-by-side view for two conflicting source documents
- Empty state illustrations
- Section-level review progress bar

## Next tasks

Await user feedback / follow-up prompt. The case study includes a
"Follow-up prompt" asking to critically review the app and fix gaps —
that is the next explicit request the user is likely to send.

## Test credentials

None. This is a frontend-only prototype with no authentication.
