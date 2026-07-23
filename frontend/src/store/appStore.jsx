// TraceTax AI - App-wide store using React Context + useReducer.
// Persists field-state changes, audit events, and correction history
// for the active browser session. Everything is in-memory / mock.

import React, { createContext, useContext, useMemo, useReducer, useCallback } from "react";
import { FIELDS } from "@/data/reviewIssues";
import { INITIAL_ACTIVITY } from "@/data/activity";
import { RETURNS, CURRENT_USER } from "@/data/returns";

const AppStateContext = createContext(null);

const initialState = {
  currentUser: CURRENT_USER,
  returns: RETURNS,
  // Field values (mutable). Keyed by field.id.
  fields: FIELDS.reduce((acc, f) => {
    acc[f.id] = { ...f, correctionHistory: [] };
    return acc;
  }, {}),
  activity: [...INITIAL_ACTIVITY],
  // UI state
  selectedFieldId: null,
  activeSectionId: "wages", // default deep-link section for Jordan Lee
};

function reducer(state, action) {
  switch (action.type) {
    case "SELECT_FIELD":
      return { ...state, selectedFieldId: action.fieldId };
    case "SET_SECTION":
      return { ...state, activeSectionId: action.sectionId };

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
            action: "accept-ai",
            priorValue,
            newValue,
            aiSuggestedValue: f.aiSuggestedValue,
            reason: "Accepted AI suggestion",
            timestamp: new Date().toISOString(),
          },
        ],
      };
      return {
        ...state,
        fields: { ...state.fields, [action.fieldId]: nextField },
        activity: [
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
            action: "keep-current",
            priorValue: f.currentValue,
            newValue: f.currentValue,
            aiSuggestedValue: f.aiSuggestedValue,
            reason: action.reason || "Kept current value",
            reasonCategory: action.reasonCategory || "other",
            timestamp: new Date().toISOString(),
          },
        ],
      };
      return {
        ...state,
        fields: { ...state.fields, [action.fieldId]: nextField },
        activity: [
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
            action: "manual-correction",
            priorValue,
            newValue: action.newValue,
            aiSuggestedValue: f.aiSuggestedValue,
            reason: action.reason,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      return {
        ...state,
        fields: { ...state.fields, [action.fieldId]: nextField },
        activity: [
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
        status: "verified",
        lastVerifiedBy: state.currentUser.name,
        lastVerifiedAt: new Date().toISOString(),
        selectedSourceDocId: action.chosenDocId,
        correctionHistory: [
          ...f.correctionHistory,
          {
            id: `ch-${Date.now()}`,
            actor: state.currentUser.name,
            action: "resolve-conflict",
            priorValue: f.currentValue,
            newValue: f.currentValue,
            aiSuggestedValue: f.aiSuggestedValue,
            reason: `Selected ${action.chosenDocLabel} as authoritative.`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      return {
        ...state,
        fields: { ...state.fields, [action.fieldId]: nextField },
        activity: [
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
          },
          ...state.activity,
        ],
      };
    }

    case "REQUEST_DOCUMENT": {
      const f = state.fields[action.fieldId];
      if (!f) return state;
      return {
        ...state,
        activity: [
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
  const [state, dispatch] = useReducer(reducer, initialState);

  const acceptAi = useCallback((fieldId) => dispatch({ type: "ACCEPT_AI", fieldId }), []);
  const keepCurrent = useCallback(
    (fieldId, reason, reasonCategory) =>
      dispatch({ type: "KEEP_CURRENT", fieldId, reason, reasonCategory }),
    []
  );
  const manualCorrection = useCallback(
    (fieldId, newValue, reason) =>
      dispatch({ type: "MANUAL_CORRECTION", fieldId, newValue, reason }),
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
    }),
    [state, acceptAi, keepCurrent, manualCorrection, resolveConflictWith, requestDocument, selectField, setSection]
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
  const fields = Object.values(fieldsById);
  const reviewable = fields.filter((f) => f.status !== "read-only");
  if (reviewable.length === 0) return 100;
  const resolved = reviewable.filter(
    (f) =>
      f.status === "verified" ||
      f.status === "manually-corrected" ||
      f.status === "locked"
  ).length;
  return Math.round((resolved / reviewable.length) * 100);
}

export function unresolvedCount(fieldsById) {
  return Object.values(fieldsById).filter(
    (f) =>
      f.status === "needs-review" ||
      f.status === "missing-source" ||
      f.status === "conflicting-evidence"
  ).length;
}
