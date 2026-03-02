import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({ className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`transition-all duration-[350ms] ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-1 hover:shadow-lg ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
