export function getReservationDefaults(now = new Date()) {
  const dateParts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).formatToParts(now);
  const datePart = (type: string) => dateParts.find((part) => part.type === type)?.value ?? "";

  const timeParts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).formatToParts(now);
  const timePart = (type: string) => timeParts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${datePart("year")}-${datePart("month")}-${datePart("day")}`,
    time: `${timePart("hour")}:${timePart("minute")}`,
  };
}
