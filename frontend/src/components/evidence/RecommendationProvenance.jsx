import React from "react";
import { cn } from "@/lib/utils";
import { getDocumentById } from "@/data/documents";
import {
  FileText,
  ArrowRight,
  Sigma,
  GitBranch,
  FileWarning,
  Pencil,
  Lock,
  ChevronRight,
} from "lucide-react";
import { formatCurrency } from "@/utils/format";

/**
 * RecommendationProvenance — "How this recommendation was generated"
 *
 * A structured, at-a-glance card showing exactly:
 *   - which source document was used
 *   - which page
 *   - which field / box on that document
 *   - which transformation was applied (Direct Mapping, Aggregation, etc.)
 *   - what value came out
 *
 * This is the trust anchor for Challenge 10 + Challenge 01, phrased in
 * user-facing terms (no chain-of-thought, no model internals).
 */
const TRANSFORMATION_META = {
  "direct-mapping": {
    label: "Direct mapping",
    description: "I read the value straight from the source document. No math applied.",
    icon: ArrowRight,
  },
  "sum-of-multiple-sources": {
    label: "Aggregation",
    description: "I added values from more than one source document together.",
    icon: Sigma,
  },
  "rounded-value": {
    label: "Rounded value",
    description: "I rounded the source value to match how the field is normally reported.",
    icon: Sigma,
  },
  "normalized-formatting": {
    label: "Normalized formatting",
    description: "I reformatted the value (e.g., stripped currency symbols) without changing its meaning.",
    icon: ArrowRight,
  },
  "manual-override": {
    label: "Manual override",
    description: "A reviewer overrode the value I originally extracted.",
    icon: Pencil,
  },
  conflict: {
    label: "Conflicting sources — no auto-selection",
    description: "Two source documents disagree. I did not pick one on your behalf.",
    icon: GitBranch,
  },
  "partial-match": {
    label: "Partial match",
    description: "I could only support part of the claimed value with source evidence.",
    icon: FileWarning,
  },
};

