// TraceTax AI - App-wide store using React Context + useReducer.
// Persists field-state changes, audit events, and correction history
// for the active browser tab. All domain data and logic remain client-side / mock.

import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { FIELDS } from "@/data/reviewIssues";
import { INITIAL_ACTIVITY } from "@/data/activity";
import { RETURNS, CURRENT_USER } from "@/data/returns";
import { deriveJordanWorkflow, deriveReviewMetrics } from "@/data/workflow";

const AppStateContext = createContext(null);
const REVIEW_RETURN_ID = "ret-2025-001";
const SESSION_STORAGE_KEY = "tracetax-review-session-v1";

// Capture a full snapshot of the AI recommendation at the moment of decision.
// This is what gets stored in each correctionHistory entry so the AI suggestion
// is *never* lost after a human override.
function snapshotAiRecommendation(f) {
  return {
    suggestedValue: f.aiSuggestedValue,
    confidence: f.confidence
      ? { level: f.confidence.level, pct: f.confidence.pct, reason: f.confidence.reason }
      : null,
    sourceRef: f.evidence
      ? {
          docId: f.evidence.docId || null,
          page: f.evidence.page || null,
          regionId: f.evidence.regionId || null,
          transformationType: f.evidence.transformation?.type || null,
          sourceValue: f.evidence.sourceValue ?? null,
        }
      : null,
  };
}

const initialFields = FIELDS.reduce((acc, f) => {
  acc[f.id] = { ...f, correctionHistory: [] };
  return acc;
}, {});

const DERIVED_FIELDS = [
  {
    id: "field-ded-total",
    componentIds: ["field-ded-mortgage", "field-ded-charitable"],
    calculate: (fields) =>
      numericValue(fields["field-ded-mortgage"]) +
      numericValue(fields["field-ded-charitable"]) +
      3714,
  },
  {
    id: "field-overview-agi",
    componentIds: ["field-wages-1a", "field-interest-2b", "field-adj-hsa"],
    calculate: (fields) =>
      numericValue(fields["field-wages-1a"]) +
      numericValue(fields["field-interest-2b"]) -
      numericValue(fields["field-adj-hsa"]) +
      100,
  },
];

