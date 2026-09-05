export function getWeekKey(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  const weekStr = String(weekNo).padStart(2, "0");
  return `${d.getUTCFullYear()}-W${weekStr}`;
}

export function getTodayKey(date = new Date()) {
  return date.toISOString().split("T")[0];
}
