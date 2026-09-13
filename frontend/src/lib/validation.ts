export const PATTERNS = {
  name: "^[A-Za-z][A-Za-z\\s'.-]{1,79}$",
  organization: "^[A-Za-z0-9][A-Za-z0-9\\s.&'-]{1,79}$",
  serviceName: "^[A-Za-z0-9][A-Za-z0-9\\s.&+/\\-]{1,79}$",
  incidentTitle: "^[^\\x00-\\x1F]{4,160}$",
}

export const PASSWORD_HINT =
  "At least 8 characters, including uppercase, lowercase, a number, and a symbol"

export const isStrongPassword = (value: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/.test(value)

export const DEMO_EMAIL = "demo@beacon.dev"
export const DEMO_PASSWORD = "beacon1234"
