import { SECTIONS } from "@/data/reviewIssues";

export const EVIDENCE_TABS = new Set(["summary", "source", "reasoning", "history"]);

export function getSectionMeta(sectionId) {
  for (const section of SECTIONS) {
    if (section.id === sectionId) {
      return { ...section, parent: null };
    }
    const child = section.children?.find((candidate) => candidate.id === sectionId);
    if (child) {
      return { ...child, parent: section };
    }
  }
  return null;
}

export function contextParams({
  returnId,
  sectionId,
  fieldId,
  tab,
  documentId,
  regionId,
  eventId,
  queueFilter,
  queueSearch,
} = {}) {
  const params = new URLSearchParams();
  if (returnId) params.set("returnId", returnId);
  if (sectionId) params.set("section", sectionId);
  if (fieldId) params.set("field", fieldId);
  if (tab) params.set("tab", tab);
  if (documentId) params.set("document", documentId);
  if (regionId) params.set("region", regionId);
  if (eventId) params.set("event", eventId);
  if (queueFilter && queueFilter !== "all") params.set("queueFilter", queueFilter);
  if (queueSearch) params.set("queueSearch", queueSearch);
  return params;
}

export function returnHref(context) {
  const params = contextParams(context);
  params.delete("returnId");
  params.delete("document");
  params.delete("region");
  const query = params.toString();
  return `/returns/${context.returnId}${query ? `?${query}` : ""}`;
}

export function documentsHref(context) {
  const params = contextParams(context);
  params.delete("tab");
  const query = params.toString();
  return `/documents${query ? `?${query}` : ""}`;
}

export function activityHref(context) {
  const params = contextParams(context);
  params.delete("tab");
  params.delete("document");
  params.delete("region");
  const query = params.toString();
  return `/activity${query ? `?${query}` : ""}`;
}

export function queueHref({ queueFilter, queueSearch } = {}) {
  const params = new URLSearchParams();
  if (queueFilter && queueFilter !== "all") params.set("filter", queueFilter);
  if (queueSearch) params.set("search", queueSearch);
  const query = params.toString();
  return `/${query ? `?${query}` : ""}`;
}
