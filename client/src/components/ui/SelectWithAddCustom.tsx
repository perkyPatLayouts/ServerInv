import { SelectHTMLAttributes, forwardRef, useState } from "react";
import Button from "./Button";
import Input from "./Input";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Label displayed above the select. */
  label?: string;
  /** Error message displayed below the select. */
  error?: string;
  /** Preset options to display. */
  options: { value: string | number; label: string }[];
  /** Placeholder option text. */
  placeholder?: string;
  /** Callback when a custom value is added. Receives the new value string. */
  onAddCustom?: (value: string) => void;
}

/**
 * A select component for string-value fields with preset options and
 * an inline "Add new" custom value input. Unlike SelectWithAdd (which
 * works with DB-backed entities), this component manages custom values
 * locally for simple varchar columns.
 */
const SelectWithAddCustom = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, options, placeholder, onAddCustom, className = "", value, onChange, ...props }, ref) => {
    const [adding, setAdding] = useState(false);
    const [customValue, setCustomValue] = useState("");
    const [extraOptions, setExtraOptions] = useState<{ value: string; label: string }[]>([]);

    /** Build final options list: presets + any custom-added values. */
    const allOptions = [...options, ...extraOptions];

    /** If the current value isn't in allOptions, show it as an extra option. */
    const currentVal = value as string | undefined;
    const hasCurrentInOptions = !currentVal || allOptions.some((o) => String(o.value) === currentVal);

    const handleAdd = () => {
      const trimmed = customValue.trim();
      if (!trimmed) return;
      if (!allOptions.some((o) => String(o.value) === trimmed)) {
        setExtraOptions((prev) => [...prev, { value: trimmed, label: trimmed }]);
      }
      onAddCustom?.(trimmed);
      /* Trigger onChange on the hidden select by dispatching a synthetic event. */
      if (ref && typeof ref === "object" && ref.current) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype, "value"
        )?.set;
        nativeInputValueSetter?.call(ref.current, trimmed);
        ref.current.dispatchEvent(new Event("change", { bubbles: true }));
      }
      setCustomValue("");
      setAdding(false);
    };

    return (
      <div className="space-y-1">
        {label && (
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-text-primary">{label}</label>
            {!adding && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="text-xs text-accent hover:text-accent-hover font-medium"
              >
                + Add new
              </button>
            )}
          </div>
        )}
        {adding ? (
          <div className="border border-accent/30 rounded-lg bg-accent/5 p-3 space-y-3">
            <Input
              label="Custom Value"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleAdd} disabled={!customValue.trim()}>Add</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => { setAdding(false); setCustomValue(""); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <select
              ref={ref}
              value={value}
              onChange={onChange}
              className={`w-full rounded border px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent ${error ? "border-danger" : "border-border"} ${className}`}
              {...props}
            >
              {placeholder && <option value="">{placeholder}</option>}
              {!hasCurrentInOptions && currentVal && (
                <option value={currentVal}>{currentVal}</option>
              )}
              {allOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {error && <p className="text-xs text-danger">{error}</p>}
          </>
        )}
      </div>
    );
  }
);

SelectWithAddCustom.displayName = "SelectWithAddCustom";
export default SelectWithAddCustom;
