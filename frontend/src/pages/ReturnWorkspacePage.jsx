import React, { useEffect, useMemo } from "react";
import { useNavigate, useParams, Navigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAppState, computeReviewProgress, unresolvedCount } from "@/store/appStore";
import { SectionNav } from "@/components/review/SectionNav";
import { TaxFieldRow } from "@/components/review/TaxFieldRow";
import { EvidencePanel } from "@/components/evidence/EvidencePanel";
import { WorkflowContextBar } from "@/components/navigation/WorkflowContextBar";
import { ReturnStatusSummary } from "@/components/status/ReturnStatusSummary";
import { SECTIONS } from "@/data/reviewIssues";
import { deriveJordanWorkflow } from "@/data/workflow";
import { formatDate } from "@/utils/format";
import {
  EVIDENCE_TABS,
  activityHref,
  documentsHref,
  getSectionMeta,
  queueHref,
} from "@/utils/workflowContext";

const REVIEW_SECTION_IDS = new Set(
  SECTIONS.flatMap((section) => [
    section.id,
    ...(section.children || []).map((child) => child.id),
  ]).filter((id) => id !== "documents" && id !== "activity")
);

/**
 * ReturnWorkspacePage — three-panel workspace: SectionNav | Fields | Evidence
 */
export function ReturnWorkspacePage() {
  const { returnId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    state: {
      fields,
      returns,
      queueFilter,
      queueSearch,
      activeSectionId: storedSectionId,
      selectedFieldId: storedFieldId,
      activity,
    },
    selectField,
    setSection,
  } = useAppState();

  const ret = returns.find((r) => r.id === returnId) || null;

  const fieldsList = useMemo(() => Object.values(fields), [fields]);
  const progress = computeReviewProgress(fields);
  const unresolved = unresolvedCount(fields);
  const requestedField = fields[searchParams.get("field")] || null;
  const requestedSection = REVIEW_SECTION_IDS.has(searchParams.get("section"))
    ? searchParams.get("section")
    : null;
  const activeSectionId = requestedField?.section || requestedSection || "wages";
  const requestedTab = searchParams.get("tab");
  const activeEvidenceTab = EVIDENCE_TABS.has(requestedTab) ? requestedTab : "summary";
  const workflow = ret ? deriveJordanWorkflow(ret, fields) : null;
  const queueContext = {
    queueFilter: searchParams.get("queueFilter") || queueFilter,
    queueSearch: searchParams.get("queueSearch") || queueSearch,
  };

  // Compute fields to display for the active section (child or parent)
  const sectionFields = useMemo(() => {
    // If activeSectionId is a parent (e.g., "income"), we want all fields in it
    const isParent = SECTIONS.some(
      (s) => s.id === activeSectionId && s.children?.length
    );
    if (isParent) {
      return fieldsList.filter((f) => f.parentSection === activeSectionId);
    }
    return fieldsList.filter((f) => f.section === activeSectionId);
  }, [activeSectionId, fieldsList]);

  // Selected field (for evidence panel)
  const selectedField =
    requestedField &&
    (requestedField.section === activeSectionId ||
      requestedField.parentSection === activeSectionId)
      ? requestedField
      : sectionFields[0] || null;

  // The URL is authoritative so direct links and refreshes restore the same field and tab.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;
    if (next.get("section") !== activeSectionId) {
      next.set("section", activeSectionId);
      changed = true;
    }
    if (selectedField && next.get("field") !== selectedField.id) {
      next.set("field", selectedField.id);
      changed = true;
    } else if (!selectedField && next.has("field")) {
      next.delete("field");
      changed = true;
    }
    if (next.get("tab") !== activeEvidenceTab) {
      next.set("tab", activeEvidenceTab);
      changed = true;
    }
    if (storedSectionId !== activeSectionId) setSection(activeSectionId);
    if (storedFieldId !== (selectedField?.id || null)) {
      selectField(selectedField?.id || null);
    }
    if (changed) setSearchParams(next, { replace: true });
  }, [
    activeEvidenceTab,
    activeSectionId,
    searchParams,
    selectField,
    selectedField,
    setSearchParams,
    setSection,
    storedFieldId,
    storedSectionId,
  ]);

  const updateReviewContext = ({ sectionId, fieldId, tab }) => {
    const next = new URLSearchParams(searchParams);
    if (sectionId) next.set("section", sectionId);
    if (fieldId) next.set("field", fieldId);
    else next.delete("field");
    next.set("tab", tab || "summary");
    setSearchParams(next);
  };

  const handleSectionChange = (sectionId) => {
    const context = {
      returnId,
      sectionId: selectedField?.section || activeSectionId,
      fieldId: selectedField?.id,
      tab: activeEvidenceTab,
      documentId: selectedField?.evidence?.docId,
      regionId: selectedField?.evidence?.regionId,
      ...queueContext,
    };
    if (sectionId === "documents") {
      navigate(documentsHref(context));
      return;
    }
    if (sectionId === "activity") {
      navigate(activityHref(context));
      return;
    }
    const isParent = SECTIONS.some((s) => s.id === sectionId && s.children?.length);
    const list = isParent
      ? fieldsList.filter((f) => f.parentSection === sectionId)
      : fieldsList.filter((f) => f.section === sectionId);
    updateReviewContext({
      sectionId,
      fieldId: list[0]?.id || null,
      tab: "summary",
    });
  };

  const sectionMeta = getSectionMeta(activeSectionId) || getSectionMeta("wages");

  if (!ret?.workspaceAvailable) {
    return <Navigate to={queueHref(queueContext)} replace />;
  }

  const workflowContext = {
    returnId,
    sectionId: activeSectionId,
    fieldId: selectedField?.id,
    tab: activeEvidenceTab,
    ...queueContext,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      <WorkflowContextBar
        ret={ret}
        field={selectedField}
        sectionMeta={sectionMeta}
        context={workflowContext}
      />
      {/* Return header */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-slate-500 -ml-2"
              data-testid="back-to-queue-btn"
              onClick={() => navigate(queueHref(queueContext))}
            >
              <ArrowLeft className="w-3 h-3 mr-1" /> Back to queue
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {ret.clientInitials}
            </div>
            <div className="min-w-0">
              <h1 className="font-chivo font-semibold text-slate-900 text-base leading-tight truncate">
                {ret.clientName}
              </h1>
              <p className="text-[11px] text-slate-500 font-ibm-mono mt-0.5">
                {ret.taxYear} {ret.returnType} · {ret.filingType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <StatChip label="Stage" value={ret.stage} tone="navy" />
            <StatChip
              label="Progress"
              value={
                <span className="flex items-center gap-2">
                  <Progress value={progress} className="h-1.5 w-16 bg-slate-200" />
                  <span className="font-ibm-mono font-semibold tabular-nums">{progress}%</span>
                </span>
              }
            />
            <StatChip
              label="Open issues"
              value={
                <span className="font-ibm-mono font-semibold tabular-nums flex items-center gap-1">
                  {unresolved > 0 ? (
                    <AlertTriangle className="w-3 h-3 text-amber-600" strokeWidth={2.25} />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" strokeWidth={2.25} />
                  )}
                  {unresolved}
                </span>
              }
            />
            <StatChip
              label="Reviewer"
              value={
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  {ret.assignedTo}
                </span>
              }
            />
            <StatChip
              label="Deadline"
              value={
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formatDate(ret.deadline)}
                </span>
              }
            />
          </div>
        </div>
      </div>

      {/* Workspace body */}
      <div className="flex-1 flex overflow-hidden">
        <SectionNav
          fields={fields}
          activeSectionId={activeSectionId}
          onSelectSection={handleSectionChange}
        />

        {/* Center panel */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-5 min-w-0">
          <div className="max-w-3xl">
            {searchParams.get("event") && (
              <div
                className="mb-4 flex items-center justify-between gap-3 border border-sky-200 bg-sky-50 rounded-md px-3 py-2 text-xs text-sky-900"
                data-testid="activity-return-context"
              >
                <span>
                  Opened from activity event{" "}
                  <span className="font-ibm-mono">{searchParams.get("event")}</span>. The
                  related field is selected.
                </span>
                <button
                  type="button"
                  className="text-navy hover:underline shrink-0"
                  onClick={() => navigate(activityHref({
                    ...workflowContext,
                    eventId: searchParams.get("event"),
                  }))}
                >
                  Back to event
                </button>
              </div>
            )}
            <ReturnStatusSummary
              ret={ret}
              workflow={workflow}
              onOpenBlocker={(blocker) =>
                updateReviewContext({
                  sectionId: blocker.sectionId,
                  fieldId: blocker.fieldId,
                  tab: "summary",
                })
              }
            />
            <SectionHeader sectionMeta={sectionMeta} count={sectionFields.length} />

            {sectionFields.length === 0 ? (
              <EmptySectionState sectionLabel={sectionMeta.label} />
            ) : (
              <div className="space-y-2 mt-4" role="list" aria-label={`${sectionMeta.label} fields`}>
                {sectionFields.map((f) => (
                  <TaxFieldRow
                    key={f.id}
                    field={f}
                    isSelected={selectedField?.id === f.id}
                    onSelect={(id) => {
                      updateReviewContext({
                        sectionId: fields[id]?.section,
                        fieldId: id,
                        tab: "summary",
                      });
                    }}
                    onViewSource={(id) => {
                      updateReviewContext({
                        sectionId: fields[id]?.section,
                        fieldId: id,
                        tab: "source",
                      });
                    }}
                  />
                ))}
              </div>
            )}

            {/* Completed callout for sections with no open issues */}
            {sectionFields.length > 0 && sectionFields.every((f) =>
              ["verified", "read-only", "locked", "manually-corrected"].includes(f.status)
            ) && (
              <div
                className="mt-4 border border-emerald-200 bg-emerald-50 rounded-md p-3 flex items-start gap-2"
                data-testid="section-completed-callout"
                role="status"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" strokeWidth={2.25} />
                <div>
                  <p className="text-sm text-emerald-900 font-medium">
                    This section is fully reviewed
                  </p>
                  <p className="text-xs text-emerald-800/90 mt-0.5">
                    Every field is verified, locked, or has a recorded decision. Nice work.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <EvidencePanel
          field={selectedField}
          onSelectField={(id) => {
            updateReviewContext({
              sectionId: fields[id]?.section,
              fieldId: id,
              tab: "summary",
            });
          }}
          activeTab={activeEvidenceTab}
          onTabChange={(tab) =>
            updateReviewContext({
              sectionId: activeSectionId,
              fieldId: selectedField?.id,
              tab,
            })
          }
          context={workflowContext}
          activity={activity}
        />
      </div>
    </div>
  );
}

function StatChip({ label, value, tone }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-medium">
        {label}
      </span>
      <span
        className={cn(
          "text-xs mt-0.5 text-slate-900 font-medium",
          tone === "navy" && "text-navy"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SectionHeader({ sectionMeta, count }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
          {sectionMeta.parent ? sectionMeta.parent.label : "Section"}
        </p>
        <h2 className="font-chivo font-semibold text-slate-900 text-lg leading-tight mt-0.5">
          {sectionMeta.label}
        </h2>
      </div>
      <span className="text-[11px] text-slate-500 font-ibm-mono">
        {count} field{count === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function EmptySectionState({ sectionLabel }) {
  return (
    <div className="border border-dashed border-slate-300 rounded-md py-14 text-center bg-white mt-4 px-6">
      <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
      <p className="text-sm font-medium text-slate-800 mb-1">
        {sectionLabel} — nothing to review here
      </p>
      <p className="text-xs text-slate-500 max-w-[340px] mx-auto leading-relaxed">
        This section has no reportable activity for this return, so we haven't added any fields.
      </p>
    </div>
  );
}
