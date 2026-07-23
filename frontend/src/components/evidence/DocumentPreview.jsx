import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { documentsHref } from "@/utils/workflowContext";

/**
 * DocumentPreview — Simulated tax document viewer with region highlighting.
 *
 * We render a stylized SVG-based W-2 / 1099 / 1098 layout (client-side, no
 * real personal data). When a region is passed in, we overlay a highlight
 * rectangle at the specified position.
 *
 * This is the visual proof for Challenge 01: source document traceability.
 */
export function DocumentPreview({
  document,
  highlightRegionId,
  className,
  expanded = false,
  context,
}) {
  const [zoom, setZoom] = useState(1);
  if (!document) {
    return (
      <div
        className={cn(
          "border border-dashed border-slate-300 rounded-md p-8 text-center bg-slate-50",
          className
        )}
      >
        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-sm text-slate-500">No source document linked</p>
      </div>
    );
  }

  const pageMeta = document.pages_meta?.[0];
  const region = pageMeta?.regions?.find((r) => r.id === highlightRegionId);

  return (
    <div
      data-testid="document-preview"
      className={cn(
        "border border-slate-200 rounded-md overflow-hidden bg-white",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={2} />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate" title={document.fileName}>
              {document.fileName}
            </p>
            <p className="text-[10px] text-slate-500 font-ibm-mono tabular-nums">
              {document.docType} · Page 1 of {document.pages}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            data-testid="doc-zoom-out"
            onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="font-ibm-mono text-[11px] text-slate-600 tabular-nums w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            data-testid="doc-zoom-in"
            onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Document canvas */}
      <div className={cn("bg-slate-100 bg-dot-grid overflow-auto scrollbar-thin", expanded ? "max-h-[560px]" : "max-h-[360px]")}>
        <div
          className="mx-auto my-4"
          style={{
            width: `${420 * zoom}px`,
            transformOrigin: "top center",
          }}
        >
          <div className="relative bg-white shadow-sm border border-slate-300 rounded-sm">
            {/* Render simulated document markup based on type */}
            <SimulatedDoc doc={document} />

            {/* Highlight overlay */}
            {region && (
              <div
                data-testid="doc-highlight-region"
                className="absolute border-2 border-amber-500 rounded-[2px] pointer-events-none animate-pulse"
                style={{
                  top: `${region.box.top}%`,
                  left: `${region.box.left}%`,
                  width: `${region.box.width}%`,
                  height: `${region.box.height}%`,
                  backgroundColor: "rgba(251, 191, 36, 0.18)",
                  boxShadow: "0 0 0 3px rgba(251, 191, 36, 0.25)",
                }}
              />
            )}
          </div>

          {region && (
            <div className="mt-3 flex items-start gap-2 bg-white border border-amber-200 rounded-md p-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-amber-800 font-medium">
                  Extracted region
                </p>
                <p className="text-xs text-slate-800 mt-0.5">{region.label}</p>
                <p className="text-sm font-ibm-mono text-slate-900 font-semibold tabular-nums mt-0.5">
                  {region.value}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 bg-white text-xs">
        <span className="text-slate-500">
          Uploaded {new Date(document.uploadedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
          {" · "}
          {document.sizeKb} KB
        </span>
        {!expanded && (
          <Link
            to={documentsHref({
              returnId: "ret-2025-001",
              ...context,
              documentId: document.id,
              regionId: highlightRegionId,
            })}
            className="inline-flex items-center gap-1 text-navy hover:text-navy-700 font-medium"
            data-testid="doc-open-full"
          >
            Open full document <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * SimulatedDoc — draws a recognizable W-2 / 1099 / 1098 layout with fictional
 * data. Kept simple and clearly stylized to signal it's a simulation.
 */
function SimulatedDoc({ doc }) {
  const common = "px-4 py-3 text-[9px] text-slate-700 font-ibm-mono tabular-nums leading-tight";

  if (doc.docType === "W-2" || doc.docType === "W-2c (corrected)") {
    const isCorrected = doc.docType === "W-2c (corrected)";
    const box1 = isCorrected ? "84,520.00" : "84,250.00";
    return (
      <div className={common}>
        <div className="text-center border-b border-slate-300 pb-2 mb-3">
          <p className="text-[13px] font-semibold text-slate-800 tracking-wide font-chivo">
            {isCorrected ? "Form W-2c · Corrected Wage and Tax Statement" : "Form W-2 · Wage and Tax Statement"}
          </p>
          <p className="text-[9px] text-slate-500">2025 · Copy B — To Be Filed With Employee's Federal Tax Return</p>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 aspect-[8.5/11] pb-6" style={{ height: 460 }}>
          <div className="border border-slate-300 p-1.5">
            <p className="text-[7px] uppercase text-slate-500">c · Employer name, address</p>
            <p className="font-semibold text-slate-800">Mainstage Engineering LLC</p>
            <p className="text-slate-600">411 Ironwood Way</p>
            <p className="text-slate-600">Meridian, XX 00000</p>
          </div>
          <div className="border border-slate-300 p-1.5">
            <p className="text-[7px] uppercase text-slate-500">e · Employee name</p>
            <p className="font-semibold text-slate-800">Jordan Lee</p>
            <p className="text-slate-600">14 Grove Street, Apt 3</p>
            <p className="text-slate-600">Meridian, XX 00000</p>
          </div>
          <div className={cn("border p-1.5 border-slate-300", isCorrected && "border-red-400 bg-red-50")}>
            <p className="text-[7px] uppercase text-slate-500">1 · Wages, tips, other comp.</p>
            <p className="text-[11px] font-semibold text-slate-900">${box1}</p>
          </div>
          <div className="border border-slate-300 p-1.5">
            <p className="text-[7px] uppercase text-slate-500">2 · Federal income tax withheld</p>
            <p className="text-[11px] font-semibold text-slate-900">$11,832.00</p>
          </div>
          <div className="border border-slate-300 p-1.5">
            <p className="text-[7px] uppercase text-slate-500">3 · Social security wages</p>
            <p className="text-[11px] font-semibold text-slate-900">$84,520.00</p>
          </div>
          <div className="border border-slate-300 p-1.5">
            <p className="text-[7px] uppercase text-slate-500">4 · Social security tax withheld</p>
            <p className="text-[11px] font-semibold text-slate-900">$5,240.24</p>
          </div>
          <div className="border border-slate-300 p-1.5">
            <p className="text-[7px] uppercase text-slate-500">5 · Medicare wages</p>
            <p className="text-[11px] font-semibold text-slate-900">$84,520.00</p>
          </div>
          <div className="border border-slate-300 p-1.5">
            <p className="text-[7px] uppercase text-slate-500">6 · Medicare tax withheld</p>
            <p className="text-[11px] font-semibold text-slate-900">$1,225.54</p>
          </div>
          <div className="border border-slate-300 p-1.5 col-span-2">
            <p className="text-[7px] uppercase text-slate-500">12a · Codes</p>
            <p className="font-semibold text-slate-900">DD · 6,140.00</p>
          </div>
        </div>
      </div>
    );
  }

  if (doc.docType === "1099-INT") {
    const box1 = doc.id === "doc-1099int-firstbank" ? "740.00" : "520.00";
    const blur = doc.id === "doc-1099int-ccu" ? "filter blur-[0.5px]" : "";
    return (
      <div className={cn(common, blur)}>
        <div className="text-center border-b border-slate-300 pb-2 mb-3">
          <p className="text-[13px] font-semibold text-slate-800 tracking-wide font-chivo">Form 1099-INT · Interest Income</p>
          <p className="text-[9px] text-slate-500">2025 · Payer copy</p>
        </div>
        <div className="pb-6" style={{ minHeight: 460 }}>
          <div className="border border-slate-300 p-2 mb-2">
            <p className="text-[7px] uppercase text-slate-500">Payer</p>
            <p className="font-semibold text-slate-800">{doc.issuer}</p>
          </div>
          <div className="border border-slate-300 p-2 mb-2">
            <p className="text-[7px] uppercase text-slate-500">Recipient</p>
            <p className="font-semibold text-slate-800">Jordan Lee</p>
          </div>
          <div className="border border-slate-300 p-2 mb-2">
            <p className="text-[7px] uppercase text-slate-500">Box 1 — Interest income</p>
            <p className="text-[11px] font-semibold text-slate-900">${box1}</p>
          </div>
          <div className="border border-slate-300 p-2 mb-2">
            <p className="text-[7px] uppercase text-slate-500">Box 2 — Early withdrawal penalty</p>
            <p className="text-[11px] font-semibold text-slate-900">$0.00</p>
          </div>
          <div className="border border-slate-300 p-2 mb-2">
            <p className="text-[7px] uppercase text-slate-500">Box 4 — Federal income tax withheld</p>
            <p className="text-[11px] font-semibold text-slate-900">$0.00</p>
          </div>
          {doc.id === "doc-1099int-ccu" && (
            <p className="text-[10px] text-red-600 mt-2">⚠ Scan quality: reduced. Some digits may be ambiguous.</p>
          )}
        </div>
      </div>
    );
  }

  if (doc.docType === "1098") {
    return (
      <div className={common}>
        <div className="text-center border-b border-slate-300 pb-2 mb-3">
          <p className="text-[13px] font-semibold text-slate-800 tracking-wide font-chivo">Form 1098 · Mortgage Interest Statement</p>
          <p className="text-[9px] text-slate-500">2025 · Borrower copy</p>
        </div>
        <div className="pb-6" style={{ minHeight: 460 }}>
          <div className="border border-slate-300 p-2 mb-2">
            <p className="text-[7px] uppercase text-slate-500">Recipient / Lender</p>
            <p className="font-semibold text-slate-800">{doc.issuer}</p>
          </div>
          <div className="border border-slate-300 p-2 mb-2">
            <p className="text-[7px] uppercase text-slate-500">Payer / Borrower</p>
            <p className="font-semibold text-slate-800">Jordan Lee</p>
          </div>
          <div className="border border-slate-300 p-2 mb-2">
            <p className="text-[7px] uppercase text-slate-500">Box 1 — Mortgage interest received</p>
            <p className="text-[11px] font-semibold text-slate-900">$8,214.36</p>
          </div>
          <div className="border border-slate-300 p-2 mb-2">
            <p className="text-[7px] uppercase text-slate-500">Box 2 — Outstanding mortgage principal</p>
            <p className="text-[11px] font-semibold text-slate-900">$284,150.00</p>
          </div>
        </div>
      </div>
    );
  }

  if (doc.docType === "Donation receipt") {
    return (
      <div className={common}>
        <div className="text-center border-b border-slate-300 pb-2 mb-3">
          <p className="text-[13px] font-semibold text-slate-800 tracking-wide font-chivo">{doc.issuer}</p>
          <p className="text-[9px] text-slate-500">Donation acknowledgement · 2025</p>
        </div>
        <div className="pb-6" style={{ minHeight: 400 }}>
          <p className="mb-2">Dear Jordan Lee,</p>
          <p className="mb-2 leading-relaxed">
            Thank you for your generous cash contribution to Meridian Community Foodbank.
            No goods or services were provided in exchange.
          </p>
          <div className="border border-slate-300 p-2 my-3">
            <p className="text-[7px] uppercase text-slate-500">Cash contribution</p>
            <p className="text-[11px] font-semibold text-slate-900">$1,200.00</p>
          </div>
          <p className="text-[9px] text-slate-500">EIN 00-0000000</p>
        </div>
      </div>
    );
  }

  // Fallback (worksheet)
  return (
    <div className={common}>
      <p className="text-[11px] font-semibold text-slate-800 mb-2 font-chivo">Client Taxpayer Worksheet</p>
      <div className="space-y-2 pb-8" style={{ minHeight: 400 }}>
        {[
          ["Filing status", "Single"],
          ["Dependents", "None"],
          ["Employer", "Mainstage Engineering LLC"],
          ["HSA contribution", "$3,850.00"],
          ["Charitable — cash", "$3,400.00"],
        ].map(([k, v]) => (
          <div className="border border-slate-300 p-2 flex justify-between" key={k}>
            <span className="text-slate-500">{k}</span>
            <span className="font-semibold text-slate-800">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
