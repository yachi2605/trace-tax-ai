import React from "react";
import { DOCUMENTS } from "@/data/documents";
import { DocumentPreview } from "@/components/evidence/DocumentPreview";
import { WorkflowContextBar } from "@/components/navigation/WorkflowContextBar";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  History,
  Link2,
} from "lucide-react";
import { formatDate } from "@/utils/format";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAppState } from "@/store/appStore";
import {
  activityHref,
  getSectionMeta,
  returnHref,
} from "@/utils/workflowContext";

/**
 * DocumentsPage — URL-addressable source document library that retains the
 * selected return field and source region.
 */
export function DocumentsPage() {
  const {
    state: { returns, fields, queueFilter, queueSearch },
  } = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const returnId = searchParams.get("returnId") || "ret-2025-001";
  const ret = returns.find((candidate) => candidate.id === returnId);
  const field = fields[searchParams.get("field")] || null;
  const sectionId = field?.section || searchParams.get("section") || "wages";
  const sectionMeta = getSectionMeta(sectionId);
  const requestedId = searchParams.get("document");
  const fieldDefaultDoc = field?.evidence?.docId;
  const selectedId = DOCUMENTS.some((doc) => doc.id === requestedId)
    ? requestedId
    : DOCUMENTS.some((doc) => doc.id === fieldDefaultDoc)
      ? fieldDefaultDoc
      : DOCUMENTS[0].id;
  const selected = DOCUMENTS.find((doc) => doc.id === selectedId);
  const requestedRegion = searchParams.get("region");
  const validRegion = selected.pages_meta?.some((page) =>
    page.regions?.some((region) => region.id === requestedRegion)
  )
    ? requestedRegion
    : null;
  const relatedDocumentIds = new Set([
    field?.evidence?.docId,
    ...(field?.supportingDocuments || []).map((item) => item.docId),
    ...(field?.evidence?.transformation?.breakdown || []).map((item) => item.docId),
    ...(field?.evidence?.transformation?.conflictingSources || []).map((item) => item.docId),
  ].filter(Boolean));
  const isRelatedDocument = relatedDocumentIds.has(selectedId);
  const queueContext = {
    queueFilter: searchParams.get("queueFilter") || queueFilter,
    queueSearch: searchParams.get("queueSearch") || queueSearch,
  };
  const context = {
    returnId,
    sectionId,
    fieldId: field?.id,
    documentId: selectedId,
    regionId: validRegion,
    ...queueContext,
  };

  if (!ret?.workspaceAvailable) {
    return <Navigate to="/" replace />;
  }

  const selectDocument = (docId) => {
    const next = new URLSearchParams(searchParams);
    next.set("returnId", returnId);
    next.set("document", docId);
    const relatedRegion = regionForDocument(field, docId);
    if (relatedRegion) next.set("region", relatedRegion);
    else next.delete("region");
    setSearchParams(next);
  };

  const backHref = field
    ? returnHref({ ...context, tab: "source" })
    : returnHref({ ...context, tab: "summary" });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      <WorkflowContextBar
        ret={ret}
        field={field}
        sectionMeta={sectionMeta}
        document={selected}
        currentView="Source document"
        context={context}
      />

      <main className="flex-1 flex overflow-hidden bg-slate-50">
        <div className="w-80 shrink-0 border-r border-slate-200 bg-white overflow-y-auto scrollbar-thin">
          <div className="p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
            <Link
              to={backHref}
              className="inline-flex items-center gap-1 text-xs text-navy hover:underline mb-2"
              data-testid="documents-back-to-field"
            >
              <ArrowLeft className="w-3 h-3" />
              {field ? `Back to ${sectionMeta?.label || "return"} review` : `Back to ${ret.clientName}`}
            </Link>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">
              Documents
            </p>
            <h1 className="font-chivo font-semibold text-slate-900 text-lg mt-0.5">
              {ret.clientName} · {ret.taxYear}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {DOCUMENTS.length} source documents
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {DOCUMENTS.map((doc) => {
              const isSelected = selectedId === doc.id;
              return (
                <li key={doc.id}>
                  <button
                    type="button"
                    data-testid={`document-list-${doc.id}`}
                    aria-current={isSelected ? "true" : undefined}
                    onClick={() => selectDocument(doc.id)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-l-2",
                      isSelected ? "bg-slate-50 border-l-navy" : "border-l-transparent"
                    )}
                  >
                    <div
                      className="w-8 h-10 rounded-sm shrink-0 flex items-center justify-center text-white text-[9px] font-bold font-ibm-mono"
                      style={{ backgroundColor: doc.coverColor }}
                    >
                      {doc.docType.replace(/[^A-Z0-9]/g, "").slice(0, 3)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-900 truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{doc.issuer}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <StatusPill status={doc.status} />
                        <span className="text-[10px] text-slate-400 font-ibm-mono">
                          {formatDate(doc.uploadedAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="max-w-2xl">
            {field && (
              <div
                className="mb-4 border border-navy/15 bg-navy/[0.03] rounded-md p-3"
                data-testid="document-field-context"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-navy font-medium">
                      {isRelatedDocument
                        ? "Source for selected review issue"
                        : "Selected issue context retained"}
                    </p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {field.formRef} · {field.label}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {validRegion
                        ? `The extracted source region ${validRegion} is highlighted below.`
                        : isRelatedDocument
                          ? "This document contributes to the selected field."
                          : "This document is not linked to the selected issue; the issue remains selected while you browse."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={returnHref({ ...context, tab: "summary" })}
                      className="text-xs text-navy hover:underline"
                    >
                      Open issue
                    </Link>
                    <Link
                      to={activityHref(context)}
                      className="inline-flex items-center gap-1 text-xs text-navy hover:underline"
                    >
                      <History className="w-3 h-3" />
                      Activity
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {searchParams.get("event") && (
              <div className="mb-4 border border-sky-200 bg-sky-50 text-sky-900 rounded-md p-2.5 text-xs">
                Opened from activity event{" "}
                <span className="font-ibm-mono">{searchParams.get("event")}</span>. The related
                document is selected.
              </div>
            )}

            {selected && (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                      {selected.docType}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[9px] text-navy bg-navy/5 border border-navy/15 rounded px-1.5 py-0.5">
                      <Link2 className="w-2.5 h-2.5" />
                      Active document
                    </span>
                  </div>
                  <h2 className="font-chivo font-semibold text-slate-900 text-lg mt-0.5">
                    {selected.fileName}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Issued by {selected.issuer} · Uploaded {formatDate(selected.uploadedAt, "long")}
                  </p>
                </div>
                <DocumentPreview
                  document={selected}
                  highlightRegionId={validRegion}
                  expanded
                  context={context}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function regionForDocument(field, docId) {
  if (!field) return null;
  if (field.evidence?.docId === docId) return field.evidence?.regionId || null;
  const breakdown = field.evidence?.transformation?.breakdown?.find(
    (item) => item.docId === docId
  );
  return breakdown?.regionId || null;
}

function StatusPill({ status }) {
  const map = {
    verified: { icon: CheckCircle2, label: "Verified", classes: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    "low-confidence": { icon: AlertTriangle, label: "Low confidence", classes: "bg-amber-50 text-amber-800 border-amber-200" },
    conflict: { icon: GitBranch, label: "Conflict", classes: "bg-orange-50 text-orange-800 border-orange-200" },
  };
  const meta = map[status] || { icon: FileText, label: "Uploaded", classes: "bg-slate-50 text-slate-700 border-slate-200" };
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 border rounded px-1.5 py-0.5 text-[9px] font-medium", meta.classes)}>
      <Icon className="w-2.5 h-2.5" strokeWidth={2.25} />
      {meta.label}
    </span>
  );
}
