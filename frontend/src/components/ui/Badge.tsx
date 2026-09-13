import type { ReactNode } from "react"
import { cn } from "@/lib/cn"
import type { Tone } from "@/lib/status"

const tones: Record<Tone, string> = {
  ok: "border-ok/30 bg-ok/12 text-ok",
  warn: "border-warn/30 bg-warn/12 text-warn",
  danger: "border-danger/30 bg-danger/12 text-danger",
  info: "border-info/30 bg-info/12 text-info",
  neutral: "border-line-strong bg-surface-2 text-muted",
}

type BadgeProps = {
  children: ReactNode
  tone?: Tone
  className?: string
}

export const Badge = ({ children, tone = "neutral", className }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
      tones[tone],
      className,
    )}
  >
    {children}
  </span>
)
