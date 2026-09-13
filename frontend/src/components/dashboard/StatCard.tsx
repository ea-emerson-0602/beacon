import type { Tone } from "@/lib/status"
import { StatusDot } from "@/components/ui/StatusDot"

type StatCardProps = {
  label: string
  value: string | number
  hint?: string
  tone?: Tone
}

export const StatCard = ({ label, value, hint, tone }: StatCardProps) => (
  <div className="rounded-2xl border border-line bg-surface/70 px-5 py-4">
    <p className="text-xs uppercase tracking-wider text-faint">{label}</p>
    <p className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
      {tone ? <StatusDot tone={tone} /> : null}
      {value}
    </p>
    {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
  </div>
)
