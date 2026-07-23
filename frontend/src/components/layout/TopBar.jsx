import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CURRENT_USER } from "@/data/returns";
import { LayoutList, FolderOpen, History, FileSignature, Search } from "lucide-react";
import { useAppState } from "@/store/appStore";
import {
  activityHref,
  documentsHref,
  queueHref,
  returnHref,
} from "@/utils/workflowContext";

/**
 * TopBar — global application shell header. Consistent across pages.
 */
export function TopBar() {
  const location = useLocation();
  const {
    state: {
      fields,
      selectedFieldId,
      activeSectionId,
      queueFilter,
      queueSearch,
    },
  } = useAppState();
  const params = new URLSearchParams(location.search);
  const pathReturnId = location.pathname.match(/^\/returns\/([^/]+)/)?.[1];
  const returnId = pathReturnId || params.get("returnId") || "ret-2025-001";
  const fieldId = params.get("field") || selectedFieldId || "field-wages-1a";
  const field = fields[fieldId];
  const sectionId = field?.section || params.get("section") || activeSectionId || "wages";
  const contextualQueueFilter =
    params.get("queueFilter") || params.get("filter") || queueFilter;
  const contextualQueueSearch =
    params.get("queueSearch") || params.get("search") || queueSearch;
  const context = {
    returnId,
    sectionId,
    fieldId,
    tab: params.get("tab") || "summary",
    documentId: params.get("document") || field?.evidence?.docId,
    regionId: params.get("region") || field?.evidence?.regionId,
    queueFilter: contextualQueueFilter,
    queueSearch: contextualQueueSearch,
  };
  const nav = [
    { to: queueHref(context), path: "/", label: "Review Queue", icon: LayoutList, testId: "top-nav-queue" },
    { to: returnHref(context), path: "/returns", label: "Returns", icon: FileSignature, testId: "top-nav-returns" },
    { to: documentsHref(context), path: "/documents", label: "Documents", icon: FolderOpen, testId: "top-nav-documents" },
    { to: activityHref(context), path: "/activity", label: "Activity", icon: History, testId: "top-nav-activity" },
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-40">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 group" data-testid="brand-link">
          <div className="w-7 h-7 rounded bg-navy flex items-center justify-center relative">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 6h12M4 12h16M4 18h8" strokeLinecap="round" />
              <circle cx="20" cy="18" r="2" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-chivo font-semibold text-slate-900 text-sm tracking-tight">
              TraceTax<span className="text-navy"> AI</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">
              CPA Review Workspace
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Primary">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.to}
                to={item.to}
                data-testid={item.testId}
                className={cn(
                  "px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors",
                  isActive
                    ? "bg-slate-100 text-navy"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 border border-slate-200 rounded px-2 py-1 bg-slate-50">
          <Search className="w-3 h-3" />
          <span className="font-ibm-mono">2025 filing season</span>
        </div>
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center text-[10px] font-semibold">
            {CURRENT_USER.initials}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-slate-900">{CURRENT_USER.name}</span>
            <span className="text-[10px] text-slate-500">{CURRENT_USER.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
