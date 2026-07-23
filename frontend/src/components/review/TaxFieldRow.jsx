import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { StatusBadge, SeverityDot } from "@/components/status/StatusBadge";
import { ConfidenceIndicator } from "@/components/status/ConfidenceIndicator";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ChevronRight,
  CheckCircle2,
  XCircle,
  PencilLine,
  Info,
  Lock,
} from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { ReviewActionDialog } from "@/components/review/ReviewActionDialog";

/**
 * TaxFieldRow — the dense row in the center panel. This is where Challenge 08
 * is most visible: the visual treatment of each row shifts based on status.
 *
 *   - Editable / needs review:  input-shaped value + action buttons
 *   - Verified:                 flat value + reviewer badge, no input border
 *   - Read-only:                muted static text, no affordance
 *   - Locked:                   lock icon, non-editable, "go to components" hint
 *   - Manual override:          indigo accent + prior value link
 */
export function TaxFieldRow({ field, isSelected, onSelect }) {
  const [dialogMode, setDialogMode] = useState(null); // "accept" | "keep" | "manual"
  const [dialogOpen, setDialogOpen] = useState(false);

  const isActionable =
    field.status === "needs-review" ||
    field.status === "missing-source" ||
    field.status === "conflicting-evidence" ||
    field.status === "ai-generated";

  const hasSuggestion =
    field.aiSuggestedValue !== null &&
    field.aiSuggestedValue !== undefined &&
    field.aiSuggestedValue !== field.currentValue;

  const openDialog = (mode, e) => {
    e?.stopPropagation();
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const borderClass = isSelected
    ? "border-navy ring-1 ring-navy/20"
    : field.status === "needs-review"
      ? "border-amber-200 hover:border-amber-300"
      : field.status === "missing-source"
        ? "border-rose-200 hover:border-rose-300"
        : field.status === "conflicting-evidence"
          ? "border-orange-200 hover:border-orange-300"
          : field.status === "verified"
            ? "border-emerald-200/70 hover:border-emerald-300"
            : field.status === "manually-corrected"
              ? "border-indigo-200 hover:border-indigo-300"
              : field.status === "locked"
                ? "border-slate-200 bg-slate-50/50"
                : "border-slate-200 hover:border-slate-300";

  const isRowClickable = field.status !== "locked" && field.status !== "read-only" ? true : true; // still clickable

  return (
    <>
      <div
        data-testid={`tax-field-row-${field.id}`}
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(field.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(field.id);
          }
        }}
        className={cn(
          "group border rounded-md bg-white p-3 cursor-pointer transition-colors",
          borderClass
        )}
      >
        {/* Top row: label + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <SeverityDot severity={field.severity || "none"} />
              <p className="text-sm font-medium text-slate-900 truncate">{field.label}</p>
            </div>
            <p className="text-[11px] text-slate-500 font-ibm-mono mt-0.5">{field.formRef}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={field.status} />
          </div>
        </div>

        {/* Value display */}
        <div className="mt-2.5 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0 flex-1">
            <FieldValueDisplay field={field} />
          </div>

          {field.confidence && (
            <ConfidenceIndicator confidence={field.confidence} compact />
          )}
        </div>

        {/* AI suggestion inline (when different from current) */}
        {hasSuggestion && (
          <div
            className="mt-2 border border-sky-200 bg-sky-50/60 rounded px-2.5 py-1.5 flex items-center justify-between"
            data-testid={`ai-suggestion-${field.id}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-sky-800 font-medium">
                AI suggests
              </span>
              <span className="font-ibm-mono tabular-nums text-sm font-semibold text-sky-900">
                {typeof field.aiSuggestedValue === "number"
                  ? formatCurrency(field.aiSuggestedValue)
                  : field.aiSuggestedValue}
              </span>
              {field.difference !== null && field.difference !== 0 && (
                <span className="text-[11px] text-amber-800 font-ibm-mono tabular-nums">
                  ({formatCurrency(field.difference, { showSign: true })} vs return)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action row */}
        {isActionable && (
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            {hasSuggestion && (
              <Button
                size="sm"
                className="h-7 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                onClick={(e) => openDialog("accept", e)}
                data-testid={`accept-ai-btn-${field.id}`}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" /> Accept AI
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={(e) => openDialog("keep", e)}
              data-testid={`keep-current-btn-${field.id}`}
            >
              <XCircle className="w-3 h-3 mr-1" /> Keep current
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={(e) => openDialog("manual", e)}
              data-testid={`manual-correction-btn-${field.id}`}
            >
              <PencilLine className="w-3 h-3 mr-1" /> Enter different value
            </Button>
            {field.evidence?.docId && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-slate-600 ml-auto"
                data-testid={`view-source-btn-${field.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(field.id, "source");
                }}
              >
                <FileText className="w-3 h-3 mr-1" /> View source
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            )}
          </div>
        )}

        {field.status === "locked" && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 bg-slate-100/70 rounded px-2 py-1.5 border border-slate-200">
            <Lock className="w-3 h-3" />
            <span>Locked — calculated field. Click to see components.</span>
          </div>
        )}

        {field.status === "read-only" && field.note && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-3 h-3" />
            <span>{field.note}</span>
          </div>
        )}

        {field.status === "manually-corrected" && (
          <div className="mt-2 text-[11px] text-indigo-700 font-ibm-mono">
            Manual override — original AI suggestion preserved in History tab.
          </div>
        )}
      </div>

      <ReviewActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        field={field}
        mode={dialogMode}
      />
    </>
  );
}

function FieldValueDisplay({ field }) {
  const value = field.currentValue;
  const isNumber = typeof value === "number";

  // Different visual treatments per state (Challenge 08)
  if (field.status === "editable" || field.status === "needs-review" || field.status === "conflicting-evidence" || field.status === "missing-source" || field.status === "ai-generated") {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Return value</span>
        <span className="font-ibm-mono tabular-nums text-lg font-semibold text-slate-900">
          {isNumber ? formatCurrency(value) : value}
        </span>
      </div>
    );
  }
  if (field.status === "manually-corrected") {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] uppercase tracking-wider text-indigo-700">Return value</span>
        <span className="font-ibm-mono tabular-nums text-lg font-semibold text-indigo-900">
          {isNumber ? formatCurrency(value) : value}
        </span>
      </div>
    );
  }
  if (field.status === "verified") {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] uppercase tracking-wider text-emerald-700">Return value</span>
        <span className="font-ibm-mono tabular-nums text-lg font-semibold text-slate-900">
          {isNumber ? formatCurrency(value) : value}
        </span>
      </div>
    );
  }
  if (field.status === "locked") {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Calculated</span>
        <span className="font-ibm-mono tabular-nums text-lg font-semibold text-slate-700">
          {isNumber ? formatCurrency(value) : value}
        </span>
      </div>
    );
  }
  // read-only
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-ibm-mono tabular-nums text-lg text-slate-500">
        {isNumber ? formatCurrency(value) : value}
      </span>
    </div>
  );
}
