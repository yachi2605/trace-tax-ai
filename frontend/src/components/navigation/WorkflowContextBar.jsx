import React from "react";
import { ChevronRight, FileText, FolderOpen, Layers3, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { queueHref, returnHref } from "@/utils/workflowContext";

export function WorkflowContextBar({
  ret,
  field,
  sectionMeta,
  document,
  currentView = "Return review",
  context,
  returnHrefOverride,
  className,
}) {
  if (!ret) return null;

  const returnContext = {
    ...context,
    returnId: ret.id,
    sectionId: field?.section || context?.sectionId,
    fieldId: field?.id || context?.fieldId,
    tab: context?.tab || "summary",
  };

  return (
    <div
      className={cn("border-b border-slate-200 bg-white px-4 py-2", className)}
      data-testid="workflow-context-bar"
    >
      <nav
        className="flex items-center gap-1 text-[11px] text-slate-500 overflow-x-auto whitespace-nowrap"
        aria-label="Workflow breadcrumb"
      >
        <Link
          to={queueHref(context)}
          className="hover:text-navy hover:underline"
        >
          Review Queue
        </Link>
        <Crumb />
        <Link
          to={returnHrefOverride || returnHref({ ...returnContext, tab: "summary" })}
          className="hover:text-navy hover:underline"
        >
          {ret.clientName}
        </Link>
        {sectionMeta?.parent && (
          <>
            <Crumb />
            <span>{sectionMeta.parent.label}</span>
          </>
        )}
        {sectionMeta && (
          <>
            <Crumb />
            <Link
              to={returnHref({ ...returnContext, sectionId: sectionMeta.id, tab: "summary" })}
              className="hover:text-navy hover:underline"
            >
              {sectionMeta.label}
            </Link>
          </>
        )}
        {field && (
          <>
            <Crumb />
            <Link
              to={returnHref(returnContext)}
              className="font-medium text-slate-800 hover:text-navy hover:underline"
            >
              {field.formRef}
            </Link>
          </>
        )}
        {currentView !== "Return review" && (
          <>
            <Crumb />
            <span className="font-medium text-slate-800">
              {document?.fileName || currentView}
            </span>
          </>
        )}
      </nav>

      <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto whitespace-nowrap">
        <ContextChip icon={UserRound} label="Return" value={`${ret.clientName} · ${ret.taxYear}`} />
        <ContextChip
          icon={Layers3}
          label="Section"
          value={sectionMeta?.label || "Return overview"}
        />
        <ContextChip
          icon={FileText}
          label="Selected issue"
          value={field?.label || "No field selected"}
          active={Boolean(field)}
        />
        {document && (
          <ContextChip
            icon={FolderOpen}
            label="Document"
            value={document.fileName}
            active
          />
        )}
      </div>
    </div>
  );
}

function Crumb() {
  return <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />;
}

function ContextChip({ icon: Icon, label, value, active }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]",
        active
          ? "border-navy/20 bg-navy/5 text-navy"
          : "border-slate-200 bg-slate-50 text-slate-600"
      )}
      title={`${label}: ${value}`}
    >
      <Icon className="w-2.5 h-2.5" />
      <span className="uppercase tracking-wider text-[8px] opacity-70">{label}</span>
      <strong className="font-medium max-w-[220px] truncate">{value}</strong>
    </span>
  );
}
