# TraceTax AI

**A CPA-facing tax return review workspace prototype.**

TraceTax AI is a frontend prototype for reviewing AI-generated tax values with source-level evidence and human correction workflows. It is designed for the GreenGrowth CPAs AI Engineer case study.

The core product promise:

> Every AI-generated tax value can be traced, understood, and corrected without leaving the review workflow.

---

## Challenges addressed

This prototype focuses on three challenges from the case study, combined into one cohesive product rather than three disconnected demos:

| # | Challenge | Where to see it |
|---|-----------|-----------------|
| **01** | **Source Document Traceability** | The **Source** tab in the right panel. Every AI-extracted value shows its exact source document, page, highlighted region, extracted value, and applied transformation (direct mapping, sum of multiple documents, partial match, conflict, etc.). Aggregated values (e.g., taxable interest) show a numbered breakdown per source. |
| **08** | **Clickable vs. Editable** | The shared visual language for field states across the entire app — a dedicated `StatusBadge` component with an icon, label, border, and color for each of nine states: AI-generated, Needs review, Verified, Editable, Read-only, Locked, Manual override, Missing source, Conflicting evidence. Editable rows show input affordances; verified rows show reviewer badges without inputs; locked rows show a lock icon and a link to component fields. |
| **10** | **Trustworthy AI** | The **Summary** and **Reasoning** tabs. Confidence is shown as *both* a plain-language label (High / Medium / Low) *and* a percentage, always paired with a human-readable reason. Every issue answers: what did the AI do, why, what supports it, how certain is it, what remains uncertain, and what should the reviewer do next. |

---

## Core workflow

1. **Review Queue** (`/`) — landing page with 12 fictional returns, filterable by stage and searchable by client name. Jordan Lee's return is near the top with 3 unresolved issues and 72 % progress.
2. **Return Workspace** (`/returns/ret-2025-001`) — three-panel layout:
    - **Left:** section navigation with per-section issue counts (Wages 1, Interest 1, Deductions 1).
    - **Center:** tax fields with status badges, AI suggestions, and action buttons.
    - **Right:** evidence & reasoning panel with four tabs (Summary, Source, Reasoning, History).
3. **Correction** — pick a field, review evidence, then Accept AI, Keep current (with required reason), or Enter a different value (with new value + required reason).
4. **Audit trail** (`/activity`) — every AI extraction, flag, and human decision is recorded with actor, action, timestamp, and detail.
5. **Documents** (`/documents`) — browse all uploaded source documents for Jordan Lee.

---

## Review scenarios wired up

All of these are functional edge cases, not just static mockups:

| Scenario | Field | State |
|----------|-------|-------|
| High-confidence wage discrepancy (Scenario A) | Wages, salaries, and tips | `needs-review`, high-confidence AI suggestion |
| Low-confidence extraction (Scenario B) | Taxable interest | `needs-review`, low confidence (62 %) on Community CU 1099-INT |
| Missing source (Scenario C) | Charitable cash contributions | `missing-source`, partial evidence for $1,200 of $3,400 |
| Conflicting sources (Scenario D) | Employer W-2 vs W-2c | `conflicting-evidence`, two documents disagree |
| Verified & locked calculation (Scenario E) | Total itemized deductions, AGI | `locked`, jump-to-component-value links |
| Aggregated value from multiple docs | Taxable interest | Sum of $740 + $520 from two 1099-INTs |
| Manual override | Any needs-review field | Set via "Enter different value" |
| Empty search / filter state | Review Queue | Search for a nonexistent client |
| Completed section | Payments (all verified) | Green completion callout |

---

## What is functional

- Queue search (client name)
- Queue filters (All / Needs attention / Ready for review / Waiting on client / Completed / Assigned to me)
- Opening a return from the queue
- Switching return sections
- Selecting a tax field → updates the evidence panel
- Switching evidence tabs (Summary / Source / Reasoning / History)
- Viewing a simulated source document
- Highlighting the relevant region inside the source document
- Zooming the source document
- **Accept AI suggestion** — updates value, marks verified, records event
- **Keep current value** — requires a reason category + explanation, records event
- **Enter a different value** (manual correction) — requires new value + explanation, marks manual override, records event; **original AI suggestion is preserved** in the field's history tab
- **Resolve conflict** — pick which of two conflicting source documents is authoritative
- **Request document** — for missing-source scenarios
- Locked-field explanations with jump-to-component-value links
- Review progress + open-issue counters that update live as fields are resolved
- Audit history per field (History tab) and global (Activity page)
- Empty state for both queue filters and queue search
- Toast confirmations on every action

