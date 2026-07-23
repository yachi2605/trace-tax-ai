// TraceTax AI - Jordan Lee's 2025 return: sections, fields, and review issues
//
// Field states (used to drive visual language + Challenge 08):
//   - "ai-generated"     : AI extracted; awaiting reviewer
//   - "needs-review"     : Flagged discrepancy or low confidence
//   - "verified"         : Reviewer accepted (or field auto-verified)
//   - "editable"         : Editable, no AI opinion
//   - "read-only"        : Informational, not editable here
//   - "locked"           : Calculated / derived; cannot be edited directly
//   - "manually-corrected": Reviewer changed the AI value
//   - "missing-source"   : Value present in return but no linked source
//   - "conflicting-evidence": Multiple source docs disagree
//
// Confidence:  { level: "high" | "medium" | "low", pct: 0-100, reason: string }
//
// Evidence:   { docId, page, region, sourceValue, transformation, notes }

export const SECTIONS = [
  { id: "overview", label: "Overview", icon: "Home" },
  {
    id: "income",
    label: "Income",
    icon: "TrendingUp",
    children: [
      { id: "wages", label: "Wages" },
      { id: "interest", label: "Interest" },
      { id: "self-employment", label: "Self-employment" },
    ],
  },
  { id: "adjustments", label: "Adjustments", icon: "Sliders" },
  { id: "deductions", label: "Deductions", icon: "Receipt" },
  { id: "credits", label: "Credits", icon: "Award" },
  { id: "payments", label: "Payments", icon: "CreditCard" },
  { id: "filing-summary", label: "Filing summary", icon: "FileText" },
  { id: "documents", label: "Documents", icon: "FolderOpen" },
  { id: "activity", label: "Activity", icon: "History" },
];

