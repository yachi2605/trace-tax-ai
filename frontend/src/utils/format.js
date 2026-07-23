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
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = dateOnly
    ? new Date(
        Number(iso.slice(0, 4)),
        Number(iso.slice(5, 7)) - 1,
        Number(iso.slice(8, 10))
      )
    : new Date(iso);
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
