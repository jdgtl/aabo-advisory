import { useEffect, useState } from "react";

const NAV_SECTIONS = ["home", "approach", "services", "insights", "about"];

export default function NavClient() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === "undefined") return "home";
    const path = window.location.pathname;
    if (path.startsWith("/insights")) return "insights";
    if (path.startsWith("/calculator")) return "calculator";
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
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === "A" && target.getAttribute("href")?.includes("#")) {
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
