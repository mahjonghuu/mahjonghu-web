/** Formats an operating-day hour, distinguishing the following calendar day. */
export function operatingHourLabel(hour: number) {
  return `${String(hour % 24).padStart(2, "0")}:00${hour >= 24 ? " (next day)" : ""}`;
}

/** Converts an operating date/hour in the outlet's Jakarta timezone to an instant. */
export function operatingHourDate(date: string, hour: number) {
  const start = new Date(`${date}T00:00:00+07:00`);
  start.setTime(start.getTime() + hour * 60 * 60 * 1000);
  return start;
}
