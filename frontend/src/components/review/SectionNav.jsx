import React from "react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { SECTIONS, getIssueCountBySection } from "@/data/reviewIssues";

/**
 * SectionNav — left panel navigation with issue counts.
 */
export function SectionNav({ fields, activeSectionId, onSelectSection }) {
  const issueCounts = getIssueCountBySection(Object.values(fields));

  return (
    <nav
      data-testid="section-nav"
      className="w-56 shrink-0 border-r border-slate-200 bg-white overflow-y-auto scrollbar-thin py-2"
      aria-label="Return sections"
    >
      <div className="px-3 py-2">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
          Return
        </p>
      </div>
      <ul className="space-y-0.5 px-2">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <SectionItem
              section={section}
              activeSectionId={activeSectionId}
              onSelect={onSelectSection}
              issueCounts={issueCounts}
              depth={0}
            />
            {section.children && (
              <ul className="mt-0.5 mb-1.5 pl-3">
                {section.children.map((child) => (
                  <li key={child.id}>
                    <SectionItem
                      section={child}
                      activeSectionId={activeSectionId}
                      onSelect={onSelectSection}
                      issueCounts={issueCounts}
                      depth={1}
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SectionItem({ section, activeSectionId, onSelect, issueCounts, depth }) {
  const Icon = section.icon ? Icons[section.icon] : null;
  const count = issueCounts[section.id] || 0;
  const isActive = activeSectionId === section.id;

  return (
    <button
      type="button"
      onClick={() => onSelect(section.id)}
      data-testid={`section-nav-${section.id}`}
      className={cn(
        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-sm transition-colors",
        isActive
          ? "bg-navy text-white font-medium"
          : "text-slate-700 hover:bg-slate-100",
        depth === 1 && "text-[13px]"
      )}
    >
      {Icon && depth === 0 && (
        <Icon
          className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : "text-slate-500")}
          strokeWidth={2.25}
        />
      )}
      <span className={cn("flex-1 truncate", depth === 1 && "pl-1")}>{section.label}</span>
      {count > 0 && (
        <span
          className={cn(
            "text-[10px] font-ibm-mono font-semibold tabular-nums px-1.5 py-0.5 rounded-sm",
            isActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
          )}
          data-testid={`issue-count-${section.id}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
