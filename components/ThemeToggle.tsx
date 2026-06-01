"use client";

import { useState } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.remove("theme-dark", "theme-light");
  document.documentElement.classList.add(`theme-${theme}`);
  localStorage.setItem("theme", theme);
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const savedTheme = localStorage.getItem("theme");

  return savedTheme === "light" ? "light" : "dark";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.1]"
    >
      {theme === "dark" ? "Светлая тема" : "Темная тема"}
    </button>
  );
}