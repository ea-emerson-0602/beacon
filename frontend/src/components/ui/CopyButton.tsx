"use client"

import { useState } from "react"
import { IconCopy } from "@/components/Icons"

type CopyButtonProps = {
  value: string
  label?: string
}

export const CopyButton = ({ value, label = "Copy" }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${label} to clipboard`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      <IconCopy />
      {copied ? "Copied" : label}
    </button>
  )
}
