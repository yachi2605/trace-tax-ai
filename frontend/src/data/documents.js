// TraceTax AI - Mock source documents for Jordan Lee
// Each document represents a simulated uploaded tax document.
// Documents can be referenced by extraction records and evidence panels.

export const DOCUMENTS = [
  {
    id: "doc-w2-mainstage",
    fileName: "Jordan_Lee_W2_MainstageEng.pdf",
    docType: "W-2",
    issuer: "Mainstage Engineering LLC",
    uploadedBy: "Jordan Lee",
    uploadedAt: "2026-01-08T14:12:00Z",
    pages: 1,
    sizeKb: 184,
    status: "verified", // extraction complete
    coverColor: "#0A2540",
    // Fictional simulated field extractions per page
    pages_meta: [
      {
        page: 1,
        // regions map field regions to bounding boxes (percent of page)
        regions: [
          {
            id: "w2-box-1",
            label: "Box 1 — Wages, tips, other compensation",
            value: "$84,250.00",
            box: { top: 30, left: 6, width: 42, height: 6 },
          },
          {
            id: "w2-box-2",
            label: "Box 2 — Federal income tax withheld",
            value: "$11,832.00",
            box: { top: 30, left: 52, width: 42, height: 6 },
          },
          {
            id: "w2-employer",
            label: "Employer — Mainstage Engineering LLC",
            value: "Mainstage Engineering LLC",
            box: { top: 14, left: 6, width: 42, height: 6 },
          },
        ],
      },
    ],
  },
  {
    id: "doc-1099int-firstbank",
    fileName: "Jordan_Lee_1099INT_FirstBank.pdf",
    docType: "1099-INT",
    issuer: "First Bank of Meridian",
    uploadedBy: "Jordan Lee",
    uploadedAt: "2026-01-09T10:22:00Z",
    pages: 1,
    sizeKb: 96,
    status: "verified",
    coverColor: "#0EA5A5",
    pages_meta: [
      {
        page: 1,
        regions: [
          {
            id: "1099int-box1-fb",
            label: "Box 1 — Interest income",
            value: "$740.00",
            box: { top: 34, left: 52, width: 30, height: 6 },
          },
        ],
      },
    ],
  },
  {
    id: "doc-1099int-ccu",
    fileName: "Jordan_Lee_1099INT_CommunityCU.pdf",
    docType: "1099-INT",
    issuer: "Community Credit Union",
    uploadedBy: "Jordan Lee",
    uploadedAt: "2026-01-09T10:24:00Z",
    pages: 1,
    sizeKb: 88,
    status: "low-confidence",
    coverColor: "#B45309",
    pages_meta: [
      {
        page: 1,
        regions: [
          {
            id: "1099int-box1-ccu",
            label: "Box 1 — Interest income (blurred scan)",
            value: "$520.00 (± ambiguous)",
            box: { top: 33, left: 51, width: 33, height: 7 },
          },
        ],
      },
    ],
  },
  {
    id: "doc-w2-mainstage-corrected",
    fileName: "Jordan_Lee_W2c_MainstageEng.pdf",
    docType: "W-2c (corrected)",
    issuer: "Mainstage Engineering LLC",
    uploadedBy: "Jordan Lee",
    uploadedAt: "2026-01-12T11:47:00Z",
    pages: 1,
    sizeKb: 176,
    status: "conflict",
    coverColor: "#B91C1C",
    pages_meta: [
      {
        page: 1,
        regions: [
          {
            id: "w2c-box-1",
            label: "Box 1 — Wages, tips, other compensation (corrected)",
            value: "$84,520.00",
            box: { top: 30, left: 6, width: 42, height: 6 },
          },
        ],
      },
    ],
  },
  {
    id: "doc-1098-mortgage",
    fileName: "Jordan_Lee_1098_HomeMortgage.pdf",
    docType: "1098",
    issuer: "Meridian Home Lending",
    uploadedBy: "Jordan Lee",
    uploadedAt: "2026-01-08T14:15:00Z",
    pages: 1,
    sizeKb: 142,
    status: "verified",
    coverColor: "#0A2540",
    pages_meta: [
      {
        page: 1,
        regions: [
          {
            id: "1098-mortgage-interest",
            label: "Box 1 — Mortgage interest received",
            value: "$8,214.36",
            box: { top: 32, left: 52, width: 32, height: 6 },
          },
        ],
      },
    ],
  },
  {
    id: "doc-charitable-receipt",
    fileName: "Meridian_Foodbank_Receipt.pdf",
    docType: "Donation receipt",
    issuer: "Meridian Community Foodbank",
    uploadedBy: "Jordan Lee",
    uploadedAt: "2026-01-08T14:17:00Z",
    pages: 1,
    sizeKb: 62,
    status: "verified",
    coverColor: "#059669",
    pages_meta: [
      {
        page: 1,
        regions: [
          {
            id: "charitable-line1",
            label: "Contribution — cash",
            value: "$1,200.00",
            box: { top: 40, left: 20, width: 40, height: 6 },
          },
        ],
      },
    ],
  },
  {
    id: "doc-taxpayer-worksheet",
    fileName: "Jordan_Lee_2025_TaxpayerWorksheet.pdf",
    docType: "Client worksheet",
    issuer: "Client-provided",
    uploadedBy: "Jordan Lee",
    uploadedAt: "2026-01-08T14:20:00Z",
    pages: 3,
    sizeKb: 218,
    status: "verified",
    coverColor: "#475569",
    pages_meta: [{ page: 1, regions: [] }],
  },
];

// Convenient lookup helper
export function getDocumentById(id) {
  return DOCUMENTS.find((d) => d.id === id) || null;
}
