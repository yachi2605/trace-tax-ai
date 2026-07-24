import React from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkflowContextBar } from "@/components/navigation/WorkflowContextBar";
import { ReturnStatusSummary } from "@/components/status/ReturnStatusSummary";
import { getStaticWorkflow } from "@/data/workflow";
import { useAppState } from "@/store/appStore";
import { formatDate } from "@/utils/format";
import { queueHref, returnStatusHref } from "@/utils/workflowContext";

export function ReturnStatusPage() {
  const { returnId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    state: { returns, queueFilter, queueSearch },
  } = useAppState();
  const ret = returns.find((candidate) => candidate.id === returnId) || null;
  const queueContext = {
    queueFilter: searchParams.get("queueFilter") || queueFilter,
    queueSearch: searchParams.get("queueSearch") || queueSearch,
  };

  if (!ret) return <Navigate to={queueHref(queueContext)} replace />;

  const workflow = getStaticWorkflow(ret);
  const statusPath = returnStatusHref({ returnId: ret.id, ...queueContext });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      <WorkflowContextBar
        ret={ret}
        currentView="Status details"
        context={{ returnId: ret.id, ...queueContext }}
        returnHrefOverride={statusPath}
      />

      <header className="border-b border-slate-200 bg-white px-4 py-3 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-slate-500 -ml-2"
          data-testid="back-to-queue-btn"
          onClick={() => navigate(queueHref(queueContext))}
        >
          <ArrowLeft className="w-3 h-3 mr-1" /> Back to queue
        </Button>
        <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center text-xs font-semibold">
              {ret.clientInitials}
            </div>
            <div>
              <h1 className="font-chivo font-semibold text-slate-900 text-base">
                {ret.clientName}
              </h1>
              <p className="text-[11px] text-slate-500 font-ibm-mono mt-0.5">
                {ret.taxYear} {ret.returnType} · {ret.filingType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              Reviewer: {ret.assignedTo}
            </span>
            <span className="flex items-center gap-1 font-ibm-mono">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formatDate(ret.deadline)}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-thin p-5">
        <div className="max-w-5xl mx-auto">
          <div
            className="mb-4 border border-sky-200 bg-sky-50 rounded-md px-3 py-2 text-xs text-sky-900"
            data-testid="status-only-notice"
          >
            This queue example demonstrates lifecycle context, ownership, blockers, and next
            actions. The complete field-level review workflow is available on Jordan Lee.
          </div>
          <ReturnStatusSummary ret={ret} workflow={workflow} />
        </div>
      </main>
    </div>
  );
}
