import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ChevronRight,
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAppState, computeReviewProgress, unresolvedCount } from "@/store/appStore";
import { SectionNav } from "@/components/review/SectionNav";
import { TaxFieldRow } from "@/components/review/TaxFieldRow";
import { EvidencePanel } from "@/components/evidence/EvidencePanel";
import { RETURNS } from "@/data/returns";
import { SECTIONS } from "@/data/reviewIssues";
import { formatDate } from "@/utils/format";

/**
 * ReturnWorkspacePage — three-panel workspace: SectionNav | Fields | Evidence
 */
export function ReturnWorkspacePage() {
  const { returnId } = useParams();
  const navigate = useNavigate();
  const {
    state: { fields, activeSectionId, selectedFieldId },
    selectField,
    setSection,
  } = useAppState();

  const ret = RETURNS.find((r) => r.id === returnId) || RETURNS[0];

  const fieldsList = Object.values(fields);
  const progress = computeReviewProgress(fields);
  const unresolved = unresolvedCount(fields);

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
  const selectedField = selectedFieldId
    ? fields[selectedFieldId]
    : sectionFields[0] || null;

  // Ensure we always have a selection
  useEffect(() => {
    if (!selectedFieldId && sectionFields.length > 0) {
      selectField(sectionFields[0].id);
    }
  }, [selectedFieldId, sectionFields, selectField]);

  const handleSectionChange = (sectionId) => {
    setSection(sectionId);
    // pick first field of the new section
    const isParent = SECTIONS.some((s) => s.id === sectionId && s.children?.length);
    const list = isParent
      ? fieldsList.filter((f) => f.parentSection === sectionId)
      : fieldsList.filter((f) => f.section === sectionId);
    if (list.length > 0) {
      selectField(list[0].id);
    } else {
      selectField(null);
    }
  };

  const sectionMeta = useMemo(() => {
    const flat = [];
    SECTIONS.forEach((s) => {
      flat.push({ ...s, path: [s.label] });
      s.children?.forEach((c) => flat.push({ ...c, parent: s, path: [s.label, c.label] }));
    });
    return flat.find((s) => s.id === activeSectionId) || flat[0];
  }, [activeSectionId]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Return header */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-slate-500 -ml-2"
              data-testid="back-to-queue-btn"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-3 h-3 mr-1" /> Queue
            </Button>
            <div className="text-[11px] text-slate-400 hidden md:flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              <Link to="/" className="hover:text-slate-700">Review Queue</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-700">{ret.clientName}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-700">{sectionMeta.path.join(" / ")}</span>
            </div>
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
            <SectionHeader sectionMeta={sectionMeta} count={sectionFields.length} />

            {sectionFields.length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-md py-12 text-center bg-white mt-4">
                <p className="text-sm text-slate-500">
                  No fields defined for this section yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {sectionFields.map((f) => (
                  <TaxFieldRow
                    key={f.id}
                    field={f}
                    isSelected={selectedFieldId === f.id}
                    onSelect={(id) => selectField(id)}
                  />
                ))}
              </div>
            )}

            {/* Completed callout for sections with no open issues */}
            {sectionFields.length > 0 && sectionFields.every((f) =>
              ["verified", "read-only", "locked", "manually-corrected"].includes(f.status)
            ) && (
              <div
                className="mt-4 border border-emerald-200 bg-emerald-50 rounded-md p-3 flex items-center gap-2"
                data-testid="section-completed-callout"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-700" strokeWidth={2.25} />
                <p className="text-xs text-emerald-900">
                  All fields in this section are resolved.
                </p>
              </div>
            )}
          </div>
        </main>

        <EvidencePanel field={selectedField} onSelectField={(id) => selectField(id)} />
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
