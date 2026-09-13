import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Beacon — status pages and incident timelines",
    template: "%s · Beacon",
  },
  description:
    "Beacon is a status page and incident communication tool: public uptime history, an operator console, and signed webhook delivery.",
}

const themeScript = `
try {
  var stored = localStorage.getItem("beacon-theme");
  var theme = stored === "light" || stored === "dark"
    ? stored
    : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
} catch (error) {}
`

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
    </head>
    <body>{children}</body>
  </html>
)

export default RootLayout
