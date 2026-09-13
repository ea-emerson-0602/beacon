const dateTime = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

const dateOnly = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export const formatDateTime = (value: string | Date) =>
  dateTime.format(new Date(value))

export const formatDate = (value: string | Date) =>
  dateOnly.format(new Date(value))

export const formatRelative = (value: string | Date) => {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diffMs / 60000)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`

  return formatDate(value)
}

export const formatDuration = (from: string | Date, to: string | Date | null) => {
  const end = to ? new Date(to).getTime() : Date.now()
  const minutes = Math.max(1, Math.round((end - new Date(from).getTime()) / 60000))

  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (hours < 24) return rest ? `${hours}h ${rest}m` : `${hours}h`

  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

export const formatUptime = (value: number) => `${value.toFixed(3)}%`
