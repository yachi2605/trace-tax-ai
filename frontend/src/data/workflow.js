export const RETURN_LIFECYCLE = [
  { id: "documents-requested", label: "Documents requested" },
  { id: "documents-received", label: "Documents received" },
  { id: "ai-extraction-complete", label: "AI extraction complete" },
  { id: "preparation-in-progress", label: "Preparation in progress" },
  { id: "cpa-review", label: "CPA review" },
  { id: "waiting-on-client", label: "Waiting on client" },
  { id: "ready-to-file", label: "Ready to file" },
  { id: "filed", label: "Filed" },
];

const UNRESOLVED_STATUSES = new Set([
  "needs-review",
  "missing-source",
  "conflicting-evidence",
]);

const RESOLVED_STATUSES = new Set([
  "verified",
  "manually-corrected",
  "locked",
]);

const severityRank = { high: 3, medium: 2, low: 1, none: 0 };

export function deriveReviewMetrics(fieldsById) {
  const fields = Object.values(fieldsById);
  const reviewable = fields.filter((field) => field.status !== "read-only");
  const unresolvedFields = fields.filter((field) => UNRESOLVED_STATUSES.has(field.status));
  const resolved = reviewable.filter((field) => RESOLVED_STATUSES.has(field.status)).length;
  const progress =
    reviewable.length === 0 ? 100 : Math.round((resolved / reviewable.length) * 100);
  const highestSeverity = unresolvedFields.reduce(
    (highest, field) =>
      (severityRank[field.severity] || 0) > (severityRank[highest] || 0)
        ? field.severity
        : highest,
    "none"
  );

  return {
    totalReviewable: reviewable.length,
    resolved,
    progress,
    unresolvedFields,
    unresolvedCount: unresolvedFields.length,
    highestSeverity,
  };
}

function blockerFor(field, ret) {
  if (field.status === "missing-source") {
    const requested = field.documentRequest?.status === "waiting-on-client";
    return {
      id: field.id,
      fieldId: field.id,
      sectionId: field.section,
      kind: requested ? "waiting-on-client" : "missing-document",
      label: field.label,
      detail: requested
        ? `Waiting for ${ret.clientName} to provide the unsupported contribution receipt.`
        : field.issue?.summary || "A required source document is missing.",
      owner: requested ? ret.clientName : ret.assignedTo,
      blocking: true,
    };
  }

  return {
    id: field.id,
    fieldId: field.id,
    sectionId: field.section,
    kind: field.status === "conflicting-evidence" ? "source-conflict" : "review-issue",
    label: field.label,
    detail: field.issue?.summary || "A reviewer decision is required.",
    owner: ret.assignedTo,
    blocking: true,
  };
}

