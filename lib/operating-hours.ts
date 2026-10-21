/** Formats an operating-day hour, distinguishing the following calendar day. */
export function operatingHourLabel(hour: number) {
  return `${String(hour % 24).padStart(2, "0")}:00${hour >= 24 ? " (next day)" : ""}`;
}

/** Converts an operating-day hour to a local timestamp on its calendar day. */
export function operatingHourDate(date: string, hour: number) {
  const start = new Date(`${date}T00:00:00`);
  start.setDate(start.getDate() + Math.floor(hour / 24));
  start.setHours(hour % 24);
  return start;
}
