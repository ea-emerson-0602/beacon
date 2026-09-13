import { cn } from "@/lib/cn"

type AlertProps = {
  message: string
  tone?: "danger" | "ok"
  className?: string
}

export const Alert = ({ message, tone = "danger", className }: AlertProps) => {
  if (!message) return null

  return (
    <p
      role="alert"
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-sm",
        tone === "danger"
          ? "border-danger/30 bg-danger/10 text-danger"
          : "border-ok/30 bg-ok/10 text-ok",
        className,
      )}
    >
      {message}
    </p>
  )
}
