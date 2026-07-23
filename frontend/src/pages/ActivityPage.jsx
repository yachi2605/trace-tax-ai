import React from "react";
import { useAppState } from "@/store/appStore";
import * as Icons from "lucide-react";
import { formatDate } from "@/utils/format";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * ActivityPage — global audit trail for the active return session.
 */
export function ActivityPage() {
  const {
    state: { activity, fields },
  } = useAppState();

  return (
    <main className="flex-1 overflow-y-auto scrollbar-thin bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">
            Activity
          </p>
          <h1 className="font-chivo font-semibold text-slate-900 text-xl mt-0.5">
            Audit trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Every AI action and human decision on Jordan Lee's 2025 return.
          </p>
        </div>

        <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
          <ol className="divide-y divide-slate-200">
            {activity.map((evt) => (
              <ActivityRow key={evt.id} event={evt} field={fields[evt.fieldId]} />
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
}

function ActivityRow({ event, field }) {
  const Icon = Icons[event.icon] || Icons.Circle;

  const actorColor = {
    CPA: "bg-navy text-white",
    AI: "bg-sky-100 text-sky-800",
    Client: "bg-slate-200 text-slate-700",
  }[event.actorRole] || "bg-slate-200 text-slate-700";

  return (
    <li
      className="flex items-start gap-3 px-4 py-3"
      data-testid={`activity-event-${event.id}`}
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
          {field ? (
            <Link
              to={`/returns/ret-2025-001`}
              className="font-medium text-navy hover:underline"
            >
              {event.subject}
            </Link>
          ) : (
            <span className="font-medium text-slate-800">{event.subject}</span>
          )}
        </p>
        {event.detail && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{event.detail}</p>
        )}
      </div>
    </li>
  );
}
