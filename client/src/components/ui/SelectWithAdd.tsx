import { SelectHTMLAttributes, forwardRef, useState, ReactNode } from "react";
import Button from "./Button";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  /** Render the inline add form. Called with a close callback. */
  renderAdd?: (onDone: () => void) => ReactNode;
}

const SelectWithAdd = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, options, placeholder, renderAdd, className = "", ...props }, ref) => {
    const [adding, setAdding] = useState(false);

    return (
      <div className="space-y-1">
        {label && (
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-text-primary">{label}</label>
            {renderAdd && !adding && (
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
        {adding && renderAdd ? (
          <div className="border border-accent/30 rounded-lg bg-accent/5 p-3 space-y-3">
            {renderAdd(() => setAdding(false))}
          </div>
        ) : (
          <>
            <select
              ref={ref}
              className={`w-full rounded border px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent ${error ? "border-danger" : "border-border"} ${className}`}
              {...props}
            >
              {placeholder && <option value="">{placeholder}</option>}
              {options.map((o) => (
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

SelectWithAdd.displayName = "SelectWithAdd";
export default SelectWithAdd;