export function deriveJordanWorkflow(ret, fieldsById) {
  const metrics = deriveReviewMetrics(fieldsById);
  const blockers = metrics.unresolvedFields.map((field) => blockerFor(field, ret));
  const waitingBlocker = blockers.find((blocker) => blocker.kind === "waiting-on-client");

  let stageId = "cpa-review";
  let stage = "CPA Review";
  let stageContext = `${metrics.unresolvedCount} reviewer ${
    metrics.unresolvedCount === 1 ? "decision remains" : "decisions remain"
  } before the return can move to filing.`;
  let currentWork = "Review AI-flagged fields and resolve missing or conflicting evidence.";
  let nextAction = blockers[0]
    ? `Review ${blockers[0].label}`
    : "Run final filing checks";
  let actionOwner = ret.assignedTo;

  if (waitingBlocker) {
    stageId = "waiting-on-client";
    stage = "Waiting on Client";
    stageContext = `The return is paused until ${ret.clientName} provides requested support.`;
    currentWork = "The CPA review is paused on a client-owned document request.";
    nextAction = "Upload the missing charitable-contribution receipt or clarify the unsupported amount";
    actionOwner = ret.clientName;
  } else if (metrics.unresolvedCount === 0) {
    stageId = "ready-to-file";
    stage = "Ready to File";
    stageContext = "CPA review is complete and no unresolved blockers remain.";
    currentWork = "Final filing checks and e-file authorization.";
    nextAction = "Run final e-file checks and send the return for authorization";
    actionOwner = ret.assignedTo;
  }

  const stepStatus = Object.fromEntries(
    RETURN_LIFECYCLE.map((step) => [step.id, "upcoming"])
  );
  [
    "documents-requested",
    "documents-received",
    "ai-extraction-complete",
    "preparation-in-progress",
  ].forEach((id) => {
    stepStatus[id] = "complete";
  });

  if (stageId === "cpa-review") {
    stepStatus["cpa-review"] = "current";
  } else if (stageId === "waiting-on-client") {
    stepStatus["cpa-review"] = "paused";
    stepStatus["waiting-on-client"] = "current";
  } else if (stageId === "ready-to-file") {
    stepStatus["cpa-review"] = "complete";
    stepStatus["waiting-on-client"] = "skipped";
    stepStatus["ready-to-file"] = "current";
  }

  return {
    ...metrics,
    stageId,
    stage,
    stageContext,
    currentWork,
    nextAction,
    actionOwner,
    blockers,
    isBlocked: blockers.length > 0,
    completedSteps: RETURN_LIFECYCLE.filter((step) => stepStatus[step.id] === "complete"),
    steps: RETURN_LIFECYCLE.map((step) => ({ ...step, status: stepStatus[step.id] })),
  };
}

export function getStaticWorkflow(ret) {
  const stageId = ret.lifecycleStage || "cpa-review";
  const stepStatus = Object.fromEntries(
    RETURN_LIFECYCLE.map((step) => [step.id, "upcoming"])
  );

  const markComplete = (...ids) => {
    ids.forEach((id) => {
      stepStatus[id] = "complete";
    });
  };

  if (stageId === "documents-requested") {
    stepStatus["documents-requested"] = "current";
  } else if (stageId === "documents-received") {
    markComplete("documents-requested");
    stepStatus["documents-received"] = "current";
  } else if (stageId === "ai-extraction-complete") {
    markComplete("documents-requested", "documents-received");
    stepStatus["ai-extraction-complete"] = "current";
  } else if (stageId === "preparation-in-progress") {
    markComplete("documents-requested", "documents-received", "ai-extraction-complete");
    stepStatus["preparation-in-progress"] = "current";
  } else if (stageId === "cpa-review") {
    markComplete(
      "documents-requested",
      "documents-received",
      "ai-extraction-complete",
      "preparation-in-progress"
    );
    stepStatus["cpa-review"] = "current";
  } else if (stageId === "waiting-on-client") {
    markComplete("documents-requested", "documents-received", "ai-extraction-complete");
    stepStatus["preparation-in-progress"] = "paused";
    stepStatus["waiting-on-client"] = "current";
  } else if (stageId === "ready-to-file") {
    markComplete(
      "documents-requested",
      "documents-received",
      "ai-extraction-complete",
      "preparation-in-progress",
      "cpa-review"
    );
    stepStatus["waiting-on-client"] = "skipped";
    stepStatus["ready-to-file"] = "current";
  } else if (stageId === "filed") {
    markComplete(
      "documents-requested",
      "documents-received",
      "ai-extraction-complete",
      "preparation-in-progress",
      "cpa-review",
      "ready-to-file"
    );
    stepStatus["waiting-on-client"] = "skipped";
    stepStatus["filed"] = "current";
  }

  return {
    stageId,
    stage: ret.stage,
    stageContext: ret.stageContext,
    currentWork: ret.currentWork,
    nextAction: ret.nextAction,
    actionOwner: ret.actionOwner,
    blockers: ret.blockers || [],
    isBlocked: Boolean(ret.blockers?.length),
    progress: ret.reviewProgress,
    unresolvedCount: ret.unresolvedIssues,
    steps: RETURN_LIFECYCLE.map((step) => ({ ...step, status: stepStatus[step.id] })),
  };
}
