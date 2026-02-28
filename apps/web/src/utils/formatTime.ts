/** Converts 24-hour time (HH:mm or HH:mm:ss) to 12-hour display (e.g. "7:00 PM") */
export function formatTimeForDisplay(time: string): string {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(time).trim());
  if (!match) return time;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return time;
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Converts 12-hour display (e.g. "7:00 PM") to 24-hour (HH:mm) for HTML time input */
export function displayTimeTo24Hour(display: string): string {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(display).trim());
  if (!m) return display;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const pm = m[3].toUpperCase() === "PM";
  if (h === 12) h = pm ? 12 : 0;
  else if (pm) h += 12;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
