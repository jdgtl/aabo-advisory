import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center font-body font-medium tracking-wide transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-px cursor-pointer";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-canvas hover:bg-secondary",
  outline:
    "border border-accent text-accent hover:bg-accent hover:text-canvas",
  ghost:
    "text-accent hover:bg-accent/10",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-[11px] tracking-[0.12em] uppercase",
  md: "px-6 py-3 text-[11px] tracking-[0.12em] uppercase",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
