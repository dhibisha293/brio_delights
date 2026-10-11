import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const root = document.documentElement;
    const saved = localStorage.getItem("brio-pink-theme");
    if (saved) {
      root.setAttribute("data-theme", saved);
      return saved === "dark";
    }
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark;
  });

  useEffect(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem("brio-pink-theme");
    if (saved) {
      root.setAttribute("data-theme", saved);
      setIsDark(saved === "dark");
    } else {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem("brio-pink-theme")) {
          setIsDark(e.matches);
        }
      };
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
  }, []);

  const toggle = () => {
    const nextDark = !isDark;
    const nextTheme = nextDark ? "dark" : "light";
    setIsDark(nextDark);
    document.documentElement.setAttribute("data-theme", nextTheme);
    try {
      localStorage.setItem("brio-pink-theme", nextTheme);
    } catch {
      // ignore
    }
  };

  return (
    <button
      className="iconbtn"
      id="theme"
      type="button"
      aria-label="Switch colour theme"
      onClick={toggle}
    >
      <svg className="icon">
        <use id="theme-i" href={isDark ? "#i-sun" : "#i-moon"} />
      </svg>
    </button>
  );
}
