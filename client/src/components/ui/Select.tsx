import { SelectHTMLAttributes, forwardRef } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, Props>(({ label, error, options, placeholder, className = "", ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-text-primary">{label}</label>}
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
  </div>
));

Select.displayName = "Select";
export default Select;
