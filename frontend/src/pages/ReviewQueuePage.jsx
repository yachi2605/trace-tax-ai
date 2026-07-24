import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Calendar, User, ArrowRight, AlertTriangle, CheckCircle2, Clock, Inbox, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FILTERS } from "@/data/returns";
import { useAppState } from "@/store/appStore";
import { formatDate } from "@/utils/format";
import { returnHref } from "@/utils/workflowContext";

const stageMeta = {
  "CPA Review": { color: "text-navy bg-slate-100 border-slate-200", icon: null },
  "Ready for Review": { color: "text-sky-800 bg-sky-50 border-sky-200", icon: null },
  "Preparation in Progress": { color: "text-sky-800 bg-sky-50 border-sky-200", icon: Clock },
  "Documents Requested": { color: "text-amber-800 bg-amber-50 border-amber-200", icon: Clock },
  "Waiting on Client": { color: "text-amber-800 bg-amber-50 border-amber-200", icon: Clock },
  "Ready to File": { color: "text-emerald-800 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  "Filed": { color: "text-emerald-800 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  "Completed": { color: "text-emerald-800 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
};

const severityMeta = {
  high: { label: "High priority", classes: "bg-red-100 text-red-800 border-red-200" },
  medium: { label: "Medium", classes: "bg-amber-100 text-amber-800 border-amber-200" },
  low: { label: "Low", classes: "bg-slate-100 text-slate-700 border-slate-200" },
  none: { label: "Clear", classes: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export function ReviewQueuePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    state: { returns, queueFilter: storedFilter, queueSearch: storedSearch },
    setQueueFilter: setFilter,
    setQueueSearch: setSearch,
  } = useAppState();
  const requestedFilter = searchParams.get("filter");
  const filter = FILTERS.some((item) => item.id === requestedFilter)
    ? requestedFilter
    : storedFilter;
  const search = searchParams.has("search")
    ? searchParams.get("search")
    : storedSearch;

  const updateQueueContext = ({ nextFilter = filter, nextSearch = search }) => {
    const next = new URLSearchParams(searchParams);
    if (nextFilter && nextFilter !== "all") next.set("filter", nextFilter);
    else next.delete("filter");
    if (nextSearch) next.set("search", nextSearch);
    else next.delete("search");
    setFilter(nextFilter || "all");
    setSearch(nextSearch || "");
    setSearchParams(next, { replace: true });
  };

  const filteredReturns = useMemo(() => {
    let list = returns;
    if (filter !== "all") {
      list = list.filter(
        (r) => r.filter === filter || (r.filterAlsoIn || []).includes(filter)
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.clientName.toLowerCase().includes(q));
    }
    return list;
  }, [filter, search, returns]);

  const filterCounts = useMemo(() => {
    const counts = { all: returns.length };
    FILTERS.forEach((f) => {
      if (f.id === "all") return;
      counts[f.id] = returns.filter(
        (r) => r.filter === f.id || (r.filterAlsoIn || []).includes(f.id)
      ).length;
    });
    return counts;
  }, [returns]);

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">
              Filing season · 2025
            </p>
            <h1 className="font-chivo font-semibold text-slate-900 text-xl mt-0.5">
              Review queue
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Open individual federal returns awaiting your review.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                data-testid="queue-search-input"
                value={search}
                onChange={(e) => updateQueueContext({ nextSearch: e.target.value })}
                placeholder="Search by client name…"
                className="pl-8 h-9 w-64 text-sm"
                aria-label="Search returns by client name"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="border-b border-slate-200 bg-white px-6">
        <div className="max-w-[1400px] mx-auto flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => updateQueueContext({ nextFilter: f.id })}
                data-testid={`filter-${f.id}`}
                className={cn(
                  "px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
                  active
                    ? "border-navy text-navy"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "text-[10px] font-ibm-mono px-1.5 py-0.5 rounded",
                    active ? "bg-navy/10 text-navy" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {filterCounts[f.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
        <div className="max-w-[1400px] mx-auto">
          {filteredReturns.length === 0 ? (
            <EmptyState
              search={search}
              filter={filter}
              onClear={() => updateQueueContext({ nextSearch: "", nextFilter: "all" })}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                <div className="col-span-3">Client</div>
                <div className="col-span-2">Stage</div>
                <div className="col-span-2">Issues</div>
                <div className="col-span-2">Progress</div>
                <div className="col-span-2">Deadline</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              <ul className="divide-y divide-slate-200">
                {filteredReturns.map((r) => (
                  <li key={r.id}>
                    <ReturnRow
                      ret={r}
                      onOpen={
                        r.workspaceAvailable
                          ? () =>
                              navigate(
                                returnHref({
                                  returnId: r.id,
                                  sectionId: "wages",
                                  fieldId: "field-wages-1a",
                                  tab: "summary",
                                  queueFilter: filter,
                                  queueSearch: search,
                                })
                              )
                          : null
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ReturnRow({ ret, onOpen }) {
  const sm = stageMeta[ret.stage] || stageMeta["CPA Review"];
  const StageIcon = sm.icon;
  const sev = severityMeta[ret.highestSeverity] || severityMeta.none;

  return (
    <div
      data-testid={`return-row-${ret.id}`}
      className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-3 items-center transition-colors"
      aria-disabled={!onOpen}
    >
      {/* Client */}
      <div className="md:col-span-3 flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
          {ret.clientInitials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{ret.clientName}</p>
          <p className="text-[11px] text-slate-500 font-ibm-mono truncate">
            {ret.filingType} · TY {ret.taxYear}
          </p>
        </div>
      </div>

      {/* Stage */}
      <div className="md:col-span-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 border rounded text-[11px] font-medium",
            sm.color
          )}
        >
          {StageIcon && <StageIcon className="w-3 h-3" strokeWidth={2.25} />}
          {ret.stage}
        </span>
        {ret.stageContext && (
          <p className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">
            {ret.stageContext}
          </p>
        )}
      </div>

      {/* Issues */}
      <div className="md:col-span-2 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px] font-medium",
            sev.classes
          )}
          data-testid={`return-severity-${ret.id}`}
        >
          {ret.highestSeverity !== "none" && <AlertTriangle className="w-2.5 h-2.5" strokeWidth={2.25} />}
          {sev.label}
        </span>
        <span className="text-[11px] font-ibm-mono tabular-nums text-slate-600">
          {ret.unresolvedIssues} open
        </span>
        {ret.blockers?.[0] && (
          <span className="sr-only">Blocker: {ret.blockers[0].detail}</span>
        )}
      </div>

      {/* Progress */}
      <div className="md:col-span-2 flex items-center gap-2">
        <Progress value={ret.reviewProgress} className="h-1.5 w-24 bg-slate-200" />
        <span className="text-[11px] font-ibm-mono tabular-nums text-slate-700 font-medium">
          {ret.reviewProgress}%
        </span>
      </div>

      {/* Deadline */}
      <div className="md:col-span-2 text-[11px] text-slate-600 font-ibm-mono">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          {formatDate(ret.deadline)}
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-slate-500">
          <User className="w-3 h-3 text-slate-400" />
          {ret.assignedTo}
        </div>
        {ret.actionOwner && (
          <div className="mt-0.5 text-[10px] text-slate-500 truncate" title={ret.nextAction}>
            Next owner: {ret.actionOwner}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="md:col-span-1 flex justify-end">
        <Button
          size="sm"
          className="h-7 text-xs bg-navy hover:bg-navy-700 text-white"
          data-testid={`review-return-btn-${ret.id}`}
          disabled={!onOpen}
          title={!onOpen ? "Field-level review is available for Jordan Lee only." : undefined}
          onClick={(e) => {
            e.stopPropagation();
            onOpen?.();
          }}
        >
          Review
          {onOpen && <ArrowRight className="w-3 h-3 ml-1" />}
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ search, filter, onClear }) {
  return (
    <div
      data-testid="queue-empty-state"
      className="border border-dashed border-slate-300 rounded-md py-16 flex flex-col items-center justify-center bg-white"
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Inbox className="w-6 h-6 text-slate-400" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-slate-800 mb-1">
        {search ? "No matching returns" : "Nothing in this view yet"}
      </p>
      <p className="text-xs text-slate-500 max-w-[340px] text-center leading-relaxed">
        {search
          ? `No client matches "${search}". Try a different spelling, or clear the search to see all returns.`
          : `Returns that fall into "${FILTERS.find((f) => f.id === filter)?.label}" will appear here as they progress through review.`}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4 h-8 text-xs"
        onClick={onClear}
        data-testid="queue-empty-clear"
      >
        <Filter className="w-3 h-3 mr-1.5" strokeWidth={2.25} />
        {search ? "Clear search" : "Show all returns"}
      </Button>
    </div>
  );
}
