import React from "react";
import {
  Sparkles,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Pencil,
  PencilLine,
  FileWarning,
  GitBranch,
  Eye,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StatusBadge — shared visual language for Challenge 08 (Clickable vs. Editable)
 *
 * Uses icon + text label + color + border to communicate status without
 * relying on color alone (accessibility).
 */
const STATUS_META = {
  "ai-generated": {
    label: "AI-generated",
    icon: Cpu,
    classes: "bg-sky-50 text-sky-800 border-sky-200",
  },
  "needs-review": {
    label: "Needs review",
    icon: AlertTriangle,
    classes: "bg-amber-50 text-amber-800 border-amber-200",
  },
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  editable: {
    label: "Editable",
    icon: Pencil,
    classes: "bg-slate-50 text-slate-700 border-slate-200",
  },
  "read-only": {
    label: "Read-only",
    icon: Eye,
    classes: "bg-slate-50 text-slate-500 border-slate-200",
  },
  locked: {
    label: "Locked",
    icon: Lock,
    classes: "bg-slate-100 text-slate-600 border-slate-300",
  },
  "manually-corrected": {
    label: "Manual override",
    icon: PencilLine,
    classes: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  "missing-source": {
    label: "Missing source",
    icon: FileWarning,
    classes: "bg-rose-50 text-rose-800 border-rose-200",
  },
  "conflicting-evidence": {
    label: "Conflicting evidence",
    icon: GitBranch,
    classes: "bg-orange-50 text-orange-800 border-orange-200",
  },
};

export function StatusBadge({ status, size = "sm", className, showIcon = true, testId }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  const Icon = meta.icon;
  const sizeClass = size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  return (
    <span
      data-testid={testId || `status-badge-${status}`}
      className={cn(
        "inline-flex items-center gap-1 border rounded font-medium tracking-tight",
        sizeClass,
        meta.classes,
        className
      )}
    >
      {showIcon && <Icon className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} strokeWidth={2.25} />}
      <span>{meta.label}</span>
    </span>
  );
}

// Small severity dot for row-level scanning
export function SeverityDot({ severity, className }) {
  const map = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-slate-400",
    none: "bg-emerald-500",
  };
  return (
    <span
      aria-label={`Severity: ${severity}`}
      className={cn("inline-block w-2 h-2 rounded-full", map[severity] || "bg-slate-300", className)}
    />
  );
}

// Sparkle indicator for AI-touched values (paired with badge). Uses Cpu, not sparkles-only.
export function AiTouchIcon({ className }) {
  return <Cpu className={cn("w-3 h-3 text-sky-700", className)} strokeWidth={2.25} />;
}
