"use client"

import { useEffect, useState } from "react"
import { IconMoon, IconSun } from "@/components/Icons"

type Theme = "light" | "dark"

const readTheme = (): Theme => {
  if (typeof document === "undefined") return "dark"
  return document.documentElement.dataset.theme === "light" ? "light" : "dark"
}

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  localStorage.setItem("beacon-theme", theme)
}

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    setTheme(readTheme())
  }, [])

  const handleToggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark"
    setTheme(next)
    applyTheme(next)
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-fg"
    >
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  )
}
