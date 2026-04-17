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
  // Start visible so SSR and no-JS render content immediately.
  // The effect below opts into the fade-in-on-scroll animation after mount.
  const [visible, setVisible] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const el = ref.current;
    if (!el) return;

    // Opt in to the animation: hide first, then observe for reveal.
    setAnimate(true);
    setVisible(false);

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

  const style: CSSProperties = animate
    ? {
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : offsets[direction].transform,
        transition: `opacity 0.7s cubic-bezier(.4,0,.2,1) ${delay}s, transform 0.7s cubic-bezier(.4,0,.2,1) ${delay}s`,
      }
    : {};

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
