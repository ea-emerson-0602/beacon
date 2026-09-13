import type { ReactNode } from "react"
import { cn } from "@/lib/cn"

type CardProps = {
  children: ReactNode
  className?: string
}

export const Card = ({ children, className }: CardProps) => (
  <section
    className={cn(
      "rounded-2xl border border-line bg-surface/80 backdrop-blur-sm",
      "shadow-[var(--card-inset)]",
      className,
    )}
  >
    {children}
  </section>
)

type CardHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
}

export const CardHeader = ({ title, description, action }: CardHeaderProps) => (
  <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5">
    <div>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </div>
    {action}
  </header>
)

export const CardBody = ({ children, className }: CardProps) => (
  <div className={cn("px-6 py-5", className)}>{children}</div>
)
