import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDocumentById } from "@/data/documents";
import { DocumentPreview } from "@/components/evidence/DocumentPreview";
import { ConfidenceIndicator } from "@/components/status/ConfidenceIndicator";
import { StatusBadge } from "@/components/status/StatusBadge";
import { LockedExplanation } from "@/components/status/LockedExplanation";
import { RecommendationProvenance } from "@/components/evidence/RecommendationProvenance";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  FileText,
  Sigma,
  ArrowRight,
  GitBranch,
  Info,
  Lightbulb,
  MailPlus,
  FileWarning,
  CheckCircle2,
  Sparkles,
  MessageSquareText,
  HelpCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/store/appStore";

/**
 * EvidencePanel — the right-side panel. Displays four tabs:
 *  Summary  — plain-language explanation of what the AI did and why
 *  Source   — source document preview + transformation chain
 *  Reasoning— AI reasoning (concise, user-facing) + confidence
 *  History  — per-field audit trail
 *
 * This panel is the core of Challenge 01 + Challenge 10.
 */
export function EvidencePanel({ field, onSelectField }) {
  const { requestDocument, resolveConflictWith } = useAppState();
  const [activeTab, setActiveTab] = useState("summary");

  if (!field) {
    return (
      <aside className="w-[440px] shrink-0 border-l border-slate-200 bg-white flex flex-col items-center justify-center p-8">
        <Info className="w-8 h-8 text-slate-300 mb-3" strokeWidth={1.5} />
        <p className="text-sm text-slate-500 text-center max-w-[240px]">
          Pick a field on the left and I'll show you where the value came from, how confident I am, and what I'd suggest.
        </p>
      </aside>
    );
  }

  const doc = getDocumentById(field.evidence?.docId);
  const isAggregation = field.evidence?.transformation?.type === "sum-of-multiple-sources";
  const isConflict = field.evidence?.transformation?.type === "conflict";

  return (
    <aside
      data-testid="evidence-panel"
      className="w-[440px] shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden"
    >
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              Evidence & reasoning
            </p>
            <h3 className="font-chivo font-semibold text-slate-900 text-sm truncate">
              {field.label}
            </h3>
            <p className="text-[11px] text-slate-500 font-ibm-mono mt-0.5">{field.formRef}</p>
          </div>
          <StatusBadge status={field.status} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none bg-white border-b border-slate-200 h-10 px-2 gap-0">
          <EvidenceTab value="summary" label="Summary" testId="evidence-tab-summary" />
          <EvidenceTab value="source" label="Source" testId="evidence-tab-source" />
          <EvidenceTab value="reasoning" label="Reasoning" testId="evidence-tab-reasoning" />
          <EvidenceTab value="history" label="History" testId="evidence-tab-history" />
        </TabsList>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* SUMMARY TAB */}
          <TabsContent value="summary" className="p-4 space-y-3 mt-0">
            {field.status === "locked" ? (
              <>
                <LockedExplanation field={field} onSelectComponent={(c) => onSelectField?.(c.id)} />
                <RecommendationProvenance field={field} />
              </>
            ) : field.issue ? (
              <>
                {field.assistantNote && <AssistantNoteCard note={field.assistantNote} />}

                <div className="border border-slate-200 rounded-md p-3 bg-white">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">
                    Issue
                  </p>
                  <p className="text-sm font-medium text-slate-900 mb-1.5">{field.issue.title}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{field.issue.summary}</p>
                </div>

                <ValueComparison field={field} />

                <WhyFlaggedCard whyFlagged={field.issue.whyFlagged} />

                {field.confidence && <ConfidenceIndicator confidence={field.confidence} />}

                <UncertaintyCard items={field.issue.uncertainty} confidenceLevel={field.confidence?.level} />

                <RecommendationProvenance field={field} />

                <div className="border border-navy/15 rounded-md p-3 bg-navy/[0.03]">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-navy shrink-0 mt-0.5" strokeWidth={2.25} />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-navy font-medium mb-1">
                        What I'd suggest
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {field.issue.recommendedAction}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1.5 italic">
                        You're the reviewer — I'll do whatever you decide.
                      </p>
                    </div>
                  </div>
                </div>

                {isConflict && field.evidence?.transformation?.conflictingSources && (
                  <ConflictResolver
                    field={field}
                    onResolve={(chosen) => {
                      resolveConflictWith(field.id, chosen.docId, chosen.label);
                      toast.success("Conflict resolved", {
                        description: `Selected ${chosen.label} as authoritative`,
                      });
                    }}
                  />
                )}

                {field.status === "missing-source" && (
                  <div className="border border-rose-200 rounded-md p-3 bg-rose-50">
                    <div className="flex items-start gap-2">
                      <FileWarning className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" strokeWidth={2.25} />
                      <div className="flex-1">
                        <p className="text-sm text-rose-900 font-medium mb-1">Missing evidence</p>
                        <p className="text-xs text-rose-800/90 leading-relaxed">
                          I wouldn't accept this value without a linked source. I can draft a
                          document request for the client if that helps.
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-rose-300 text-rose-800 hover:bg-rose-100"
                            data-testid="request-document-btn"
                            onClick={() => {
                              requestDocument(field.id);
                              toast.success("Document requested", {
                                description: "Client will be notified.",
                              });
                            }}
                          >
                            <MailPlus className="w-3 h-3 mr-1" /> Request from client
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : field.status === "verified" || field.status === "manually-corrected" ? (
              <div className="space-y-3">
                <div className="border border-emerald-200 rounded-md p-3 bg-emerald-50 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" strokeWidth={2.25} />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">
                      {field.status === "manually-corrected"
                        ? "Manually corrected"
                        : "Verified by reviewer"}
                    </p>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      {field.lastVerifiedBy} · {formatDate(field.lastVerifiedAt, "long")}
                    </p>
                  </div>
                </div>
                <ValueComparison field={field} />
                {field.confidence && <ConfidenceIndicator confidence={field.confidence} />}
                <RecommendationProvenance field={field} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border border-slate-200 rounded-md p-3 bg-slate-50 text-sm text-slate-600">
                  {field.note || "This field is informational and requires no action."}
                </div>
                <ValueComparison field={field} />
                <RecommendationProvenance field={field} />
              </div>
            )}
          </TabsContent>

          {/* SOURCE TAB */}
          <TabsContent value="source" className="p-4 space-y-3 mt-0">
            {isAggregation ? (
              <AggregationBreakdownView field={field} onSelectSource={(docId, regionId) => onSelectField?.(field.id)} />
            ) : doc ? (
              <>
                <div className="border border-slate-200 rounded-md p-3 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                      Source document
                    </span>
                    <span className="text-[10px] text-slate-500 font-ibm-mono">
                      Page {field.evidence.page} · {doc.docType}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{doc.fileName}</p>
                  <p className="text-xs text-slate-600">
                    Extracted:{" "}
                    <span className="font-ibm-mono tabular-nums font-semibold text-slate-900">
                      {typeof field.evidence.sourceValue === "number"
                        ? formatCurrency(field.evidence.sourceValue)
                        : field.evidence.sourceValue}
                    </span>
                  </p>
                </div>
                <DocumentPreview
                  document={doc}
                  highlightRegionId={field.evidence.regionId}
                />
                <TransformationCard transformation={field.evidence.transformation} />
              </>
            ) : field.status === "locked" ? (
              <LockedExplanation field={field} onSelectComponent={(c) => onSelectField?.(c.id)} />
            ) : (
              <div className="border border-dashed border-slate-300 rounded-md p-6 text-center bg-slate-50">
                <FileText className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No source document linked to this field.</p>
              </div>
            )}
          </TabsContent>

          {/* REASONING TAB */}
          <TabsContent value="reasoning" className="p-4 space-y-3 mt-0">
            <div className="border border-sky-200 rounded-md p-3 bg-sky-50">
              <div className="flex items-start gap-2">
                <Search className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" strokeWidth={2.25} />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-sky-800 font-medium mb-1">
                    What I checked
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {field.evidence?.transformation?.summary ||
                      "I didn't process this field — no source-backed recommendation here."}
                  </p>
                </div>
              </div>
            </div>

            {field.issue?.whyFlagged && <WhyFlaggedCard whyFlagged={field.issue.whyFlagged} compact />}

            {field.confidence && <ConfidenceIndicator confidence={field.confidence} />}

            <RecommendationProvenance field={field} />

            <UncertaintyCard
              items={field.issue?.uncertainty}
              confidenceLevel={field.confidence?.level}
              status={field.status}
              fallback
            />
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="p-4 space-y-2 mt-0">
            <FieldHistory field={field} />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}

function EvidenceTab({ value, label, testId }) {
  return (
    <TabsTrigger
      value={value}
      data-testid={testId}
      className={cn(
        "rounded-none border-b-2 border-transparent",
        "data-[state=active]:border-navy data-[state=active]:text-navy data-[state=active]:bg-transparent data-[state=active]:shadow-none",
        "text-slate-500 hover:text-slate-800 text-xs font-medium tracking-wide px-3 h-full"
      )}
    >
      {label}
    </TabsTrigger>
  );
}

/* -------- Trust / explainability primitives (Challenge 10) -------- */

function AssistantNoteCard({ note }) {
  return (
    <div
      className="border border-slate-200 rounded-md bg-white p-3 flex items-start gap-2.5"
      data-testid="assistant-note"
    >
      <div className="w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center shrink-0 mt-0.5">
        <MessageSquareText className="w-3 h-3" strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-0.5">
          Note from your review assistant
        </p>
        <p className="text-sm text-slate-800 leading-relaxed">{note}</p>
      </div>
    </div>
  );
}

function WhyFlaggedCard({ whyFlagged, compact = false }) {
  if (!whyFlagged) return null;
  return (
    <div
      className="border border-slate-200 rounded-md bg-white overflow-hidden"
      data-testid="why-flagged"
    >
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
        <HelpCircle className="w-3.5 h-3.5 text-slate-600" strokeWidth={2.25} />
        <p className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
          {compact ? "Why I flagged this" : "Why I flagged this for you"}
        </p>
      </div>
      <p className="px-3 py-2.5 text-xs text-slate-700 leading-relaxed">{whyFlagged}</p>
    </div>
  );
}

function UncertaintyCard({ items, confidenceLevel, status, fallback = false }) {
  const hasItems = Array.isArray(items) && items.length > 0;

  // If no explicit uncertainty list, only show fallback (Reasoning tab) when it's meaningful
  if (!hasItems && !fallback) return null;
  if (!hasItems && fallback && confidenceLevel === "high" && !status) return null;

  const fallbackText =
    confidenceLevel === "low"
      ? "I'm not confident in this extraction — please look at the source before accepting."
      : status === "conflicting-evidence"
        ? "Two source documents disagree. I deliberately didn't pick one for you."
        : status === "missing-source"
          ? "Part or all of the claimed value has no linked source document."
          : confidenceLevel === "medium"
            ? "I have a general answer, but some inputs weren't fully unambiguous."
            : null;

  if (!hasItems && !fallbackText) return null;

  return (
    <div
      className="border border-amber-200 rounded-md bg-amber-50 overflow-hidden"
      data-testid="uncertainty-card"
    >
      <div className="px-3 py-2 border-b border-amber-200 bg-amber-100/60 flex items-center gap-2">
        <HelpCircle className="w-3.5 h-3.5 text-amber-800" strokeWidth={2.25} />
        <p className="text-[10px] uppercase tracking-wider text-amber-800 font-medium">
          What I'm not sure about
        </p>
      </div>
      {hasItems ? (
        <ul className="px-3 py-2 space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="text-xs text-amber-900 leading-relaxed flex gap-2">
              <span className="text-amber-700 mt-0.5 shrink-0">•</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-3 py-2 text-xs text-amber-900 leading-relaxed">{fallbackText}</p>
      )}
    </div>
  );
}

function ValueComparison({ field }) {
  const showAi = field.aiSuggestedValue !== null && field.aiSuggestedValue !== undefined;
  const hasDiff = showAi && field.difference !== null && field.difference !== 0;
  return (
    <div className="border border-slate-200 rounded-md divide-y divide-slate-200 bg-white">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
          Return value
        </span>
        <span className="font-ibm-mono tabular-nums text-sm font-semibold text-slate-900">
          {typeof field.currentValue === "number" ? formatCurrency(field.currentValue) : field.currentValue}
        </span>
      </div>
      {showAi && (
        <div className="flex items-center justify-between px-3 py-2 bg-sky-50/40">
          <span className="text-[10px] uppercase tracking-wider text-sky-800 font-medium">
            AI suggested
          </span>
          <span className="font-ibm-mono tabular-nums text-sm font-semibold text-sky-900">
            {typeof field.aiSuggestedValue === "number"
              ? formatCurrency(field.aiSuggestedValue)
              : field.aiSuggestedValue}
          </span>
        </div>
      )}
      {hasDiff && (
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            Difference
          </span>
          <span
            className={cn(
              "font-ibm-mono tabular-nums text-sm font-semibold",
              Math.abs(field.difference) > 0 ? "text-amber-700" : "text-slate-700"
            )}
          >
            {formatCurrency(field.difference, { showSign: true })}
          </span>
        </div>
      )}
    </div>
  );
}

function TransformationCard({ transformation }) {
  if (!transformation) return null;
  const typeMap = {
    "direct-mapping": { icon: ArrowRight, label: "Direct mapping" },
    "sum-of-multiple-sources": { icon: Sigma, label: "Sum of multiple sources" },
    "rounded-value": { icon: Sigma, label: "Rounded value" },
    "normalized-formatting": { icon: ArrowRight, label: "Normalized formatting" },
    "manual-override": { icon: ArrowRight, label: "Manual override" },
    conflict: { icon: GitBranch, label: "Conflicting sources" },
    "partial-match": { icon: FileWarning, label: "Partial match" },
  };
  const meta = typeMap[transformation.type] || typeMap["direct-mapping"];
  const Icon = meta.icon;
  return (
    <div className="border border-slate-200 rounded-md">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50">
        <Icon className="w-3.5 h-3.5 text-slate-600" strokeWidth={2.25} />
        <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
          Transformation · {meta.label}
        </span>
      </div>
      <p className="px-3 py-2 text-xs text-slate-700 leading-relaxed">{transformation.summary}</p>
    </div>
  );
}

function AggregationBreakdownView({ field, onSelectSource }) {
  const t = field.evidence.transformation;
  return (
    <div className="space-y-3">
      <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">
          Aggregated total
        </p>
        <p className="font-ibm-mono tabular-nums text-lg font-semibold text-slate-900">
          {formatCurrency(field.evidence.sourceValue)}
        </p>
        <p className="text-xs text-slate-600 mt-1">{t.summary}</p>
      </div>

      <div className="border border-slate-200 rounded-md">
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Sigma className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
            Component sources
          </span>
        </div>
        <div className="divide-y divide-slate-200">
          {t.breakdown.map((b, i) => (
            <div key={i} className="px-3 py-2 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-slate-800 truncate">{b.label}</p>
                <p className="text-[10px] text-slate-500 font-ibm-mono mt-0.5">Source doc: {b.docId}</p>
              </div>
              <span className="font-ibm-mono tabular-nums text-sm font-semibold text-slate-900 shrink-0 ml-3">
                {formatCurrency(b.value)}
              </span>
            </div>
          ))}
          <div className="px-3 py-2 flex items-center justify-between bg-slate-50">
            <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
              Calculated total
            </span>
            <span className="font-ibm-mono tabular-nums text-sm font-bold text-slate-900">
              {formatCurrency(field.evidence.sourceValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Individual doc previews under aggregation */}
      {t.breakdown.map((b, i) => {
        const d = getDocumentById(b.docId);
        if (!d) return null;
        return (
          <div key={`prev-${i}`}>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
              {b.label}
            </p>
            <DocumentPreview document={d} highlightRegionId={b.regionId} />
          </div>
        );
      })}
    </div>
  );
}

function ConflictResolver({ field, onResolve }) {
  const sources = field.evidence.transformation.conflictingSources || [];
  return (
    <div className="border border-orange-200 rounded-md bg-orange-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="w-4 h-4 text-orange-700" strokeWidth={2.25} />
        <p className="text-sm font-medium text-orange-900">Choose authoritative source</p>
      </div>
      <div className="space-y-2">
        {sources.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-white border border-orange-200 rounded px-2.5 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{s.label}</p>
              <p className="text-[10px] text-slate-500 font-ibm-mono">
                Uploaded {s.uploadedAt} · Value {s.value}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs shrink-0 ml-2"
              data-testid={`resolve-conflict-${s.docId}`}
              onClick={() => onResolve(s)}
            >
              Use this
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldHistory({ field }) {
  // Combine correction history + initial AI events + verification events
  const events = [];

  if (field.correctionHistory?.length) {
    field.correctionHistory.forEach((c) => {
      const map = {
        "accept-ai": { label: "Accepted AI suggestion", icon: CheckCircle2, color: "emerald" },
        "keep-current": { label: "Rejected AI suggestion (kept current)", icon: FileWarning, color: "slate" },
        "manual-correction": { label: "Manual correction", icon: FileText, color: "indigo" },
        "resolve-conflict": { label: "Resolved conflict", icon: GitBranch, color: "orange" },
      };
      const m = map[c.action] || map["manual-correction"];
      const Icon = m.icon;
      events.push({
        icon: <Icon className={`w-3.5 h-3.5 text-${m.color}-700`} />,
        actor: c.actor,
        title: m.label,
        timestamp: c.timestamp,
        detail:
          c.reason +
          (c.action === "manual-correction"
            ? ` · Prior ${
                typeof c.priorValue === "number" ? formatCurrency(c.priorValue) : c.priorValue
              } → New ${typeof c.newValue === "number" ? formatCurrency(c.newValue) : c.newValue}`
            : ""),
      });
    });
  }

  if (field.evidence?.transformation) {
    events.push({
      icon: <Sparkles className="w-3.5 h-3.5 text-sky-700" />,
      actor: "TraceTax AI",
      title: "AI extracted value",
      timestamp: "2026-01-09T14:03:00Z",
      detail: field.evidence.transformation.summary,
    });
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-slate-500">No history recorded for this field yet.</p>
      </div>
    );
  }

  // newest first
  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-2">
      {events.map((e, i) => (
        <div
          key={i}
          className="border border-slate-200 rounded-md p-2.5 bg-white"
          data-testid="field-history-event"
        >
          <div className="flex items-start gap-2">
            <div className="mt-0.5 shrink-0">{e.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-900">{e.title}</p>
                <span className="text-[10px] text-slate-500 font-ibm-mono shrink-0">
                  {formatDate(e.timestamp, "relative")}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">by {e.actor}</p>
              {e.detail && (
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{e.detail}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
