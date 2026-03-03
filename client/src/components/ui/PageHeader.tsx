import { ReactNode } from "react";

interface Props {
  title: string;
  children?: ReactNode;
}

export default function PageHeader({ title, children }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{title}</h1>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
