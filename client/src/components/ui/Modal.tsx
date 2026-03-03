import { ReactNode, useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface shadow-xl w-full sm:max-w-lg sm:mx-4 sm:rounded-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-xl border border-border">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl leading-none">&times;</button>
        </div>
        <div className="px-4 sm:px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
