const DATE_PARAM_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Returns `value` if it is a real calendar date in `YYYY-MM-DD` form, otherwise `null`. */
export function parseDateParam(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = DATE_PARAM_PATTERN.exec(value);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return isRealDate ? value : null;
}

/** Returns `value` if it is a valid IANA time zone, otherwise `"UTC"`. */
export function parseTimeZone(value: unknown): string {
  if (typeof value !== "string" || value === "") return "UTC";
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/** Formats a date as `YYYY-MM-DD` using its local calendar day. */
export function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses a `YYYY-MM-DD` string into a `Date` at local midnight of that day. */
export function fromDateParam(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
