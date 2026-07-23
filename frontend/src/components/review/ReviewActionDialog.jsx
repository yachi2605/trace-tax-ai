import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { useAppState } from "@/store/appStore";
import { toast } from "sonner";

/**
 * ReviewActionDialog — handles the three primary correction workflows:
 *  1. Accept AI suggestion       (confirmation)
 *  2. Keep current value         (reason required)
 *  3. Enter a different value    (new value + reason required)
 *
 * Original AI recommendation + source evidence remain visible after correction.
 */
export function ReviewActionDialog({ open, onOpenChange, field, mode }) {
  const { acceptAi, keepCurrent, manualCorrection } = useAppState();

  const [reason, setReason] = useState("");
  const [reasonCategory, setReasonCategory] = useState("corrected-source");
  const [newValue, setNewValue] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setReasonCategory("corrected-w2-received");
      setNewValue(
        typeof field?.currentValue === "number" ? String(field.currentValue) : field?.currentValue || ""
      );
      setShowError(false);
    }
  }, [open, field]);

  if (!field) return null;

  const handleAccept = () => {
    acceptAi(field.id);
    toast.success("Suggested value applied", {
      description: `${field.label} is now Verified.`,
    });
    onOpenChange(false);
  };

  const handleKeep = () => {
    if (!reason.trim()) {
      setShowError(true);
      return;
    }
    keepCurrent(field.id, reason, reasonCategory);
    toast.success("Kept current value", {
      description: `Reason recorded in audit trail for ${field.label}.`,
    });
    onOpenChange(false);
  };

  const handleManual = () => {
    if (!reason.trim() || !newValue.trim()) {
      setShowError(true);
      return;
    }
    const parsed =
      typeof field.currentValue === "number" ? Number(newValue.replace(/[$,\s]/g, "")) : newValue;
    manualCorrection(field.id, parsed, reason, reasonCategory);
    toast.success("Manual correction saved", {
      description: `${field.label} updated. Original suggestion is preserved in History.`,
    });
    onOpenChange(false);
  };

  const REASONS = [
    { value: "corrected-w2-received", label: "Corrected W-2 received" },
    { value: "ocr-error", label: "OCR error" },
    { value: "tax-treatment-differs", label: "Tax treatment differs" },
    { value: "supporting-documentation", label: "Supporting documentation" },
    { value: "other", label: "Other (explain below)" },
  ];

  const title =
    mode === "accept"
      ? "Use the suggested value?"
      : mode === "keep"
        ? "Keep the current value?"
        : "Enter your own value";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="font-chivo">{title}</DialogTitle>
          <DialogDescription className="text-slate-500">
            {field.label} · <span className="font-ibm-mono">{field.formRef}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Context comparison block — always visible */}
        <div className="border border-slate-200 rounded-md bg-slate-50 divide-y divide-slate-200 text-sm">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Return value</span>
            <span className="font-ibm-mono tabular-nums font-semibold text-slate-900">
              {typeof field.currentValue === "number" ? formatCurrency(field.currentValue) : field.currentValue}
            </span>
          </div>
          {field.aiSuggestedValue !== null && field.aiSuggestedValue !== undefined && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-sky-700 uppercase tracking-wider">Suggested value</span>
              <span className="font-ibm-mono tabular-nums font-semibold text-sky-800">
                {typeof field.aiSuggestedValue === "number"
                  ? formatCurrency(field.aiSuggestedValue)
                  : field.aiSuggestedValue}
              </span>
            </div>
          )}
        </div>

        {mode === "accept" && (
          <p className="text-sm text-slate-600 leading-relaxed">
            The field will update to the suggested value and be marked{" "}
            <span className="font-medium text-emerald-700">Verified</span>. The original suggestion and its
            evidence stay on record in the History tab.
          </p>
        )}

        {mode === "manual" && (
          <div>
            <Label htmlFor="new-value" className="text-xs uppercase tracking-wider text-slate-500 font-medium">
              New value
            </Label>
            <Input
              id="new-value"
              data-testid="manual-new-value-input"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="font-ibm-mono mt-1"
              placeholder={typeof field.currentValue === "number" ? "0.00" : "value"}
            />
          </div>
        )}

        {(mode === "keep" || mode === "manual") && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                Reason category
              </Label>
              <RadioGroup value={reasonCategory} onValueChange={setReasonCategory} className="mt-2 space-y-1.5">
                {REASONS.map((r) => (
                  <div key={r.value} className="flex items-center gap-2">
                    <RadioGroupItem value={r.value} id={r.value} data-testid={`reason-${r.value}`} />
                    <Label htmlFor={r.value} className="text-sm text-slate-700 font-normal cursor-pointer">
                      {r.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label
                htmlFor="reason-text"
                className="text-xs uppercase tracking-wider text-slate-500 font-medium"
              >
                Explanation <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="reason-text"
                data-testid="reason-textarea"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.trim()) setShowError(false);
                }}
                className="mt-1 text-sm resize-none"
                rows={3}
                placeholder="Explain why this change is being made. This will be recorded in the audit trail."
              />
            </div>
            {showError && (
              <div
                className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2.5 py-1.5"
                role="alert"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  {mode === "manual" && !newValue.trim() ? "New value is required. " : ""}
                  Explanation is required for the audit trail.
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            data-testid="review-dialog-cancel"
          >
            Cancel
          </Button>
          {mode === "accept" && (
            <Button
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
              onClick={handleAccept}
              data-testid="review-dialog-confirm-accept"
            >
              Use suggested value
            </Button>
          )}
          {mode === "keep" && (
            <Button
              className="bg-navy hover:bg-navy-700 text-white"
              onClick={handleKeep}
              data-testid="review-dialog-confirm-keep"
            >
              Keep current & mark verified
            </Button>
          )}
          {mode === "manual" && (
            <Button
              className="bg-indigo-700 hover:bg-indigo-800 text-white"
              onClick={handleManual}
              data-testid="review-dialog-confirm-manual"
            >
              Save my value
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
