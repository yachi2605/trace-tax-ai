import React from "react";
import { useAppState } from "@/store/appStore";
import * as Icons from "lucide-react";
import { formatDate } from "@/utils/format";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { WorkflowContextBar } from "@/components/navigation/WorkflowContextBar";
import {
  activityHref,
  documentsHref,
  getSectionMeta,
  returnHref,
} from "@/utils/workflowContext";

/**
 * ActivityPage — a deep-linkable audit trail that retains the selected field
 * and routes each event back to the object it describes.
 */
export function ActivityPage() {
  const {
    state: { activity, fields, returns, queueFilter, queueSearch },
  } = useAppState();
  const [searchParams] = useSearchParams();
  const returnId = searchParams.get("returnId") || "ret-2025-001";
  const ret = returns.find((candidate) => candidate.id === returnId);
  const selectedEvent = activity.find((event) => event.id === searchParams.get("event")) || null;
  const field =
    fields[searchParams.get("field")] ||
    fields[selectedEvent?.fieldId] ||
    null;
  const sectionId =
    field?.section ||
    searchParams.get("section") ||
    selectedEvent?.sectionId ||
    "wages";
  const sectionMeta = getSectionMeta(sectionId);
  const queueContext = {
    queueFilter: searchParams.get("queueFilter") || queueFilter,
    queueSearch: searchParams.get("queueSearch") || queueSearch,
  };
  const context = {
    returnId,
    sectionId,
    fieldId: field?.id,
    eventId: selectedEvent?.id,
    ...queueContext,
  };

  if (!ret?.workspaceAvailable) {
    return <Navigate to="/" replace />;
  }

  const relatedDocumentIds = new Set([
    field?.evidence?.docId,
    ...(field?.supportingDocuments || []).map((item) => item.docId),
    ...(field?.evidence?.transformation?.breakdown || []).map((item) => item.docId),
    ...(field?.evidence?.transformation?.conflictingSources || []).map((item) => item.docId),
  ].filter(Boolean));
  const visibleActivity = field
    ? activity.filter(
        (event) =>
          event.fieldId === field.id ||
          (event.docId && relatedDocumentIds.has(event.docId))
      )
    : activity;

  const backHref = returnHref({
    ...context,
    tab: field ? "history" : "summary",
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      <WorkflowContextBar
        ret={ret}
        field={field}
        sectionMeta={sectionMeta}
        currentView="Activity"
        context={context}
      />
      <main className="flex-1 overflow-y-auto scrollbar-thin bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="mb-5">
            <Link
              to={backHref}
              className="inline-flex items-center gap-1 text-xs text-navy hover:underline mb-2"
              data-testid="activity-back-to-field"
            >
              <Icons.ArrowLeft className="w-3 h-3" />
              {field
                ? `Back to ${sectionMeta?.label || "return"} review`
                : `Back to ${ret.clientName}`}
            </Link>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">
              Activity
            </p>
            <h1 className="font-chivo font-semibold text-slate-900 text-xl mt-0.5">
              Audit trail
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {field
                ? `Events related to ${field.formRef} · ${field.label}.`
                : `Every AI action and human decision on ${ret.clientName}'s ${ret.taxYear} return.`}
            </p>
            {field && (
              <div className="mt-3 flex items-center justify-between gap-3 border border-navy/15 bg-navy/[0.03] rounded-md px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <Icons.Filter className="w-3.5 h-3.5 text-navy" />
                  Showing {visibleActivity.length} events connected to the selected field or its documents.
                </div>
                <Link
                  to={activityHref({
                    returnId,
                    sectionId,
                    ...queueContext,
                  })}
                  className="text-xs text-navy hover:underline shrink-0"
                >
                  Show full return trail
                </Link>
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
            {visibleActivity.length === 0 ? (
              <div className="py-14 flex flex-col items-center text-center px-6">
                <Icons.Inbox className="w-8 h-8 text-slate-300 mb-2" strokeWidth={1.5} />
                <p className="text-sm font-medium text-slate-800 mb-1">No related events yet</p>
                <p className="text-xs text-slate-500 max-w-[300px] leading-relaxed">
                  Decisions and source-document activity for this field will appear here.
                </p>
              </div>
            ) : (
              <ol className="divide-y divide-slate-200">
                {visibleActivity.map((event) => (
                  <ActivityRow
                    key={event.id}
                    event={event}
                    field={fields[event.fieldId]}
                    isSelected={selectedEvent?.id === event.id}
                    context={{
                      ...context,
                      sectionId: fields[event.fieldId]?.section || sectionId,
                      fieldId: event.fieldId || field?.id,
                    }}
                  />
                ))}
              </ol>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ActivityRow({ event, field, isSelected, context }) {
  const Icon = Icons[event.icon] || Icons.Circle;
  const actorColor = {
    CPA: "bg-navy text-white",
    AI: "bg-sky-100 text-sky-800",
    Client: "bg-slate-200 text-slate-700",
  }[event.actorRole] || "bg-slate-200 text-slate-700";

  const destination = field
    ? returnHref({
        ...context,
        sectionId: field.section,
        fieldId: field.id,
        tab: "history",
        eventId: event.id,
      })
    : event.docId
      ? documentsHref({
          ...context,
          documentId: event.docId,
          eventId: event.id,
        })
      : returnHref({ ...context, tab: "summary", eventId: event.id });

  return (
    <li
      className={cn(
        "border-l-2",
        isSelected ? "bg-sky-50 border-l-sky-600" : "border-l-transparent"
      )}
      data-testid={`activity-event-${event.id}`}
      aria-current={isSelected ? "true" : undefined}
    >
      <Link
        to={destination}
        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
        data-testid={`activity-open-${event.id}`}
        aria-label={`Open related object for ${event.action} ${event.subject}`}
      >
        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-slate-600" strokeWidth={2.25} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
                  actorColor
                )}
              >
                {event.actorRole}
              </span>
              <span className="text-sm font-medium text-slate-900 truncate">
                {event.actor}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-ibm-mono tabular-nums shrink-0">
              {formatDate(event.timestamp, "long")}
            </span>
          </div>
          <p className="text-sm text-slate-700 mt-1 leading-relaxed">
            <span className="text-slate-500">{event.action}</span>{" "}
            <span className="font-medium text-navy">{event.subject}</span>
          </p>
          {event.detail && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{event.detail}</p>
          )}
          <p className="text-[10px] text-slate-400 mt-1">
            Opens {field ? `${field.formRef} in field history` : event.docId ? "the related source document" : "the return status"}
          </p>
        </div>
      </Link>
    </li>
  );
}
