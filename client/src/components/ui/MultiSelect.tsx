import { useState, useRef, useEffect } from "react";

interface Option {
  value: number;
  label: string;
}

interface Props {
  label: string;
  options: Option[];
  selected: Set<number>;
  onChange: (selected: Set<number>) => void;
}

/**
 * Multi-select dropdown with checkbox list.
 */
export default function MultiSelect({ label, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (value: number) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border bg-surface text-text-primary hover:bg-surface-hover transition-colors"
      >
        {label}
        {selected.size > 0 && (
          <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
            {selected.size}
          </span>
        )}
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-56 max-h-60 overflow-y-auto rounded-lg border border-border bg-surface shadow-xl">
          {options.length === 0 && (
            <div className="px-3 py-2 text-xs text-text-secondary">No options</div>
          )}
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-primary hover:bg-surface-hover cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(opt.value)}
                onChange={() => toggle(opt.value)}
                className="rounded border-border accent-accent"
              />
              <span className="truncate">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
