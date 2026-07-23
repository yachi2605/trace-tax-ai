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

## What's been enhanced (2026-01-14 · Trust & Explainability pass)

- ✅ Every field now has structured `confidence.factors` with +/-/neutral impact chips explaining *what contributed* to the confidence rating
- ✅ New `RecommendationProvenance` card — the "How this recommendation was generated" section — shown on Summary and Reasoning tabs. Structured rows for Source document, Page, Field/Box, Transformation, Extracted value. Special modes for aggregation, conflict, and locked/calculated fields.
- ✅ New `AssistantNoteCard` — human-toned conversational note at the top of every issue's Summary tab. ("I noticed the wages on this return are $270 higher than what I read from the W-2. Could you take a look…")
- ✅ New `WhyFlaggedCard` — explains *why* the AI flagged the row (what it compared, what threshold triggered the flag) in plain English.
- ✅ New `UncertaintyCard` — an explicit "What I'm not sure about" bullet list for each field. Never present in previous version; addresses Challenge 10's "show uncertainty" requirement.
- ✅ Reasoning tab reworded: "What did the AI do?" → "What I checked". "Recommended action" → "What I'd suggest". Removed all references to "the AI"; tone is now first-person assistant.
- ✅ 19/19 regression + new-feature tests passed (iteration_2.json). No layout redesign — all previous data-testids preserved.

## What's been enhanced (2026-01-14 · Manual Override & Audit Trail pass)

- ✅ Reason category options now match the exact list requested: **Corrected W-2 received / OCR error / Tax treatment differs / Supporting documentation / Other**.
- ✅ Every correction (accept-AI, keep-current, manual override, resolve-conflict) now snapshots the full AI recommendation at the moment of decision — value + confidence (level, pct, reason) + source ref (docId, page, regionId, transformation type). Stored per correctionHistory entry so the AI suggestion is *never* lost.
- ✅ **New persistent "Original AI recommendation · preserved" card** — pinned to the Summary tab of any manually-corrected field. Shows suggested value + confidence + source doc/page + override timestamp. The AI suggestion is now visible in three places simultaneously: the row itself, the Summary tab pinned card, and the History tab audit trail.
- ✅ **History tab rewritten** as rich four-section audit cards. Every human decision shows: (1) **AI recommendation** — snapshot with value, confidence, and source ref; (2) **Human decision** — actor + action + strikethrough prior value → new value; (3) **Reason** — category chip + free-text explanation; (4) **Recorded** — actor + role + timestamp. A separate blue card also records the original AI extraction event.
- ✅ Verified/manually-corrected branch now takes precedence over the issue branch in the Summary tab, so the resolved state is properly displayed instead of the original open-issue view.
- ✅ Toast copy updated to remind the reviewer that the original AI suggestion is preserved in History.
- ✅ 10/10 audit-trail regression + new-feature tests passed (iteration_3.json).

## What's been enhanced (2026-01-14 · Source Traceability + UX Polish pass)

**Traceability (Challenge 01):**
- ✅ New `TraceabilityChain` component — visualizes the full audit story on the Source tab: source document → numbered transformation steps (Locate source → Extract raw value → Normalize → Map to return field) → terminal Return field node, connected by arrows. Aggregation mode lists every component source with its value.
- ✅ New `SupportingDocuments` component — lists every document that contributes to a value, distinguishing primary (star badge) from supporting docs, with role notes and upload dates.
- ✅ `transformation.steps` restructured from strings to `{label, detail, value}` objects for richer step-level display.

**UX polish (Intuit-caliber):**
- ✅ Button labels rewritten action-first: "Accept AI" → "Use suggested value", "Keep current" → "Keep current value", "Enter different value" → "Enter my own value", confirm buttons match.
- ✅ Dialog titles rewritten as questions ("Use the suggested value?" / "Keep the current value?" / "Enter your own value").
- ✅ Terminology standardized: "AI-generated" / "AI suggests" / "AI recommended" all consolidated to "Suggested value" in every user-facing surface.
- ✅ History decision labels rewritten action-first ("Accepted AI suggestion" → "Used suggested value"; "Rejected AI · Kept current value" → "Kept current value"; "Manual correction" → "Entered own value").
- ✅ Empty states added / improved: queue ("Clear search" / "Show all returns"), section ("nothing to review here"), activity ("nothing recorded yet"), section-completed callout with warm success copy.
- ✅ Toast microcopy softened and consistent — "Suggested value applied · Wages, salaries, and tips is now Verified."

**Interaction feedback:**
- ✅ Row hover has subtle lift + shadow. Status badge fades in when a row changes state (accept/keep/manual all animate).
- ✅ Focus rings visible on all action buttons; every icon-only button has aria-label.
- ✅ Global skip-to-main-content link for keyboard users. `main` region has `tabIndex=-1` for skip-link targeting.

**Testing status:** 100% pass on all 15 iteration-4 checks. Zero console errors. All prior data-testids preserved.

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
