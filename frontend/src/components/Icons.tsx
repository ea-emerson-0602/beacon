type IconProps = {
  className?: string
}

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
}

export const IconPulse = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />
  </svg>
)

export const IconShield = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    <path d="M9.5 12.5l1.8 1.8 3.5-3.6" />
  </svg>
)

export const IconWebhook = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="7" cy="17" r="3" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="12" cy="6" r="3" />
    <path d="M10.5 8.6L8.4 14M13.5 8.6L15.6 14M10 17h4" />
  </svg>
)

export const IconTimeline = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M6 4v16" />
    <circle cx="6" cy="8" r="2" />
    <circle cx="6" cy="16" r="2" />
    <path d="M11 8h9M11 16h6" />
  </svg>
)

export const IconDatabase = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
    <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
  </svg>
)

export const IconBolt = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" />
  </svg>
)

export const IconArrowRight = ({ className }: IconProps) => (
  <svg {...base} className={className} width={16} height={16}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const IconExternal = ({ className }: IconProps) => (
  <svg {...base} className={className} width={14} height={14}>
    <path d="M14 5h5v5M19 5l-7 7M17 14v4a1 1 0 01-1 1H6a1 1 0 01-1-1V8a1 1 0 011-1h4" />
  </svg>
)

export const IconPlus = ({ className }: IconProps) => (
  <svg {...base} className={className} width={16} height={16}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconTrash = ({ className }: IconProps) => (
  <svg {...base} className={className} width={16} height={16}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a1 1 0 001 1h8a1 1 0 001-1l1-12M9 7V4h6v3" />
  </svg>
)

export const IconEye = ({ className }: IconProps) => (
  <svg {...base} className={className} width={16} height={16}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
)

export const IconEyeOff = ({ className }: IconProps) => (
  <svg {...base} className={className} width={16} height={16}>
    <path d="M3 5l18 14" />
    <path d="M10.6 6.3A10.4 10.4 0 0112 6c6.5 0 10 7 10 7a16.6 16.6 0 01-3.3 4.1" />
    <path d="M6.1 8.4A16 16 0 002 13s3.5 7 10 7a10.6 10.6 0 004.4-.9" />
    <path d="M9.9 13.1a2.5 2.5 0 003.5 3.5" />
  </svg>
)

export const IconSun = ({ className }: IconProps) => (
  <svg {...base} className={className} width={16} height={16}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </svg>
)

export const IconMoon = ({ className }: IconProps) => (
  <svg {...base} className={className} width={16} height={16}>
    <path d="M16 3a8 8 0 108.5 10.8A7 7 0 0116 3z" />
  </svg>
)

export const IconCopy = ({ className }: IconProps) => (
  <svg {...base} className={className} width={15} height={15}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2h3" />
  </svg>
)
