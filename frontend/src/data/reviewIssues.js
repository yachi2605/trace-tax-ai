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
        "The source text was clear, the document type was recognized as a W-2, and the extracted value matched the expected Box 1 format.",
    },
    issue: {
      title: "Wage amount differs from W-2 Box 1",
      summary:
        "The return currently shows $84,520, while Box 1 of the uploaded W-2 shows $84,250. The values differ by $270.",
      recommendedAction:
        "Use the W-2 source value unless a corrected W-2 or another supporting document exists.",
    },
    evidence: {
      docId: "doc-w2-mainstage",
      page: 1,
      regionId: "w2-box-1",
      sourceValue: 84250,
      transformation: {
        type: "direct-mapping",
        summary: "Direct mapping from W-2 Box 1. No calculation applied.",
        steps: [
          "1. Located Box 1 (Wages, tips, other compensation) on Jordan_Lee_W2_MainstageEng.pdf (page 1).",
          "2. Extracted raw value: 84250.00",
          "3. Mapped to Form 1040, Line 1a without transformation.",
        ],
      },
    },
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
        "The source image for Community Credit Union 1099-INT is blurred and two digits may have been interpreted incorrectly. Review the highlighted area before accepting this value.",
    },
    issue: {
      title: "Low-confidence extraction on Community CU 1099-INT",
      summary:
        "The AI aggregated two 1099-INT documents to compute $1,260, but the Community Credit Union scan is blurred. The return currently shows $1,280.",
      recommendedAction:
        "Open the Community Credit Union 1099-INT preview and verify Box 1 before accepting.",
    },
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
          "1. Located Box 1 on two 1099-INT documents.",
          "2. Extracted $740 (First Bank, high confidence) and $520 (Community CU, low confidence).",
          "3. Summed to compute $1,260 taxable interest.",
        ],
      },
    },
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
      reason: "Value matches client worksheet and prior-year contribution pattern.",
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
        steps: ["Extracted from client worksheet, page 2, HSA line."],
      },
    },
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
      reason: "Direct match to Form 1098 Box 1 from Meridian Home Lending.",
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
        steps: ["Extracted mortgage interest of $8,214.36 from lender-issued 1098."],
      },
    },
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
        "Only $1,200 of the $3,400 claimed is supported by uploaded receipts (Meridian Foodbank). The remaining $2,200 has no linked source document.",
    },
    issue: {
      title: "Missing supporting source for $2,200 of charitable contributions",
      summary:
        "The return claims $3,400 in cash contributions but only $1,200 is linked to an uploaded receipt.",
      recommendedAction:
        "Request the remaining donation receipts from the client, or attach an existing document. Do not accept without evidence.",
    },
    evidence: {
      docId: "doc-charitable-receipt",
      page: 1,
      regionId: "charitable-line1",
      sourceValue: 1200,
      transformation: {
        type: "partial-match",
        summary: "Only $1,200 of the $3,400 claimed is supported by evidence.",
        steps: [
          "Located a $1,200 donation receipt from Meridian Community Foodbank.",
          "No source document found for the remaining $2,200.",
        ],
      },
    },
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
      reason: "Value matches Box 2 of the uploaded W-2 exactly.",
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
        steps: ["Extracted $11,832.00 from W-2 Box 2."],
      },
    },
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
        "Two W-2 documents were uploaded for the same employer. The original W-2 and a corrected W-2c disagree on Box 1 wages.",
    },
    issue: {
      title: "Two conflicting W-2 documents for Mainstage Engineering LLC",
      summary:
        "An original W-2 and a corrected W-2c were both uploaded. The system did not automatically select one. Choose which document to treat as authoritative.",
      recommendedAction:
        "Confirm with the client which W-2 is authoritative. Typically the most recent W-2c supersedes the original.",
    },
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
    confidence: { level: "high", pct: 99, reason: "Confirmed from client worksheet." },
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
