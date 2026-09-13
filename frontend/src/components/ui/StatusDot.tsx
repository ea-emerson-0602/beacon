import { cn } from "@/lib/cn"
import type { Tone } from "@/lib/status"

const tones: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-faint",
}

type StatusDotProps = {
  tone: Tone
  pulse?: boolean
  className?: string
}

export const StatusDot = ({ tone, pulse, className }: StatusDotProps) => (
  <span className={cn("relative flex h-2.5 w-2.5 shrink-0", className)}>
    {pulse ? (
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-full opacity-60 animate-pulse-ring",
          tones[tone],
        )}
      />
    ) : null}
    <span
      className={cn("relative h-2.5 w-2.5 rounded-full", tones[tone])}
    />
  </span>
)
