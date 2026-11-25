export type DateTimeDisplay = "table" | "detail" | "full";

const formatters: Record<DateTimeDisplay, Intl.DateTimeFormat> = {
  table: new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Europe/Berlin",
  }),
  detail: new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }),
  full: new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Europe/Berlin",
  }),
};

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeZone: "Europe/Berlin",
});

/** Formats timestamps consistently throughout the application. */
export function formatDateTime(value: Date, display: DateTimeDisplay = "full"): string {
  return formatters[display].format(value);
}

/** Formats a calendar date consistently throughout the application. */
export function formatDate(value: Date): string {
  return dateFormatter.format(value);
}
