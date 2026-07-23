// Shared formatting utilities.

export function formatCurrency(value, options = {}) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  const { showSign = false, decimals = 2 } = options;
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sign = value < 0 ? "-" : showSign && value > 0 ? "+" : "";
  return `${sign}$${formatted}`;
}

export function formatDate(iso, style = "short") {
  if (!iso) return "—";
  const d = new Date(iso);
  if (style === "relative") {
    const diff = Date.now() - d.getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  if (style === "long") {
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function classForSeverity(sev) {
  switch (sev) {
    case "high":
      return "text-red-700 bg-red-50 border-red-200";
    case "medium":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "low":
      return "text-slate-600 bg-slate-50 border-slate-200";
    default:
      return "text-slate-500 bg-slate-50 border-slate-200";
  }
}

export function labelForStatus(status) {
  const map = {
    "ai-generated": "AI-generated",
    "needs-review": "Needs review",
    verified: "Verified",
    editable: "Editable",
    "read-only": "Read-only",
    locked: "Locked",
    "manually-corrected": "Manual override",
    "missing-source": "Missing source",
    "conflicting-evidence": "Conflicting evidence",
  };
  return map[status] || status;
}
