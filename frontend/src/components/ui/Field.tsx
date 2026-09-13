"use client"

import {
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react"
import { IconEye, IconEyeOff } from "@/components/Icons"
import { cn } from "@/lib/cn"

const control =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-fg transition-colors duration-200 placeholder:text-faint hover:border-line-strong focus:border-brand focus:outline-none"

type FieldProps = {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
}

export const Field = ({ label, hint, htmlFor, children }: FieldProps) => (
  <div className="space-y-1.5">
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium uppercase tracking-wider text-muted"
    >
      {label}
    </label>
    {children}
    {hint ? <p className="text-xs text-faint">{hint}</p> : null}
  </div>
)

export const Input = ({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(control, className)} {...props} />
)

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
}

export const PasswordInput = ({
  className,
  id,
  ...props
}: PasswordInputProps) => {
  const [visible, setVisible] = useState(false)

  const handleToggle = () => {
    setVisible((current) => !current)
  }

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={handleToggle}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-faint transition-colors hover:text-fg"
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  )
}

export const Textarea = ({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(control, "resize-y", className)} {...props} />
)

export const Select = ({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(control, "cursor-pointer", className)} {...props}>
    {children}
  </select>
)
