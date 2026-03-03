import { InputHTMLAttributes, forwardRef } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className = "", ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-text-primary">{label}</label>}
    <input
      ref={ref}
      className={`w-full rounded border px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent ${error ? "border-danger" : "border-border"} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
));

Input.displayName = "Input";
export default Input;
