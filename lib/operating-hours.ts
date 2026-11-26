/** Formats a half-hour operating-day start, optionally marking the following calendar day. */
export function operatingHourLabel(hour: number, includeNextDay = true) {
  const hours = Math.floor(hour % 24);
  const minutes = hour % 1 === 0 ? "00" : "30";
  return `${String(hours).padStart(2, "0")}:${minutes}${includeNextDay && hour >= 24 ? " (next day)" : ""}`;
}

/** Converts an operating date/hour in the outlet's Jakarta timezone to an instant. */
export function operatingHourDate(date: string, hour: number) {
  const start = new Date(`${date}T00:00:00+07:00`);
  start.setTime(start.getTime() + hour * 60 * 60 * 1000);
  return start;
}
