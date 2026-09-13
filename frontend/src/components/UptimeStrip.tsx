import { cn } from "@/lib/cn"
import { formatDate } from "@/lib/format"
import { dayTone, SERVICE_STATUS_LABEL } from "@/lib/status"
import type { DayStatus } from "@/lib/types"

const bars: Record<string, string> = {
  ok: "bg-ok/70 hover:bg-ok",
  warn: "bg-warn/80 hover:bg-warn",
  danger: "bg-danger/80 hover:bg-danger",
  info: "bg-info/70 hover:bg-info",
  neutral: "bg-line-strong",
}

type UptimeStripProps = {
  history: { date: string; status: DayStatus }[]
  days: number
}

export const UptimeStrip = ({ history, days }: UptimeStripProps) => (
  <div>
    <div
      className="flex items-end gap-[2px]"
      role="img"
      aria-label={`Daily status for the last ${days} days`}
    >
      {history.map((day) => (
        <span
          key={day.date}
          title={`${formatDate(day.date)} — ${SERVICE_STATUS_LABEL[day.status]}`}
          className={cn(
            "h-8 flex-1 rounded-[2px] transition-colors duration-150",
            bars[dayTone(day.status)],
          )}
        />
      ))}
    </div>
    <div className="mt-2 flex items-center justify-between text-xs text-faint">
      <span>{days} days ago</span>
      <span>Today</span>
    </div>
  </div>
)
