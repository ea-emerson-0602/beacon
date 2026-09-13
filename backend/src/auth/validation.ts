export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

export const PASSWORD_MESSAGE =
  "Password must be 8–128 characters and include uppercase, lowercase, a number, and a symbol";

export const NAME_PATTERN = /^[A-Za-z][A-Za-z\s'.-]{1,79}$/;

export const NAME_MESSAGE =
  "Name must be 2–80 letters and may include spaces, apostrophes, or hyphens";

export const ORGANIZATION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\s.&'-]{1,79}$/;

export const ORGANIZATION_MESSAGE =
  "Organisation name must be 2–80 characters and start with a letter or number";

export const SERVICE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\s.&+/\-]{1,79}$/;

export const SERVICE_NAME_MESSAGE =
  "Service name must be 2–80 characters and start with a letter or number";

export const INCIDENT_TITLE_PATTERN = /^[^\x00-\x1F]{4,160}$/;

export const INCIDENT_TITLE_MESSAGE =
  "Incident title must be 4–160 characters with no control characters";
