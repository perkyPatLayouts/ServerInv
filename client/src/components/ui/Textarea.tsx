import { TextareaHTMLAttributes, forwardRef } from "react";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, Props>(({ label, error, className = "", ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-text-primary">{label}</label>}
    <textarea
      ref={ref}
      className={`w-full rounded border px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-y ${error ? "border-danger" : "border-border"} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
));

Textarea.displayName = "Textarea";
export default Textarea;
