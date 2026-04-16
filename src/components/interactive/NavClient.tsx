import { useEffect, useState } from "react";
import { trackAdvisoryNavDropdownOpened } from "@/lib/analytics";

const NAV_SECTIONS = ["home", "approach", "services", "insights", "about"];

export default function NavClient() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === "undefined") return "home";
    const path = window.location.pathname;
    if (path.startsWith("/insights")) return "insights";
    if (path.startsWith("/calculator")) return "calculator";
    if (path.startsWith("/advisory")) return "services";
    return "home";
  });

  /* ── scroll state ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── sync scroll class to <nav> ── */
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-nav]");
    if (!nav) return;
    if (scrolled) {
      nav.classList.add("nav-scrolled");
    } else {
      nav.classList.remove("nav-scrolled");
    }
  }, [scrolled]);

  /* ── active section observer (homepage only) ── */
  useEffect(() => {
    if (window.location.pathname !== "/") return;
    const els = NAV_SECTIONS.map((id) => document.getElementById(id)).filter(
      Boolean,
    ) as HTMLElement[];
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ── sync mobile drawer visibility ── */
  useEffect(() => {
    const drawer = document.querySelector<HTMLElement>("[data-nav-drawer]");
    if (!drawer) return;
    if (mobileOpen) {
      drawer.classList.remove("hidden");
      drawer.classList.add("flex");
    } else {
      drawer.classList.add("hidden");
      drawer.classList.remove("flex");
    }
  }, [mobileOpen]);

  /* ── close mobile drawer when clicking anchor links ── */
  useEffect(() => {
    const drawer = document.querySelector<HTMLElement>("[data-nav-drawer]");
    if (!drawer) return;
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (href.includes("#") || href.startsWith("/advisory") || href.startsWith("/insights") || href.startsWith("/newsletter") || href.startsWith("/client") || href.startsWith("/calculator")) {
        setMobileOpen(false);
      }
    };
    drawer.addEventListener("click", handleClick);
    return () => drawer.removeEventListener("click", handleClick);
  }, []);

  /* ── push active section to nav links ── */
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-nav]");
    if (!nav) return;
    nav.querySelectorAll<HTMLAnchorElement>("[data-nav-link]").forEach((a) => {
      if (a.dataset.navLink === activeSection) {
        a.classList.add("nav-link-active");
      } else {
        a.classList.remove("nav-link-active");
      }
    });
  }, [activeSection]);

  /* ── desktop Advisory dropdown (hover + keyboard) ── */
  useEffect(() => {
    const group = document.querySelector<HTMLElement>("[data-advisory-dropdown]");
    if (!group) return;
    const trigger = group.querySelector<HTMLAnchorElement>("[data-advisory-trigger]");
    const menu = group.querySelector<HTMLElement>("[data-advisory-menu]");
    const chevron = group.querySelector<SVGElement>("[data-advisory-chevron]");
    if (!trigger || !menu) return;

    let openTimer: number | undefined;
    let closeTimer: number | undefined;
    let announced = false;

    const open = () => {
      window.clearTimeout(closeTimer);
      menu.classList.remove("hidden");
      trigger.setAttribute("aria-expanded", "true");
      chevron?.style.setProperty("transform", "rotate(180deg)");
      if (!announced) {
        trackAdvisoryNavDropdownOpened("desktop");
        announced = true;
      }
    };
    const close = () => {
      menu.classList.add("hidden");
      trigger.setAttribute("aria-expanded", "false");
      chevron?.style.removeProperty("transform");
    };

    const onEnter = () => {
      window.clearTimeout(closeTimer);
      openTimer = window.setTimeout(open, 100);
    };
    const onLeave = () => {
      window.clearTimeout(openTimer);
      closeTimer = window.setTimeout(close, 200);
    };

    group.addEventListener("mouseenter", onEnter);
    group.addEventListener("mouseleave", onLeave);

    const onFocusIn = () => open();
    const onFocusOut = (e: FocusEvent) => {
      if (!group.contains(e.relatedTarget as Node)) close();
    };
    group.addEventListener("focusin", onFocusIn);
    group.addEventListener("focusout", onFocusOut);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        trigger.focus();
      }
    };
    group.addEventListener("keydown", onKey);

    return () => {
      group.removeEventListener("mouseenter", onEnter);
      group.removeEventListener("mouseleave", onLeave);
      group.removeEventListener("focusin", onFocusIn);
      group.removeEventListener("focusout", onFocusOut);
      group.removeEventListener("keydown", onKey);
      window.clearTimeout(openTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  /* ── mobile Advisory expandable sub-list ── */
  useEffect(() => {
    const group = document.querySelector<HTMLElement>("[data-advisory-mobile]");
    if (!group) return;
    const toggle = group.querySelector<HTMLButtonElement>(
      "[data-advisory-mobile-toggle]",
    );
    const list = group.querySelector<HTMLElement>("[data-advisory-mobile-list]");
    const chevron = group.querySelector<SVGElement>(
      "[data-advisory-mobile-chevron]",
    );
    if (!toggle || !list) return;

    let open = false;
    let announced = false;
    const onClick = () => {
      open = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        list.classList.remove("hidden");
        list.classList.add("flex");
        chevron?.style.setProperty("transform", "rotate(180deg)");
        if (!announced) {
          trackAdvisoryNavDropdownOpened("mobile");
          announced = true;
        }
      } else {
        list.classList.add("hidden");
        list.classList.remove("flex");
        chevron?.style.removeProperty("transform");
      }
    };
    toggle.addEventListener("click", onClick);
    return () => toggle.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        <span
          className={`block h-px w-5 bg-accent transition-all duration-300 ${mobileOpen ? "translate-y-[3.5px] rotate-45" : ""}`}
        />
        <span
          className={`block h-px w-5 bg-accent transition-all duration-300 ${mobileOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`}
        />
      </button>
    </>
  );
}
