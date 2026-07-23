import React from "react";
import { Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFieldById } from "@/data/reviewIssues";

/**
 * LockedExplanation — displayed inline when a field is locked/derived.
 * Supports Challenge 08 by clearly explaining why an element is not editable.
 */
export function LockedExplanation({ field, onSelectComponent, className }) {
  if (!field) return null;
  const components = (field.lockedComponentFieldIds || [])
    .map((id) => getFieldById(id))
    .filter(Boolean);

  return (
    <div
      data-testid="locked-explanation"
      className={cn(
        "border border-slate-200 bg-slate-50 rounded-md p-3 text-sm",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Lock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" strokeWidth={2.25} />
        <div className="flex-1">
          <p className="text-slate-700 font-medium text-sm mb-1">
            This value is calculated and cannot be edited directly.
          </p>
          <p className="text-slate-600 text-xs leading-relaxed">
            {field.lockedReason}
          </p>
          {components.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
                Component values
              </p>
              <div className="space-y-1">
                {components.map((c) => (
                  <button
                    key={c.id}
                    data-testid={`locked-jump-${c.id}`}
                    onClick={() => onSelectComponent?.(c)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-left transition-colors"
                  >
                    <span className="text-xs text-slate-700">{c.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
