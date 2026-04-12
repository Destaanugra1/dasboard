"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "dashboard-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      document.documentElement.classList.toggle("light", saved === "light");
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
    document.documentElement.classList.toggle("light", nextTheme === "light");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="glass-card inline-flex h-10 w-10 items-center justify-center text-textPrimary transition hover:scale-105"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
