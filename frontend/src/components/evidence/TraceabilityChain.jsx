import React from "react";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  FileText,
  Sigma,
  Layers,
  ArrowRight,
  Target,
} from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { getDocumentById } from "@/data/documents";

/**
 * TraceabilityChain — visual audit chain that walks from source document(s)
 * through each transformation step to the final return field value.
 *
 * Renders a top-down "flow" using cards + arrows so the auditability story
 * feels complete: any reviewer can follow the path with their eyes in
 * seconds.
 *
 * Handles single-source (direct mapping) and multi-source (aggregation)
 * transformations. Gracefully tolerates legacy string-based step arrays.
 */
export function TraceabilityChain({ field, className }) {
  const evidence = field?.evidence;
  const t = evidence?.transformation;

  if (!t) return null;

  const isAggregation = t.type === "sum-of-multiple-sources";
  const steps = normalizeSteps(t.steps || []);
  const tracedValue =
    field.aiSuggestedValue !== null && field.aiSuggestedValue !== undefined
      ? field.aiSuggestedValue
      : evidence.sourceValue !== null && evidence.sourceValue !== undefined
        ? evidence.sourceValue
        : field.currentValue;
  const showsCurrentComparison =
    t.type !== "conflict" &&
    field.currentValue !== null &&
    field.currentValue !== undefined &&
    tracedValue !== field.currentValue;
  const terminalLabel =
    t.type === "partial-match"
      ? "Source-supported amount"
      : t.type === "conflict"
        ? "Reviewer source decision"
        : "AI suggested return value";

  return (
    <div
      data-testid="traceability-chain"
      className={cn(
        "border border-slate-200 rounded-md bg-white overflow-hidden",
        className
      )}
    >
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-slate-600" strokeWidth={2.25} />
        <p className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
          Full traceability chain
        </p>
      </div>

      <div className="p-3 space-y-2">
        {/* Origin node — source document(s) */}
        {isAggregation ? (
          <MultiSourceOrigin breakdown={t.breakdown || []} />
        ) : evidence.docId ? (
          <SingleSourceOrigin
            docId={evidence.docId}
            page={evidence.page}
            regionId={evidence.regionId}
            extractedValue={evidence.sourceValue}
          />
        ) : (
          <ChainCard tone="slate">
            <p className="text-xs text-slate-600 italic">
              No source document — value came directly from the return.
            </p>
          </ChainCard>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <>
            <ChainArrow />
            <div className="space-y-2">
              {steps.map((s, i) => (
                <React.Fragment key={i}>
                  <StepCard step={s} index={i} />
                  {i < steps.length - 1 && <ChainArrow />}
                </React.Fragment>
              ))}
            </div>
          </>
        )}

        {/* Terminal node — the value actually supported or recommended by this chain */}
        <ChainArrow />
        <ChainCard tone="navy" testId="chain-recommendation-node">
          <div className="flex items-start gap-2">
            <Target className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2.25} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                {terminalLabel}
              </p>
              <p className="text-sm font-medium mt-0.5">{field.label}</p>
              <p className="text-[11px] font-ibm-mono opacity-80 mt-0.5">{field.formRef}</p>
            </div>
            <span className="font-ibm-mono tabular-nums text-sm font-bold">
              {typeof tracedValue === "number" ? formatCurrency(tracedValue) : tracedValue}
            </span>
          </div>
        </ChainCard>

        {showsCurrentComparison && (
          <>
            <ChainArrow />
            <ChainCard tone="amber" testId="chain-current-comparison">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold">
                    Current return value differs
                  </p>
                  <p className="text-[11px] mt-0.5">
                    A reviewer decision is required before this value is treated as supported.
                  </p>
                </div>
                <span className="font-ibm-mono tabular-nums text-sm font-bold shrink-0">
                  {typeof field.currentValue === "number"
                    ? formatCurrency(field.currentValue)
                    : field.currentValue}
                </span>
              </div>
            </ChainCard>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- helpers ----------

function normalizeSteps(steps) {
  return steps.map((s) => {
    if (typeof s === "string") {
      // Strip leading "N. " numbering artefacts
      return { detail: s.replace(/^\d+\.\s*/, "") };
    }
    return s;
  });
}

function SingleSourceOrigin({ docId, page, regionId, extractedValue }) {
  const doc = getDocumentById(docId);
  const region = doc?.pages_meta?.[0]?.regions?.find((r) => r.id === regionId);
  return (
    <ChainCard tone="sky" testId="chain-origin-node">
      <div className="flex items-start gap-2">
        <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2.25} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
            Source document
          </p>
          <p className="text-sm font-medium mt-0.5 truncate">
            {doc?.fileName || docId}
          </p>
          <p className="text-[11px] opacity-80 mt-0.5">
            {doc?.docType || "Document"}
            {page ? <> · Page {page}</> : null}
            {region ? <> · {region.label}</> : null}
          </p>
        </div>
        {extractedValue !== null && extractedValue !== undefined && (
          <span
            className="font-ibm-mono tabular-nums text-xs font-bold shrink-0"
            data-testid="chain-origin-value"
          >
            {typeof extractedValue === "number"
              ? formatCurrency(extractedValue)
              : extractedValue}
          </span>
        )}
      </div>
    </ChainCard>
  );
}

function MultiSourceOrigin({ breakdown }) {
  const total = breakdown.reduce((sum, b) => sum + (typeof b.value === "number" ? b.value : 0), 0);
  return (
    <ChainCard tone="sky" testId="chain-origin-multi-node">
      <div className="flex items-start gap-2 mb-2">
        <Sigma className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2.25} />
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
            Aggregated from {breakdown.length} source documents
          </p>
        </div>
        <span className="font-ibm-mono tabular-nums text-xs font-bold shrink-0">
          {formatCurrency(total)}
        </span>
      </div>
      <ul className="space-y-1 pt-1 border-t border-current/10">
        {breakdown.map((b, i) => {
          const d = getDocumentById(b.docId);
          return (
            <li
              key={i}
              className="flex items-start gap-2 text-[11px]"
              data-testid="chain-breakdown-item"
            >
              <ArrowRight className="w-3 h-3 mt-0.5 opacity-50 shrink-0" strokeWidth={2.25} />
              <div className="flex-1 min-w-0">
                <p className="truncate">{b.label}</p>
                <p className="text-[10px] font-ibm-mono opacity-70 truncate">
                  {d?.fileName || b.docId} · page 1
                </p>
              </div>
              <span className="font-ibm-mono tabular-nums font-semibold shrink-0">
                {formatCurrency(b.value)}
              </span>
            </li>
          );
        })}
      </ul>
    </ChainCard>
  );
}

function StepCard({ step, index }) {
  return (
    <ChainCard tone="white" testId="chain-step">
      <div className="flex items-start gap-2">
        <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-navy text-white text-[9px] font-bold flex items-center justify-center font-ibm-mono">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          {step.label && (
            <p className="text-xs font-medium text-slate-900">{step.label}</p>
          )}
          <p className={cn("text-[11px] text-slate-600 leading-relaxed", step.label && "mt-0.5")}>
            {step.detail}
          </p>
        </div>
        {step.value !== undefined && step.value !== null && (
          <span className="font-ibm-mono tabular-nums text-xs font-semibold text-slate-800 shrink-0 pl-2">
            {typeof step.value === "number" ? formatCurrency(step.value) : step.value}
          </span>
        )}
      </div>
    </ChainCard>
  );
}

function ChainCard({ children, tone, testId }) {
  const toneClasses = {
    sky: "border-sky-200 bg-sky-50 text-sky-900",
    navy: "border-navy bg-navy text-white",
    white: "border-slate-200 bg-white text-slate-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    amber: "border-amber-300 bg-amber-50 text-amber-950",
  }[tone || "white"];
  return (
    <div
      data-testid={testId}
      className={cn("border rounded-md px-2.5 py-2", toneClasses)}
    >
      {children}
    </div>
  );
}

function ChainArrow() {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <ArrowDown className="w-3.5 h-3.5 text-slate-300" strokeWidth={2.5} />
    </div>
  );
}