---

## What is simulated

Per the case study brief, the following are **explicitly simulated** and would need real implementations in production:

- **OCR / document parsing** — Source documents are stylized SVG-like layouts drawn in React, not real PDF parsing.
- **AI extraction & recommendations** — All AI values, confidence scores, and reasoning are hardcoded mock data in `src/data/reviewIssues.js`.
- **Confidence scores** — Predefined per field; not computed.
- **Tax calculations** — Locked/derived fields display hardcoded totals; no real 1040 math.
- **Authentication** — No login; Maya Chen is hardcoded as the current reviewer.
- **Backend persistence** — All state lives in a React Context store for the browser session. Refreshing the page resets all corrections.

---

## Key design decisions

- **Evidence beside the decision, not behind it.** The right-side panel is always visible while reviewing. Users never leave the workflow to check a source.
- **Confidence is plain-language.** A percentage without context is useless. Every confidence score is paired with a one-sentence reason explaining *why* the AI is confident (or not).
- **Corrections stay in context.** The correction dialog shows the current value + AI value + reason categories inline. Users don't lose sight of what they're changing.
- **The original AI output survives correction.** A manual override doesn't overwrite the AI recommendation — it's preserved in the field's history tab, so anyone reviewing later can see what the AI suggested and why the human overrode it.
- **Field states use a shared visual system.** Nine states, one badge component, one color/icon/border language. This is what Challenge 08 asks for.
- **Restraint over decoration.** No glowing AI visuals, no sparkles, no chatbot metaphors. This is a tool for CPAs, so it looks like a serious financial instrument.
- **Left-aligned, dense, tabular data.** Numbers are IBM Plex Mono with tabular figures. Every dollar value aligns on the decimal.
- **Do not rely on color alone.** Every status pairs color with an icon and a text label.

---

## Tech stack

- **React 19** (create-react-app / craco)
- **Tailwind CSS 3**
- **shadcn/ui** components (Radix under the hood)
- **lucide-react** icons
- **React Router 7** for navigation
- **sonner** for toast notifications
- **React Context + useReducer** for session-persistent state (no backend)

There is no backend service. All mock data lives in `src/data/`.

---

## Running locally

```bash
cd frontend
yarn install
yarn start
```

The app runs on `http://localhost:3000` by default.

---

## Project structure

```
frontend/src/
  App.js                          Routes + app shell
  components/
    layout/TopBar.jsx             Global header
    review/
      SectionNav.jsx              Left panel section nav
      TaxFieldRow.jsx             Center panel field row + inline actions
      ReviewActionDialog.jsx      Accept / Keep / Manual-correction modal
    evidence/
      EvidencePanel.jsx           Right panel with 4 tabs
      DocumentPreview.jsx         Simulated W-2 / 1099 / 1098 renderer + highlight
    status/
      StatusBadge.jsx             Shared visual language for 9 field states
      ConfidenceIndicator.jsx     Plain-language + percentage confidence
      LockedExplanation.jsx       Explanation + jump-to-components for locked fields
    ui/                           shadcn/ui primitives
  pages/
    ReviewQueuePage.jsx
    ReturnWorkspacePage.jsx
    ActivityPage.jsx
    DocumentsPage.jsx
  data/
    returns.js                    12 fictional returns
    documents.js                  7 mock source documents for Jordan Lee
    reviewIssues.js               13 tax fields spanning all edge cases
    activity.js                   16 initial audit events
  store/
    appStore.jsx                  Context + reducer (accept/keep/manual/resolve/request)
  utils/
    format.js                     Currency, date, status helpers
```

---

## Deployment (Vercel)

This is a static React app. Deploying to Vercel:

1. Push the repo to GitHub.
2. Import into Vercel.
3. Set the framework preset to **Create React App**.
4. Build command: `yarn build`
5. Output directory: `build`

No environment variables are required.

---

## Known limitations

- All corrections are lost on page refresh (no backend persistence).
- Source documents are stylized simulations; real OCR/PDF viewers are out of scope.
- Only Jordan Lee's return has field-level data. Opening any other return in the queue navigates to the workspace but shows the same field data — this is intentional for the prototype.
- Confidence values are static, not computed.
- Tablet layout works but is not deeply optimized; the workspace is designed primarily for desktop widths ≥ 1280 px.
- No authentication — Maya Chen is hardcoded as the reviewer.

---

## Fictional data notice

All names, employers, financial values, and documents in this prototype are fictional. No real Social Security numbers, addresses, bank account numbers, or personal tax information appear anywhere.
