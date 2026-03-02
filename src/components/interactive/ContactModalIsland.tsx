import { useState, useEffect } from "react";
import ContactModal from "./ContactModal";

export default function ContactModalIsland() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href="#contact"]');
      if (anchor) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!open) return null;
  return <ContactModal onClose={() => setOpen(false)} />;
}
