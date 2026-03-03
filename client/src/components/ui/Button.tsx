import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}

const variants = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "bg-surface text-text-primary hover:bg-surface-hover border border-border",
  danger: "bg-danger text-white hover:bg-danger/80",
  ghost: "text-text-secondary hover:bg-surface-hover",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export default function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  return (
    <button
      className={`rounded font-medium inline-flex items-center justify-center disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
