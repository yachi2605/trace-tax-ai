import React from "react";
import { cn } from "@/lib/utils";
import { FileText, Star } from "lucide-react";
import { getDocumentById } from "@/data/documents";
import { formatDate } from "@/utils/format";
import { Link } from "react-router-dom";
import { documentsHref } from "@/utils/workflowContext";

/**
 * SupportingDocuments — lists every document that contributes to a value,
 * distinguishing the primary (authoritative) source from supporting docs.
 *
 * Falls back to a compact list of aggregation breakdown docs when the field
 * does not declare an explicit supportingDocuments array.
 */
export function SupportingDocuments({ field, className, context }) {
  const explicit = field?.supportingDocuments;
  const breakdown = field?.evidence?.transformation?.breakdown;

  let docs = [];
  if (Array.isArray(explicit) && explicit.length > 0) {
    docs = explicit;
  } else if (Array.isArray(breakdown) && breakdown.length > 0) {
    docs = breakdown.map((b) => ({ docId: b.docId, role: "primary", note: b.label }));
  } else if (field?.evidence?.docId) {
    docs = [{ docId: field.evidence.docId, role: "primary" }];
  }

  if (docs.length === 0) return null;

  return (
    <div
      data-testid="supporting-documents"
      className={cn(
        "border border-slate-200 rounded-md bg-white overflow-hidden",
        className
      )}
    >
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-600" strokeWidth={2.25} />
          <p className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
            Contributing documents
          </p>
        </div>
        <span className="text-[10px] text-slate-500 font-ibm-mono tabular-nums">
          {docs.length} {docs.length === 1 ? "doc" : "docs"}
        </span>
      </div>
      <ul className="divide-y divide-slate-100">
        {docs.map((sd, i) => {
          const doc = getDocumentById(sd.docId);
          if (!doc) return null;
          return (
            <li key={i} data-testid={`supporting-doc-${sd.role}`}>
              <Link
                to={documentsHref({
                  returnId: "ret-2025-001",
                  ...context,
                  fieldId: field.id,
                  sectionId: field.section,
                  documentId: doc.id,
                  regionId:
                    breakdown?.find((item) => item.docId === doc.id)?.regionId ||
                    (field.evidence?.docId === doc.id ? field.evidence?.regionId : undefined),
                })}
                className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-slate-50 transition-colors text-left group"
              >
                <div
                  className="w-7 h-8 rounded-sm shrink-0 flex items-center justify-center text-white text-[8px] font-bold font-ibm-mono"
                  style={{ backgroundColor: doc.coverColor }}
                  aria-hidden="true"
                >
                  {doc.docType.replace(/[^A-Z0-9]/g, "").slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-slate-900 truncate">{doc.fileName}</p>
                    <RoleBadge role={sd.role} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {doc.docType} · {doc.issuer}
                  </p>
                  {sd.note && (
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">{sd.note}</p>
                  )}
                  <p className="text-[10px] text-slate-400 font-ibm-mono mt-1">
                    Uploaded {formatDate(doc.uploadedAt)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RoleBadge({ role }) {
  if (role === "primary") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider text-navy bg-navy/10 border border-navy/20 rounded px-1 py-0.5">
        <Star className="w-2 h-2" strokeWidth={2.75} fill="currentColor" />
        Primary
      </span>
    );
  }
  if (role === "supporting") {
    return (
      <span className="inline-flex items-center text-[9px] font-medium uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 rounded px-1 py-0.5">
        Supporting
      </span>
    );
  }
  return null;
}
