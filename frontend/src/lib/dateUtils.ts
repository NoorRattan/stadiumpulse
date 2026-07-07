/** Formats a Date as the backend's required YYYY-MM-DD request value. */
export function toApiDate(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

/** Formats an ISO timestamp for compact stadium operations displays. */
export function formatTime(value: string, locale = "en"): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