export function RecommendationProvenance({ field, className }) {
  const evidence = field?.evidence;
  const transformation = evidence?.transformation;

  // Locked fields: separate presentation, no doc/page/box
  if (field?.status === "locked") {
    return (
      <ProvenanceCard title="How this value is calculated" className={className}>
        <ProvenanceRow icon={Lock} label="Type" value="Calculated field" />
        <ProvenanceRow
          icon={Sigma}
          label="Derived from"
          value={
            <span>
              {field.lockedComponentFieldIds?.length || 0} component field
              {(field.lockedComponentFieldIds?.length || 0) === 1 ? "" : "s"}
            </span>
          }
        />
        <ProvenanceNote>
          I don't extract this value directly — it changes automatically when you
          edit one of the component fields listed in the tab above.
        </ProvenanceNote>
      </ProvenanceCard>
    );
  }

  if (!transformation) {
    return (
      <ProvenanceCard title="How this recommendation was generated" className={className}>
        <ProvenanceNote>
          I don't have a source-backed recommendation for this field. Any value
          here came directly from the return without AI extraction.
        </ProvenanceNote>
      </ProvenanceCard>
    );
  }

  const meta = TRANSFORMATION_META[transformation.type] || TRANSFORMATION_META["direct-mapping"];
  const TIcon = meta.icon;

  // Aggregation → list every component source
  if (transformation.type === "sum-of-multiple-sources") {
    return (
      <ProvenanceCard title="How this recommendation was generated" className={className}>
        <ProvenanceRow icon={TIcon} label="Transformation" value={meta.label} strong />
        <ProvenanceNote>{meta.description}</ProvenanceNote>
        <div className="mt-2 pt-2 border-t border-slate-200">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            Component sources
          </p>
          <ul className="space-y-1.5">
            {transformation.breakdown.map((b, i) => {
              const d = getDocumentById(b.docId);
              return (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs"
                  data-testid="provenance-component"
                >
                  <FileText className="w-3 h-3 mt-0.5 text-slate-500 shrink-0" strokeWidth={2.25} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 leading-tight">{b.label}</p>
                    <p className="text-[10px] text-slate-500 font-ibm-mono">
                      {d?.fileName || b.docId} · page 1
                    </p>
                  </div>
                  <span className="font-ibm-mono tabular-nums text-xs font-semibold text-slate-900 shrink-0">
                    {formatCurrency(b.value)}
                  </span>
                </li>
              );
            })}
            <li className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 mt-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Calculated total
              </span>
              <span className="font-ibm-mono tabular-nums font-bold text-slate-900">
                {formatCurrency(evidence.sourceValue)}
              </span>
            </li>
          </ul>
        </div>
      </ProvenanceCard>
    );
  }

  // Conflict → list both sources with values
  if (transformation.type === "conflict") {
    return (
      <ProvenanceCard title="How this recommendation was generated" className={className}>
        <ProvenanceRow icon={TIcon} label="Transformation" value={meta.label} strong />
        <ProvenanceNote>{meta.description}</ProvenanceNote>
        <div className="mt-2 pt-2 border-t border-slate-200">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            Documents in conflict
          </p>
          <ul className="space-y-1.5">
            {transformation.conflictingSources.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs"
                data-testid="provenance-conflict-source"
              >
                <FileText className="w-3 h-3 mt-0.5 text-slate-500 shrink-0" strokeWidth={2.25} />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 leading-tight">{c.label}</p>
                  <p className="text-[10px] text-slate-500 font-ibm-mono">Uploaded {c.uploadedAt}</p>
                </div>
                <span className="font-ibm-mono tabular-nums text-xs font-semibold text-slate-900 shrink-0">
                  {c.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </ProvenanceCard>
    );
  }

  // Standard: single-doc extraction (direct mapping, partial match, etc.)
  const doc = getDocumentById(evidence.docId);
  const region = doc?.pages_meta?.[0]?.regions?.find((r) => r.id === evidence.regionId);

  return (
    <ProvenanceCard title="How this recommendation was generated" className={className}>
      <ProvenanceRow
        icon={FileText}
        label="Source document"
        value={doc?.fileName || "—"}
        subValue={doc ? `${doc.docType} · ${doc.issuer}` : null}
      />
      <ProvenanceRow icon={ChevronRight} label="Page" value={evidence.page ? `Page ${evidence.page}` : "—"} />
      <ProvenanceRow
        icon={ChevronRight}
        label="Field / Box"
        value={region?.label || "—"}
      />
      <ProvenanceRow icon={TIcon} label="Transformation" value={meta.label} strong />
      <ProvenanceRow
        icon={ChevronRight}
        label="Extracted value"
        value={
          typeof evidence.sourceValue === "number"
            ? formatCurrency(evidence.sourceValue)
            : evidence.sourceValue || "—"
        }
        mono
      />
      <ProvenanceNote>{meta.description}</ProvenanceNote>
    </ProvenanceCard>
  );
}

// ---------- Layout primitives ----------

function ProvenanceCard({ title, children, className }) {
  return (
    <div
      data-testid="recommendation-provenance"
      className={cn(
        "border border-slate-200 rounded-md bg-white overflow-hidden",
        className
      )}
    >
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
        <p className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">{title}</p>
      </div>
      <div className="px-3 py-2 divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function ProvenanceRow({ icon: Icon, label, value, subValue, mono, strong }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className="w-3 h-3 mt-1 text-slate-400 shrink-0" strokeWidth={2.25} />
      <div className="w-24 shrink-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium leading-tight pt-0.5">
          {label}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-xs text-slate-900 leading-tight break-words",
            mono && "font-ibm-mono tabular-nums font-semibold",
            strong && "font-semibold"
          )}
        >
          {value}
        </p>
        {subValue && <p className="text-[10px] text-slate-500 mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
}

function ProvenanceNote({ children }) {
  return (
    <p className="text-[11px] text-slate-500 leading-relaxed pt-2 mt-1 italic">{children}</p>
  );
}
