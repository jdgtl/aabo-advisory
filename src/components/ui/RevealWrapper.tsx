import { useRef, useState, useEffect, type ReactNode, type CSSProperties } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealWrapperProps {
  delay?: number;
  direction?: Direction;
  threshold?: number;
  className?: string;
  children: ReactNode;
}

const offsets: Record<Direction, CSSProperties> = {
  up: { transform: "translateY(32px)" },
  down: { transform: "translateY(-32px)" },
  left: { transform: "translateX(32px)" },
  right: { transform: "translateX(-32px)" },
  none: {},
};

export default function RevealWrapper({
  delay = 0,
  direction = "up",
  threshold = 0.13,
  className = "",
  children,
}: RevealWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const hiddenStyle: CSSProperties = {
    opacity: 0,
    ...offsets[direction],
    transition: `opacity 0.7s cubic-bezier(.4,0,.2,1) ${delay}s, transform 0.7s cubic-bezier(.4,0,.2,1) ${delay}s`,
  };

  const visibleStyle: CSSProperties = {
    opacity: 1,
    transform: "none",
    transition: `opacity 0.7s cubic-bezier(.4,0,.2,1) ${delay}s, transform 0.7s cubic-bezier(.4,0,.2,1) ${delay}s`,
  };

  return (
    <div
      ref={ref}
      className={className}
      style={visible ? visibleStyle : hiddenStyle}
    >
      {children}
    </div>
  );
}
