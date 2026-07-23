import React, { useState } from "react";
import { DOCUMENTS } from "@/data/documents";
import { DocumentPreview } from "@/components/evidence/DocumentPreview";
import { cn } from "@/lib/utils";
import { FileText, CheckCircle2, AlertTriangle, GitBranch } from "lucide-react";
import { formatDate } from "@/utils/format";

/**
 * DocumentsPage — a simple document library for Jordan Lee.
 */
export function DocumentsPage() {
  const [selectedId, setSelectedId] = useState(DOCUMENTS[0].id);
  const selected = DOCUMENTS.find((d) => d.id === selectedId);

  return (
    <main className="flex-1 flex overflow-hidden bg-slate-50">
      {/* Document list */}
      <div className="w-80 shrink-0 border-r border-slate-200 bg-white overflow-y-auto scrollbar-thin">
        <div className="p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">
            Documents
          </p>
          <h1 className="font-chivo font-semibold text-slate-900 text-lg mt-0.5">
            Jordan Lee · 2025
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
                  onClick={() => setSelectedId(doc.id)}
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

      {/* Preview */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="max-w-2xl">
          {selected && (
            <>
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                  {selected.docType}
                </p>
                <h2 className="font-chivo font-semibold text-slate-900 text-lg mt-0.5">
                  {selected.fileName}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Issued by {selected.issuer} · Uploaded {formatDate(selected.uploadedAt, "long")}
                </p>
              </div>
              <DocumentPreview document={selected} expanded />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function StatusPill({ status }) {
  const map = {
    verified: { icon: CheckCircle2, label: "Verified", classes: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    "low-confidence": { icon: AlertTriangle, label: "Low confidence", classes: "bg-amber-50 text-amber-800 border-amber-200" },
    conflict: { icon: GitBranch, label: "Conflict", classes: "bg-orange-50 text-orange-800 border-orange-200" },
  };
  const m = map[status] || { icon: FileText, label: "Uploaded", classes: "bg-slate-50 text-slate-700 border-slate-200" };
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 border rounded px-1.5 py-0.5 text-[9px] font-medium", m.classes)}>
      <Icon className="w-2.5 h-2.5" strokeWidth={2.25} />
      {m.label}
    </span>
  );
}