// Fields, grouped by section. This is the primary data structure that drives
// the center panel + evidence panel + audit trail.
export const FIELDS = [
  // ---------- WAGES ----------
  {
    id: "field-wages-1a",
    section: "wages",
    parentSection: "income",
    label: "Wages, salaries, and tips",
    formRef: "Form 1040, Line 1a",
    currentValue: 84520,
    aiSuggestedValue: 84250,
    difference: 270,
    status: "needs-review",
    severity: "high",
    confidence: {
      level: "high",
      pct: 96,
      reason:
        "I'm confident the extracted value is correct, but I can't tell you whether the return's higher figure was intentional. A quick check with the client should resolve it.",
      factors: [
        { label: "Document type recognized as W-2 (Copy B)", impact: "positive" },
        { label: "Box 1 numeric value clearly legible", impact: "positive" },
        { label: "Employer name matches client worksheet", impact: "positive" },
        { label: "No corrected W-2c present at time of extraction", impact: "neutral" },
      ],
    },
    issue: {
      title: "The return's wages figure is $270 higher than the W-2",
      summary:
        "The return currently shows $84,520, while Box 1 of the uploaded W-2 shows $84,250. The values differ by $270.",
      whyFlagged:
        "I compare Line 1a on the return against Box 1 of each uploaded W-2. When they disagree by more than a rounding amount, I flag it because wages usually match the W-2 unless a corrected W-2c has been issued or an adjustment was made elsewhere.",
      uncertainty: [
        "I don't know whether the $270 difference was intentional (for example, a prior-year adjustment).",
        "I can't rule out a corrected W-2c that hasn't been uploaded yet.",
      ],
      recommendedAction:
        "Use the W-2 source value unless a corrected W-2 or another supporting document exists.",
    },
    assistantNote:
      "I noticed the wages on this return are $270 higher than what I read from the W-2. Could you take a look and let me know which figure is correct?",
    evidence: {
      docId: "doc-w2-mainstage",
      page: 1,
      regionId: "w2-box-1",
      sourceValue: 84250,
      transformation: {
        type: "direct-mapping",
        summary: "Direct mapping from W-2 Box 1. No calculation applied.",
        steps: [
          {
            label: "Locate source",
            detail: "Found Box 1 (Wages, tips, other compensation) on Jordan_Lee_W2_MainstageEng.pdf, page 1.",
          },
          {
            label: "Extract raw value",
            detail: "Read the printed value $84,250.00.",
            value: 84250,
          },
          {
            label: "Normalize",
            detail: "Stripped currency symbol and trailing decimals. Result unchanged.",
            value: 84250,
          },
          {
            label: "Map to return field",
            detail: "Mapped directly to Form 1040, Line 1a (Wages, salaries, and tips). No calculation applied.",
            value: 84250,
          },
        ],
      },
    },
    supportingDocuments: [
      { docId: "doc-w2-mainstage", role: "primary", note: "Source of the extracted wage value." },
      { docId: "doc-taxpayer-worksheet", role: "supporting", note: "Client worksheet lists the same employer; supports the extraction." },
    ],
    lastVerifiedBy: null,
    lastVerifiedAt: null,
  },

  // ---------- INTEREST ----------
  {
    id: "field-interest-2b",
    section: "interest",
    parentSection: "income",
    label: "Taxable interest",
    formRef: "Form 1040, Line 2b · Schedule B",
    currentValue: 1280,
    aiSuggestedValue: 1260,
    difference: -20,
    status: "needs-review",
    severity: "medium",
    confidence: {
      level: "low",
      pct: 62,
      reason:
        "I could read one of the two 1099-INT documents cleanly, but the Community Credit Union scan is blurred. Two digits in Box 1 could plausibly be read as different numbers. Please verify before accepting.",
      factors: [
        { label: "First Bank 1099-INT extracted cleanly ($740)", impact: "positive" },
        { label: "Community CU 1099-INT scan is blurred", impact: "negative" },
        { label: "Two digits on Community CU could be ambiguous", impact: "negative" },
        { label: "No mismatch with prior-year reported interest yet", impact: "neutral" },
      ],
    },
    issue: {
      title: "One of the 1099-INT scans is hard to read",
      summary:
        "I aggregated two 1099-INT documents to compute $1,260, but the Community Credit Union scan is blurred. The return currently shows $1,280.",
      whyFlagged:
        "When I aggregate multiple source documents for a single line, I flag the total whenever any component has low extraction confidence. Here, the First Bank amount is solid, but I'm less sure about the Community CU amount, so I want you to look at the source before we finalize.",
      uncertainty: [
        "The blurred digits on the Community CU 1099-INT could be $520, $530, or possibly $580.",
        "I don't know whether the client has a corrected or clearer copy available.",
      ],
      recommendedAction:
        "Open the Community Credit Union 1099-INT preview and verify Box 1 before accepting.",
    },
    assistantNote:
      "The Community Credit Union 1099-INT is a little blurry — could you eyeball Box 1 and confirm the amount? I'd rather ask than guess.",
    evidence: {
      // aggregation from multiple documents
      docId: null,
      page: null,
      regionId: null,
      sourceValue: 1260,
      transformation: {
        type: "sum-of-multiple-sources",
        summary: "Sum of two 1099-INT documents.",
        breakdown: [
          { label: "First Bank 1099-INT", value: 740, docId: "doc-1099int-firstbank", regionId: "1099int-box1-fb" },
          { label: "Community Credit Union 1099-INT", value: 520, docId: "doc-1099int-ccu", regionId: "1099int-box1-ccu" },
        ],
        steps: [
          {
            label: "Identify contributing documents",
            detail: "Found two 1099-INT documents linked to Jordan Lee for tax year 2025.",
          },
          {
            label: "Extract Box 1 from each",
            detail: "First Bank: $740 (clean scan). Community Credit Union: $520 (blurred scan, low confidence).",
          },
          {
            label: "Sum values",
            detail: "$740 + $520 = $1,260.",
            value: 1260,
          },
          {
            label: "Map to return field",
            detail: "Mapped total to Form 1040, Line 2b (Taxable interest).",
            value: 1260,
          },
        ],
      },
    },
    supportingDocuments: [
      { docId: "doc-1099int-firstbank", role: "primary", note: "Provides $740 of the total." },
      { docId: "doc-1099int-ccu", role: "primary", note: "Provides $520 of the total (low-confidence scan)." },
    ],
    lastVerifiedBy: null,
    lastVerifiedAt: null,
  },

  // ---------- SELF-EMPLOYMENT ----------
  {
    id: "field-se-income",
    section: "self-employment",
    parentSection: "income",
    label: "Self-employment income (Schedule C)",
    formRef: "Schedule C, Line 1",
    currentValue: 0,
    aiSuggestedValue: 0,
    difference: 0,
    status: "read-only",
    severity: "none",
    confidence: null,
    issue: null,
    evidence: null,
    note: "No Schedule C activity reported for this return.",
    lastVerifiedBy: null,
    lastVerifiedAt: null,
  },

  // ---------- ADJUSTMENTS ----------
  {
    id: "field-adj-hsa",
    section: "adjustments",
    parentSection: "adjustments",
    label: "HSA deduction",
    formRef: "Schedule 1, Line 13",
    currentValue: 3850,
    aiSuggestedValue: 3850,
    difference: 0,
    status: "verified",
    severity: "none",
    confidence: {
      level: "high",
      pct: 99,
      reason: "The amount matches the client's worksheet exactly and is consistent with the contribution pattern I saw in the prior-year return.",
      factors: [
        { label: "Exact match to client worksheet, page 2", impact: "positive" },
        { label: "Consistent with 2024 return HSA contribution", impact: "positive" },
      ],
    },
    issue: null,
    evidence: {
      docId: "doc-taxpayer-worksheet",
      page: 2,
      regionId: null,
      sourceValue: 3850,
      transformation: {
        type: "direct-mapping",
        summary: "Direct mapping from client-provided worksheet.",
        steps: [
          {
            label: "Locate source",
            detail: "Found the HSA line on Jordan Lee's 2025 taxpayer worksheet, page 2.",
          },
          {
            label: "Extract value",
            detail: "Read $3,850.00.",
            value: 3850,
          },
          {
            label: "Map to return field",
            detail: "Mapped to Schedule 1, Line 13 (HSA deduction).",
            value: 3850,
          },
        ],
      },
    },
    supportingDocuments: [
      { docId: "doc-taxpayer-worksheet", role: "primary", note: "Client-provided worksheet listing HSA contribution." },
    ],
    lastVerifiedBy: "Maya Chen",
    lastVerifiedAt: "2026-01-13T10:14:00Z",
  },

  // ---------- DEDUCTIONS ----------
  {
    id: "field-ded-mortgage",
    section: "deductions",
    parentSection: "deductions",
    label: "Home mortgage interest",
    formRef: "Schedule A, Line 8a",
    currentValue: 8214.36,
    aiSuggestedValue: 8214.36,
    difference: 0,
    status: "verified",
    severity: "none",
    confidence: {
      level: "high",
      pct: 98,
      reason: "The amount matches Box 1 of the Form 1098 from Meridian Home Lending exactly, so there's nothing ambiguous here.",
      factors: [
        { label: "Direct match to Form 1098 Box 1", impact: "positive" },
        { label: "Lender name matches property records", impact: "positive" },
      ],
    },
    issue: null,
    evidence: {
      docId: "doc-1098-mortgage",
      page: 1,
      regionId: "1098-mortgage-interest",
      sourceValue: 8214.36,
      transformation: {
        type: "direct-mapping",
        summary: "Direct mapping from Form 1098, Box 1.",
        steps: [
          {
            label: "Locate source",
            detail: "Found Box 1 (Mortgage interest received) on Jordan_Lee_1098_HomeMortgage.pdf, page 1.",
          },
          {
            label: "Extract raw value",
            detail: "Read $8,214.36.",
            value: 8214.36,
          },
          {
            label: "Map to return field",
            detail: "Mapped directly to Schedule A, Line 8a.",
            value: 8214.36,
          },
        ],
      },
    },
    supportingDocuments: [
      { docId: "doc-1098-mortgage", role: "primary", note: "Lender-issued Form 1098 — authoritative source." },
    ],
    lastVerifiedBy: "Maya Chen",
    lastVerifiedAt: "2026-01-13T10:18:00Z",
  },
  {
    id: "field-ded-charitable",
    section: "deductions",
    parentSection: "deductions",
    label: "Charitable cash contributions",
    formRef: "Schedule A, Line 11",
    currentValue: 3400,
    aiSuggestedValue: null,
    difference: null,
    status: "missing-source",
    severity: "medium",
    confidence: {
      level: "low",
      pct: 40,
      reason:
        "I can only account for $1,200 of the $3,400 claimed. The rest has no linked receipt. Without evidence for the remaining $2,200, I'd hold off on approving this deduction.",
      factors: [
        { label: "Meridian Foodbank receipt supports $1,200", impact: "positive" },
        { label: "No source document for the remaining $2,200", impact: "negative" },
        { label: "No prior-year record of larger contributions", impact: "neutral" },
      ],
    },
    issue: {
      title: "$2,200 of the claimed charitable contributions has no receipt",
      summary:
        "The return claims $3,400 in cash contributions but only $1,200 is linked to an uploaded receipt.",
      whyFlagged:
        "For itemized cash contributions I look for a linked donation receipt or letter of acknowledgement. I found one for $1,200, but the remaining $2,200 has no source document, so I'm flagging it before you sign off on the deduction.",
      uncertainty: [
        "The client may have receipts that haven't been uploaded yet.",
        "The $2,200 could reflect several smaller donations that don't require individual receipts — I can't tell without more information.",
      ],
      recommendedAction:
        "Request the remaining donation receipts from the client, or attach an existing document. Do not accept without evidence.",
    },
    assistantNote:
      "The receipts I have only cover $1,200 of the $3,400 claimed. Want me to draft a request to the client for the missing documentation?",
    evidence: {
      docId: "doc-charitable-receipt",
      page: 1,
      regionId: "charitable-line1",
      sourceValue: 1200,
      transformation: {
        type: "partial-match",
        summary: "Only $1,200 of the $3,400 claimed is supported by evidence.",
        steps: [
          {
            label: "Extract supported amount",
            detail: "Found a $1,200 cash donation receipt from Meridian Community Foodbank (page 1).",
            value: 1200,
          },
          {
            label: "Compare to return value",
            detail: "Return claims $3,400 total cash contributions.",
            value: 3400,
          },
          {
            label: "Compute unsupported delta",
            detail: "$3,400 − $1,200 = $2,200 has no linked source document.",
            value: 2200,
          },
          {
            label: "Flag for reviewer",
            detail: "Do not accept without supporting evidence for the unsupported $2,200.",
          },
        ],
      },
    },
    supportingDocuments: [
      { docId: "doc-charitable-receipt", role: "primary", note: "Supports $1,200 of the claimed $3,400." },
    ],
    lastVerifiedBy: null,
    lastVerifiedAt: null,
  },
  {
    id: "field-ded-total",
    section: "deductions",
    parentSection: "deductions",
    label: "Total itemized deductions",
    formRef: "Schedule A, Line 17",
    currentValue: 15328.36,
    aiSuggestedValue: 15328.36,
    difference: 0,
    status: "locked",
    severity: "none",
    confidence: null,
    issue: null,
    evidence: null,
    lockedReason:
      "This total is calculated from three verified source fields (mortgage interest, charitable contributions, and state/local taxes). Edit the component values to update it.",
    lockedComponentFieldIds: [
      "field-ded-mortgage",
      "field-ded-charitable",
    ],
    lastVerifiedBy: null,
    lastVerifiedAt: null,
  },

  // ---------- CREDITS ----------
  {
    id: "field-credits-childcare",
    section: "credits",
    parentSection: "credits",
    label: "Child and dependent care expenses",
    formRef: "Form 2441, Line 3",
    currentValue: 0,
    aiSuggestedValue: 0,
    difference: 0,
    status: "read-only",
    severity: "none",
    confidence: null,
    issue: null,
    evidence: null,
    note: "Not applicable — no qualifying dependents reported.",
    lastVerifiedBy: null,
    lastVerifiedAt: null,
  },

  // ---------- PAYMENTS ----------
  {
    id: "field-pay-withholding",
    section: "payments",
    parentSection: "payments",
    label: "Federal income tax withheld",
    formRef: "Form 1040, Line 25a",
    currentValue: 11832,
    aiSuggestedValue: 11832,
    difference: 0,
    status: "verified",
    severity: "none",
    confidence: {
      level: "high",
      pct: 99,
      reason: "This value comes straight from Box 2 of the W-2 with no interpretation needed.",
      factors: [
        { label: "Direct match to W-2 Box 2", impact: "positive" },
        { label: "Box 2 numeric formatting is unambiguous", impact: "positive" },
      ],
    },
    issue: null,
    evidence: {
      docId: "doc-w2-mainstage",
      page: 1,
      regionId: "w2-box-2",
      sourceValue: 11832,
      transformation: {
        type: "direct-mapping",
        summary: "Direct mapping from W-2 Box 2.",
        steps: [
          {
            label: "Locate source",
            detail: "Found Box 2 (Federal income tax withheld) on Jordan_Lee_W2_MainstageEng.pdf, page 1.",
          },
          {
            label: "Extract value",
            detail: "Read $11,832.00.",
            value: 11832,
          },
          {
            label: "Map to return field",
            detail: "Mapped directly to Form 1040, Line 25a.",
            value: 11832,
          },
        ],
      },
    },
    supportingDocuments: [
      { docId: "doc-w2-mainstage", role: "primary", note: "W-2 Box 2 is the authoritative source for federal withholding." },
    ],
    lastVerifiedBy: "Maya Chen",
    lastVerifiedAt: "2026-01-13T10:22:00Z",
  },

  // ---------- CONFLICT SCENARIO (also in wages, alternative narrative) ----------
  {
    id: "field-wages-employer",
    section: "wages",
    parentSection: "income",
    label: "Employer name",
    formRef: "W-2 · Box c",
    currentValue: "Mainstage Engineering LLC",
    aiSuggestedValue: "Mainstage Engineering LLC",
    difference: 0,
    status: "conflicting-evidence",
    severity: "medium",
    confidence: {
      level: "medium",
      pct: 78,
      reason:
        "Both W-2 documents look valid and are for the same employer. A W-2c usually supersedes the original, but I don't want to make that call on your behalf — this needs a human decision.",
      factors: [
        { label: "Both documents are for the same employer + tax year", impact: "positive" },
        { label: "W-2c is dated after the original W-2", impact: "positive" },
        { label: "Box 1 values differ by $270", impact: "negative" },
        { label: "No confirmation from client on which is authoritative", impact: "negative" },
      ],
    },
    issue: {
      title: "Two W-2s exist for Mainstage Engineering LLC — original and corrected",
      summary:
        "An original W-2 and a corrected W-2c were both uploaded. The system did not automatically select one. Choose which document to treat as authoritative.",
      whyFlagged:
        "When I find more than one W-2 for the same employer, I don't auto-pick a winner — even if a W-2c is typically authoritative. The choice affects the wages line and downstream calculations, so I surface both and let you decide.",
      uncertainty: [
        "I don't know whether the client received the W-2c because of an actual correction or as a duplicate.",
        "I can't confirm from the document alone whether the original W-2 was rescinded.",
      ],
      recommendedAction:
        "Confirm with the client which W-2 is authoritative. Typically the most recent W-2c supersedes the original.",
    },
    assistantNote:
      "Two W-2s came in for the same employer. I've kept both visible below — pick whichever you want me to treat as the source of truth.",
    evidence: {
      docId: "doc-w2-mainstage",
      page: 1,
      regionId: "w2-employer",
      sourceValue: "Mainstage Engineering LLC",
      transformation: {
        type: "conflict",
        summary: "Two source documents disagree.",
        conflictingSources: [
          { label: "Original W-2", docId: "doc-w2-mainstage", value: "$84,250", uploadedAt: "2026-01-08" },
          { label: "Corrected W-2c", docId: "doc-w2-mainstage-corrected", value: "$84,520", uploadedAt: "2026-01-12" },
        ],
      },
    },
    lastVerifiedBy: null,
    lastVerifiedAt: null,
  },

  // ---------- OVERVIEW (informational) ----------
  {
    id: "field-overview-filing-status",
    section: "overview",
    parentSection: "overview",
    label: "Filing status",
    formRef: "Form 1040 · Filing status",
    currentValue: "Single",
    aiSuggestedValue: "Single",
    difference: 0,
    status: "verified",
    severity: "none",
    confidence: {
      level: "high",
      pct: 99,
      reason: "The client's worksheet explicitly states 'Single' with no ambiguity.",
      factors: [
        { label: "Client worksheet lists filing status as 'Single'", impact: "positive" },
        { label: "No dependents reported on the return", impact: "positive" },
      ],
    },
    issue: null,
    evidence: {
      docId: "doc-taxpayer-worksheet",
      page: 1,
      regionId: null,
      sourceValue: "Single",
      transformation: {
        type: "direct-mapping",
        summary: "Direct mapping from client worksheet.",
        steps: ["Filing status confirmed from client-provided worksheet."],
      },
    },
    lastVerifiedBy: "Maya Chen",
    lastVerifiedAt: "2026-01-13T10:08:00Z",
  },
  {
    id: "field-overview-agi",
    section: "overview",
    parentSection: "overview",
    label: "Adjusted gross income (AGI)",
    formRef: "Form 1040, Line 11",
    currentValue: 82050.0,
    aiSuggestedValue: 82050.0,
    difference: 0,
    status: "locked",
    severity: "none",
    confidence: null,
    issue: null,
    evidence: null,
    lockedReason:
      "AGI is calculated automatically from income, adjustments, and self-employment activity. Edit the underlying income or adjustment fields to change AGI.",
    lockedComponentFieldIds: ["field-wages-1a", "field-interest-2b", "field-adj-hsa"],
    lastVerifiedBy: null,
    lastVerifiedAt: null,
  },
];

// Quick helpers
export function getFieldById(id) {
  return FIELDS.find((f) => f.id === id) || null;
}

export function getFieldsBySection(sectionId) {
  return FIELDS.filter((f) => f.section === sectionId);
}

export function getFieldsByParent(parentSectionId) {
  return FIELDS.filter((f) => f.parentSection === parentSectionId);
}

// Count unresolved issues per section for the left nav
export function getIssueCountBySection(fields) {
  const counts = {};
  fields.forEach((f) => {
    if (
      f.status === "needs-review" ||
      f.status === "missing-source" ||
      f.status === "conflicting-evidence"
    ) {
      counts[f.section] = (counts[f.section] || 0) + 1;
      counts[f.parentSection] = (counts[f.parentSection] || 0) + 1;
    }
  });
  return counts;
}
