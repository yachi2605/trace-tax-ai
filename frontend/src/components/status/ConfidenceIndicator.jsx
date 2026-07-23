import React from "react";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Plus, Minus, Circle } from "lucide-react";

/**
 * ConfidenceIndicator — plain-language confidence with factor breakdown.
 *
 * Shows a categorical label (High/Medium/Low), a percentage, a human reason,
 * and — when available — a structured list of factors that contributed
 * positively or negatively. Directly supports Challenge 10 (Trustworthy AI).
 */
export function ConfidenceIndicator({ confidence, compact = false, className, testId, showFactors = true }) {
  if (!confidence) return null;
  const { level, pct, reason, factors } = confidence;

  const styles = {
    high: {
      label: "High confidence",
      icon: ShieldCheck,
      classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
      bar: "bg-emerald-500",
    },
    medium: {
      label: "Medium confidence",
      icon: ShieldQuestion,
      classes: "bg-amber-50 text-amber-800 border-amber-200",
      bar: "bg-amber-500",
    },
    low: {
      label: "Low confidence",
      icon: ShieldAlert,
      classes: "bg-red-50 text-red-800 border-red-200",
      bar: "bg-red-500",
    },
  };
  const s = styles[level] || styles.medium;
  const Icon = s.icon;

  if (compact) {
    return (
      <span
        data-testid={testId || `confidence-${level}`}
        className={cn(
          "inline-flex items-center gap-1 border rounded px-2 py-0.5 text-xs font-medium",
          s.classes,
          className
        )}
        title={reason}
      >
        <Icon className="w-3 h-3" strokeWidth={2.25} />
        <span className="font-ibm-mono">
          {pct}% · {level.charAt(0).toUpperCase() + level.slice(1)}
        </span>
      </span>
    );
  }

  return (
    <div
      data-testid={testId || `confidence-${level}`}
      className={cn("border rounded-md p-3", s.classes, className)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" strokeWidth={2.25} />
          <span className="font-medium text-sm">{s.label}</span>
        </div>
        <span className="font-ibm-mono text-sm font-semibold tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden mb-2">
        <div
          className={cn("h-full rounded-full", s.bar)}
          style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
        />
      </div>
      <p className="text-xs leading-relaxed opacity-90">{reason}</p>

      {showFactors && factors && factors.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-current/10">
          <p className="text-[10px] uppercase tracking-wider font-medium opacity-70 mb-1.5">
            What contributed to this confidence
          </p>
          <ul className="space-y-1" data-testid="confidence-factors">
            {factors.map((f, i) => (
              <ConfidenceFactor key={i} factor={f} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ConfidenceFactor({ factor }) {
  const map = {
    positive: {
      icon: Plus,
      classes: "text-emerald-700 bg-emerald-100 border-emerald-200",
      strokeWidth: 3,
    },
    negative: {
      icon: Minus,
      classes: "text-red-700 bg-red-100 border-red-200",
      strokeWidth: 3,
    },
    neutral: {
      icon: Circle,
      classes: "text-slate-600 bg-slate-100 border-slate-200",
      strokeWidth: 2,
    },
  };
  const m = map[factor.impact] || map.neutral;
  const Icon = m.icon;
  return (
    <li className="flex items-start gap-2 text-xs">
      <span
        className={cn(
          "shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center",
          m.classes
        )}
        aria-hidden="true"
      >
        <Icon className="w-2 h-2" strokeWidth={m.strokeWidth} />
      </span>
      <span className="leading-relaxed opacity-90">{factor.label}</span>
    </li>
  );
}
