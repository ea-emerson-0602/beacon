import type { ReactNode } from "react"
import { Logo } from "@/components/Logo"
import { ThemeToggle } from "@/components/ThemeToggle"
import { StatusDot } from "@/components/ui/StatusDot"

const points = [
  "Public uptime history for every service",
  "Incident updates your customers can follow",
  "Signed webhooks with automatic retries",
]

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export const AuthShell = ({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) => (
  <div className="grid min-h-screen lg:grid-cols-2">
    <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
      <div className="mx-auto w-full max-w-sm animate-fade-up">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <h1 className="mt-10 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <div className="mt-8 text-sm text-muted">{footer}</div>
      </div>
    </div>

    <aside className="relative hidden border-l border-line bg-surface/50 lg:flex lg:flex-col lg:justify-center lg:px-16">
      <blockquote className="max-w-md">
        <p className="font-[family-name:var(--font-display)] text-3xl leading-snug tracking-tight">
          During an incident, silence is the second failure.
        </p>
        <p className="mt-4 text-sm text-muted">
          Beacon gives you one place to say what is broken, what you know, and
          what happens next.
        </p>
      </blockquote>
      <ul className="mt-10 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-3 text-sm text-muted">
            <StatusDot tone="ok" />
            {point}
          </li>
        ))}
      </ul>
    </aside>
  </div>
)
