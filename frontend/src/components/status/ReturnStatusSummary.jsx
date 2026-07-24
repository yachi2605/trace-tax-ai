import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/utils/format";

const stepStyles = {
  complete: {
    icon: Check,
    dot: "bg-emerald-600 border-emerald-600 text-white",
    text: "text-slate-600",
  },
  current: {
    icon: Clock3,
    dot: "bg-navy border-navy text-white ring-2 ring-navy/15",
    text: "text-navy font-semibold",
  },
  paused: {
    icon: Clock3,
    dot: "bg-amber-100 border-amber-400 text-amber-800",
    text: "text-amber-800",
  },
  skipped: {
    icon: Circle,
    dot: "bg-white border-slate-300 text-slate-300",
    text: "text-slate-400",
  },
  upcoming: {
    icon: Circle,
    dot: "bg-white border-slate-300 text-slate-300",
    text: "text-slate-500",
  },
};

export function ReturnStatusSummary({ ret, workflow, onOpenBlocker }) {
  return (
    <section
      className="border border-slate-200 rounded-md bg-white overflow-hidden mb-5"
      data-testid="return-status-summary"
      aria-labelledby="return-status-heading"
      aria-live="polite"
    >
      <div className="px-4 py-3 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
            Return status
          </p>
          <h2
            id="return-status-heading"
            className="font-chivo font-semibold text-slate-900 text-base mt-0.5"
          >
            {workflow.stage}
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {workflow.stageContext}
          </p>
        </div>
        <div className="min-w-[130px]">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>Review progress</span>
            <span className="font-ibm-mono font-semibold text-slate-800">
              {Number.isFinite(workflow.resolved) &&
              Number.isFinite(workflow.totalReviewable)
                ? `${workflow.resolved}/${workflow.totalReviewable} fields · `
                : ""}
              {workflow.progress}%
            </span>
          </div>
          <Progress value={workflow.progress} className="h-2 bg-slate-200" />
        </div>
      </div>

      <div className="px-4 py-3 border-b border-slate-200">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-2.5">
          Return lifecycle
        </p>
        <ol className="grid grid-cols-4 gap-x-2 gap-y-3" aria-label="Return lifecycle">
          {workflow.steps.map((step) => {
            const meta = stepStyles[step.status] || stepStyles.upcoming;
            const Icon = meta.icon;
            return (
              <li
                key={step.id}
                className="flex items-start gap-2 min-w-0"
                data-testid={`workflow-step-${step.id}`}
                data-status={step.status}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center shrink-0",
                    meta.dot
                  )}
                >
                  <Icon className="w-3 h-3" strokeWidth={2.5} />
                </span>
                <span className={cn("text-[11px] leading-tight mt-0.5", meta.text)}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <StatusAnswer
          label="Current work"
          icon={Clock3}
          value={workflow.currentWork}
        />
        <StatusAnswer
          label="Next required action"
          icon={ArrowRight}
          value={workflow.nextAction}
        >
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 mt-1.5">
            <UserRound className="w-3 h-3" />
            Owner: <strong className="font-medium text-slate-700">{workflow.actionOwner}</strong>
          </span>
        </StatusAnswer>
        <StatusAnswer
          label="Deadline"
          icon={Clock3}
          value={formatDate(ret.deadline)}
        >
          <span className="text-[10px] text-slate-500 mt-1.5">
            Filing deadline for this return
          </span>
        </StatusAnswer>
      </div>

      <div className="border-t border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
            Blocking completion
          </p>
          <span
            className={cn(
              "text-[10px] font-semibold rounded px-1.5 py-0.5",
              workflow.blockers.length
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            )}
          >
            {workflow.blockers.length
              ? `${workflow.blockers.length} open`
              : "No blockers"}
          </span>
        </div>
        {workflow.blockers.length ? (
          <ul className="space-y-1.5">
            {workflow.blockers.map((blocker) => (
              <li key={blocker.id}>
                {onOpenBlocker ? (
                  <button
                    type="button"
                    className="w-full flex items-start gap-2 text-left border border-amber-200 bg-amber-50 rounded px-2.5 py-2 hover:border-amber-300 transition-colors"
                    onClick={() => onOpenBlocker(blocker)}
                    data-testid={`status-blocker-${blocker.fieldId || blocker.id}`}
                  >
                    <BlockerContent blocker={blocker} />
                  </button>
                ) : (
                  <div
                    className="w-full flex items-start gap-2 text-left border border-amber-200 bg-amber-50 rounded px-2.5 py-2"
                    data-testid={`status-blocker-${blocker.fieldId || blocker.id}`}
                  >
                    <BlockerContent blocker={blocker} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            Review is complete. The return can proceed to final filing checks.
          </div>
        )}
      </div>
    </section>
  );
}

function BlockerContent({ blocker }) {
  return (
    <>
      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-medium text-amber-950">
          {blocker.label}
        </span>
        <span className="block text-[11px] text-amber-900/80 mt-0.5">
          {blocker.detail}
        </span>
      </span>
      <span className="text-[10px] text-amber-800 shrink-0">
        Owner: {blocker.owner}
      </span>
    </>
  );
}

function StatusAnswer({ label, icon: Icon, value, children }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-slate-500 font-medium">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <p className="text-xs text-slate-800 leading-relaxed mt-1.5">{value}</p>
      {children}
    </div>
  );
}
