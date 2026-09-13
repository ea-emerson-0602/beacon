import { Badge } from "@/components/ui/Badge"
import { formatDateTime, formatRelative } from "@/lib/format"
import { incidentTone, INCIDENT_STATUS_LABEL } from "@/lib/status"
import type { IncidentUpdate } from "@/lib/types"

type IncidentTimelineProps = {
  updates: IncidentUpdate[]
  limit?: number
}

/** Newest update first — that is what a customer scanning the page wants. */
export const IncidentTimeline = ({ updates, limit }: IncidentTimelineProps) => {
  if (updates.length === 0) {
    return <p className="text-sm text-faint">No updates posted yet.</p>
  }

  const sorted = [...updates].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const ordered = limit ? sorted.slice(0, limit) : sorted

  return (
    <ol className="relative space-y-5 border-l border-line pl-5">
      {ordered.map((update) => (
        <li key={update.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-canvas bg-line-strong"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={incidentTone(update.status)}>
              {INCIDENT_STATUS_LABEL[update.status]}
            </Badge>
            <time
              dateTime={update.createdAt}
              className="text-xs text-faint"
              title={formatDateTime(update.createdAt)}
            >
              {formatRelative(update.createdAt)}
            </time>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-fg/90">
            {update.body}
          </p>
          {update.author ? (
            <p className="mt-1 text-xs text-faint">
              Posted by {update.author.name}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