function numericValue(field) {
  return typeof field?.currentValue === "number" ? field.currentValue : 0;
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function recalculateDerivedFields(fields) {
  const next = { ...fields };
  DERIVED_FIELDS.forEach((definition) => {
    const derivedField = next[definition.id];
    if (!derivedField) return;
    const calculatedValue = roundCurrency(definition.calculate(next));
    next[definition.id] = {
      ...derivedField,
      currentValue: calculatedValue,
      aiSuggestedValue: calculatedValue,
      difference: 0,
    };
  });
  return next;
}

function derivedFieldActivityEvents(previousFields, nextFields, currentUser) {
  const timestamp = new Date().toISOString();
  return DERIVED_FIELDS.flatMap((definition) => {
    const before = previousFields[definition.id];
    const after = nextFields[definition.id];
    if (!before || !after || before.currentValue === after.currentValue) return [];
    return [
      {
        id: `evt-derived-${definition.id}-${Date.now()}`,
        actor: currentUser.name,
        actorRole: "CPA",
        action: "recalculated",
        subject: after.label,
        returnId: REVIEW_RETURN_ID,
        fieldId: after.id,
        sectionId: after.section,
        docId: null,
        regionId: null,
        timestamp,
        detail: `Automatically recalculated from component fields. Value updated from ${before.currentValue} to ${after.currentValue}.`,
        icon: "Calculator",
      },
    ];
  });
}

function syncReviewReturn(returns, fields) {
  return returns.map((ret) => {
    if (ret.id !== REVIEW_RETURN_ID) return ret;
    const workflow = deriveJordanWorkflow(ret, fields);
    return {
      ...ret,
      stage: workflow.stage,
      lifecycleStage: workflow.stageId,
      stageContext: workflow.stageContext,
      currentWork: workflow.currentWork,
      nextAction: workflow.nextAction,
      actionOwner: workflow.actionOwner,
      blockers: workflow.blockers,
      unresolvedIssues: workflow.unresolvedCount,
      reviewProgress: workflow.progress,
      highestSeverity: workflow.highestSeverity,
      lastUpdated: new Date().toISOString(),
    };
  });
}

function activityContext(field) {
  return {
    returnId: REVIEW_RETURN_ID,
    fieldId: field?.id || null,
    sectionId: field?.section || null,
    docId: field?.evidence?.docId || null,
    regionId: field?.evidence?.regionId || null,
  };
}

function workflowTransitionEvent(state, nextFields, triggerField) {
  const ret = state.returns.find((candidate) => candidate.id === REVIEW_RETURN_ID);
  if (!ret) return null;
  const before = deriveJordanWorkflow(ret, state.fields);
  const after = deriveJordanWorkflow(ret, nextFields);
  if (before.stageId === after.stageId) return null;

  return {
    id: `evt-workflow-${Date.now()}`,
    actor: state.currentUser.name,
    actorRole: "CPA",
    action: "updated return status",
    subject: after.stage,
    returnId: REVIEW_RETURN_ID,
    fieldId: triggerField?.id || null,
    sectionId: triggerField?.section || null,
    docId: triggerField?.evidence?.docId || null,
    regionId: triggerField?.evidence?.regionId || null,
    timestamp: new Date().toISOString(),
    detail: `${after.stageContext} Next: ${after.nextAction} (${after.actionOwner}).`,
    icon: "Milestone",
  };
}

const baseInitialState = {
  currentUser: CURRENT_USER,
  returns: syncReviewReturn(RETURNS, initialFields),
  // Field values (mutable). Keyed by field.id.
  fields: initialFields,
  activity: [...INITIAL_ACTIVITY],
  // UI state
  selectedFieldId: null,
  activeSectionId: "wages", // default deep-link section for Jordan Lee
  queueFilter: "all",
  queueSearch: "",
};

function createInitialState() {
  if (typeof window === "undefined") return baseInitialState;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(SESSION_STORAGE_KEY));
    if (!saved || saved.version !== 1 || !saved.fields || !Array.isArray(saved.activity)) {
      return baseInitialState;
    }
    const hydratedFields = recalculateDerivedFields(
      Object.fromEntries(
        FIELDS.map((field) => [
          field.id,
          {
            ...initialFields[field.id],
            ...(saved.fields[field.id] || {}),
            correctionHistory: Array.isArray(saved.fields[field.id]?.correctionHistory)
              ? saved.fields[field.id].correctionHistory
              : [],
          },
        ])
      )
    );
    return {
      ...baseInitialState,
      fields: hydratedFields,
      returns: syncReviewReturn(RETURNS, hydratedFields),
      activity: saved.activity,
    };
  } catch {
    return baseInitialState;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case "SELECT_FIELD":
      return { ...state, selectedFieldId: action.fieldId };
    case "SET_SECTION":
      return { ...state, activeSectionId: action.sectionId };
    case "SET_QUEUE_FILTER":
      return { ...state, queueFilter: action.filter };
    case "SET_QUEUE_SEARCH":
      return { ...state, queueSearch: action.search };

    case "ACCEPT_AI": {
      const f = state.fields[action.fieldId];
      if (!f) return state;
      const priorValue = f.currentValue;
      const newValue = f.aiSuggestedValue;
      const nextField = {
        ...f,
        currentValue: newValue,
        status: "verified",
        difference: 0,
        lastVerifiedBy: state.currentUser.name,
        lastVerifiedAt: new Date().toISOString(),
        correctionHistory: [
          ...f.correctionHistory,
          {
            id: `ch-${Date.now()}`,
            actor: state.currentUser.name,
            actorRole: "CPA",
            action: "accept-ai",
            priorValue,
            newValue,
            aiSuggestedValue: f.aiSuggestedValue,
            aiRecommendation: snapshotAiRecommendation(f),
            reason: "Accepted AI suggestion as-is",
            reasonCategory: "accept-ai",
            timestamp: new Date().toISOString(),
          },
        ],
      };
      const nextFields = recalculateDerivedFields({
        ...state.fields,
        [action.fieldId]: nextField,
      });
      const transitionEvent = workflowTransitionEvent(state, nextFields, f);
      const derivedEvents = derivedFieldActivityEvents(
        state.fields,
        nextFields,
        state.currentUser
      );
      return {
        ...state,
        fields: nextFields,
        returns: syncReviewReturn(state.returns, nextFields),
        activity: [
          ...(transitionEvent ? [transitionEvent] : []),
          ...derivedEvents,
          {
            id: `evt-${Date.now()}`,
            actor: state.currentUser.name,
            actorRole: "CPA",
            action: "accepted-ai",
            subject: f.label,
            fieldId: f.id,
            timestamp: new Date().toISOString(),
            detail: `Accepted AI suggestion. Value updated from ${priorValue} to ${newValue}.`,
            icon: "CheckCircle2",
            ...activityContext(f),
          },
          ...state.activity,
        ],
      };
    }

    case "KEEP_CURRENT": {
      const f = state.fields[action.fieldId];
      if (!f) return state;
      const nextField = {
        ...f,
        status: "verified",
        lastVerifiedBy: state.currentUser.name,
        lastVerifiedAt: new Date().toISOString(),
        correctionHistory: [
          ...f.correctionHistory,
          {
            id: `ch-${Date.now()}`,
            actor: state.currentUser.name,
            actorRole: "CPA",
            action: "keep-current",
            priorValue: f.currentValue,
            newValue: f.currentValue,
            aiSuggestedValue: f.aiSuggestedValue,
            aiRecommendation: snapshotAiRecommendation(f),
            reason: action.reason || "Kept current value",
            reasonCategory: action.reasonCategory || "other",
            timestamp: new Date().toISOString(),
          },
        ],
      };
      const nextFields = recalculateDerivedFields({
        ...state.fields,
        [action.fieldId]: nextField,
      });
      const transitionEvent = workflowTransitionEvent(state, nextFields, f);
      const derivedEvents = derivedFieldActivityEvents(
        state.fields,
        nextFields,
        state.currentUser
      );
      return {
        ...state,
        fields: nextFields,
        returns: syncReviewReturn(state.returns, nextFields),
        activity: [
          ...(transitionEvent ? [transitionEvent] : []),
          ...derivedEvents,
          {
            id: `evt-${Date.now()}`,
            actor: state.currentUser.name,
            actorRole: "CPA",
            action: "kept-current",
            subject: f.label,
            fieldId: f.id,
            timestamp: new Date().toISOString(),
            detail: `Rejected AI suggestion. Kept ${f.currentValue}. Reason: ${action.reason || "not specified"}`,
            icon: "XCircle",
            ...activityContext(f),
          },
          ...state.activity,
        ],
      };
    }

    case "MANUAL_CORRECTION": {
      const f = state.fields[action.fieldId];
      if (!f) return state;
      const priorValue = f.currentValue;
      const nextField = {
        ...f,
        currentValue: action.newValue,
        status: "manually-corrected",
        difference: null,
        lastVerifiedBy: state.currentUser.name,
        lastVerifiedAt: new Date().toISOString(),
        correctionHistory: [
          ...f.correctionHistory,
          {
            id: `ch-${Date.now()}`,
            actor: state.currentUser.name,
            actorRole: "CPA",
            action: "manual-correction",
            priorValue,
            newValue: action.newValue,
            aiSuggestedValue: f.aiSuggestedValue,
            aiRecommendation: snapshotAiRecommendation(f),
            reason: action.reason,
            reasonCategory: action.reasonCategory || "other",
            timestamp: new Date().toISOString(),
          },
        ],
      };
      const nextFields = recalculateDerivedFields({
        ...state.fields,
        [action.fieldId]: nextField,
      });
      const transitionEvent = workflowTransitionEvent(state, nextFields, f);
      const derivedEvents = derivedFieldActivityEvents(
        state.fields,
        nextFields,
        state.currentUser
      );
      return {
        ...state,
        fields: nextFields,
        returns: syncReviewReturn(state.returns, nextFields),
        activity: [
          ...(transitionEvent ? [transitionEvent] : []),
          ...derivedEvents,
          {
            id: `evt-${Date.now()}`,
            actor: state.currentUser.name,
            actorRole: "CPA",
            action: "manual-correction",
            subject: f.label,
            fieldId: f.id,
            timestamp: new Date().toISOString(),
            detail: `Manual override — value changed from ${priorValue} to ${action.newValue}. Reason: ${action.reason}`,
            icon: "PencilLine",
            ...activityContext(f),
          },
          ...state.activity,
        ],
      };
    }

    case "USE_CONFLICTING_SOURCE": {
      const f = state.fields[action.fieldId];
      if (!f) return state;
      const nextField = {
        ...f,
        currentValue: action.chosenDocLabel,
        status: "verified",
        difference: null,
        lastVerifiedBy: state.currentUser.name,
        lastVerifiedAt: new Date().toISOString(),
        selectedSourceDocId: action.chosenDocId,
        correctionHistory: [
          ...f.correctionHistory,
          {
            id: `ch-${Date.now()}`,
            actor: state.currentUser.name,
            actorRole: "CPA",
            action: "resolve-conflict",
            priorValue: f.currentValue,
            newValue: action.chosenDocLabel,
            aiSuggestedValue: f.aiSuggestedValue,
            aiRecommendation: snapshotAiRecommendation(f),
            reason: `Selected ${action.chosenDocLabel} as authoritative.`,
            reasonCategory: "supporting-documentation",
            timestamp: new Date().toISOString(),
          },
        ],
      };
      const nextFields = recalculateDerivedFields({
        ...state.fields,
        [action.fieldId]: nextField,
      });
      const transitionEvent = workflowTransitionEvent(state, nextFields, f);
      const derivedEvents = derivedFieldActivityEvents(
        state.fields,
        nextFields,
        state.currentUser
      );
      return {
        ...state,
        fields: nextFields,
        returns: syncReviewReturn(state.returns, nextFields),
        activity: [
          ...(transitionEvent ? [transitionEvent] : []),
          ...derivedEvents,
          {
            id: `evt-${Date.now()}`,
            actor: state.currentUser.name,
            actorRole: "CPA",
            action: "resolved-conflict",
            subject: f.label,
            fieldId: f.id,
            timestamp: new Date().toISOString(),
            detail: `Resolved conflict — selected ${action.chosenDocLabel} as authoritative.`,
            icon: "GitMerge",
            ...activityContext(f),
          },
          ...state.activity,
        ],
      };
    }

    case "REQUEST_DOCUMENT": {
      const f = state.fields[action.fieldId];
      if (!f) return state;
      const nextField = {
        ...f,
        documentRequest: {
          status: "waiting-on-client",
          requestedAt: new Date().toISOString(),
          requestedBy: state.currentUser.name,
          owner: "Jordan Lee",
        },
      };
      const nextFields = recalculateDerivedFields({
        ...state.fields,
        [action.fieldId]: nextField,
      });
      const transitionEvent = workflowTransitionEvent(state, nextFields, f);
      return {
        ...state,
        fields: nextFields,
        returns: syncReviewReturn(state.returns, nextFields),
        activity: [
          ...(transitionEvent ? [transitionEvent] : []),
          {
            id: `evt-${Date.now()}`,
            actor: state.currentUser.name,
            actorRole: "CPA",
            action: "requested-document",
            subject: f.label,
            fieldId: f.id,
            timestamp: new Date().toISOString(),
            detail: `Requested missing supporting documentation from client.`,
            icon: "MailPlus",
            ...activityContext(f),
          },
          ...state.activity,
        ],
      };
    }

    default:
      return state;
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ version: 1, fields: state.fields, activity: state.activity })
      );
    } catch {
      // The prototype still works in-memory when browser storage is unavailable.
    }
  }, [state.activity, state.fields]);

  const acceptAi = useCallback((fieldId) => dispatch({ type: "ACCEPT_AI", fieldId }), []);
  const keepCurrent = useCallback(
    (fieldId, reason, reasonCategory) =>
      dispatch({ type: "KEEP_CURRENT", fieldId, reason, reasonCategory }),
    []
  );
  const manualCorrection = useCallback(
    (fieldId, newValue, reason, reasonCategory) =>
      dispatch({ type: "MANUAL_CORRECTION", fieldId, newValue, reason, reasonCategory }),
    []
  );
  const resolveConflictWith = useCallback(
    (fieldId, chosenDocId, chosenDocLabel) =>
      dispatch({ type: "USE_CONFLICTING_SOURCE", fieldId, chosenDocId, chosenDocLabel }),
    []
  );
  const requestDocument = useCallback(
    (fieldId) => dispatch({ type: "REQUEST_DOCUMENT", fieldId }),
    []
  );
  const selectField = useCallback((fieldId) => dispatch({ type: "SELECT_FIELD", fieldId }), []);
  const setSection = useCallback((sectionId) => dispatch({ type: "SET_SECTION", sectionId }), []);
  const setQueueFilter = useCallback(
    (filter) => dispatch({ type: "SET_QUEUE_FILTER", filter }),
    []
  );
  const setQueueSearch = useCallback(
    (search) => dispatch({ type: "SET_QUEUE_SEARCH", search }),
    []
  );

  const value = useMemo(
    () => ({
      state,
      acceptAi,
      keepCurrent,
      manualCorrection,
      resolveConflictWith,
      requestDocument,
      selectField,
      setSection,
      setQueueFilter,
      setQueueSearch,
    }),
    [
      state,
      acceptAi,
      keepCurrent,
      manualCorrection,
      resolveConflictWith,
      requestDocument,
      selectField,
      setSection,
      setQueueFilter,
      setQueueSearch,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

// Derived helpers
export function computeReviewProgress(fieldsById) {
  return deriveReviewMetrics(fieldsById).progress;
}

export function unresolvedCount(fieldsById) {
  return deriveReviewMetrics(fieldsById).unresolvedCount;
}
