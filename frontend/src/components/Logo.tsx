import Link from "next/link"
import { cn } from "@/lib/cn"

type LogoProps = {
  href?: string
  className?: string
}

export const Logo = ({ href = "/", className }: LogoProps) => (
  <Link
    href={href}
    aria-label="Beacon home"
    className={cn("inline-flex items-center gap-2.5", className)}
  >
    <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-brand/15 ring-1 ring-brand/30">
      <span className="h-2 w-2 rounded-full bg-brand" />
      <span className="absolute h-2 w-2 rounded-full bg-brand opacity-60 animate-pulse-ring" />
    </span>
    <span className="text-lg font-semibold tracking-tight">Beacon</span>
  </Link>
)
