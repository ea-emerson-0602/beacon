import Link from "next/link"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/cn"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[0_8px_24px_-10px_rgba(124,108,255,0.9)] hover:bg-brand-2 hover:shadow-[0_10px_28px_-8px_rgba(124,108,255,0.85)]",
  secondary:
    "border border-line-strong bg-surface-2 text-fg hover:border-brand/60 hover:bg-surface-3",
  ghost: "text-muted hover:bg-surface-2 hover:text-fg",
  danger:
    "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
}

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

export const Button = ({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) => (
  <button
    className={cn(base, variants[variant], sizes[size], className)}
    {...props}
  />
)

type ButtonLinkProps = {
  href: string
  children: ReactNode
  variant?: Variant
  size?: Size
  className?: string
}

export const ButtonLink = ({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: ButtonLinkProps) => (
  <Link
    href={href}
    className={cn(base, variants[variant], sizes[size], className)}
  >
    {children}
  </Link>
)
