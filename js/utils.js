const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_INTERVAL_DAYS = 5;
export const MAX_INTERVAL_DAYS = 60;

// 카드 상태: 'graded'(시간에 따라 색이 변함) | 'held'(사용자가 고정, 항상 노랑)
export function nextIntervalDays(prevIntervalDays) {
  const prev = prevIntervalDays || DEFAULT_INTERVAL_DAYS;
  return Math.min(prev * 2, MAX_INTERVAL_DAYS);
}

// status: 'graded' | 'held'
// createdAt/expiresAt: JS Date
// 반환: 'green' | 'yellow' | 'red'
export function cardColor(card, now = new Date()) {
  if (card.status === "held") return "yellow";

  const expiresAt = card.expiresAt;
  const intervalDays = card.intervalDays || DEFAULT_INTERVAL_DAYS;
  if (!expiresAt) return "green";

  const msLeft = expiresAt.getTime() - now.getTime();
  const totalMs = intervalDays * DAY_MS;
  if (totalMs <= 0) return "red";

  const ratio = msLeft / totalMs;
  if (msLeft <= 0) return "red";
  if (ratio <= 0.25) return "red";
  if (ratio <= 0.5) return "yellow";
  return "green";
}

export function formatExpiry(expiresAt, now = new Date()) {
  if (!expiresAt) return "";
  const diffMs = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / DAY_MS);
  if (diffDays < 0) return `만료됨 (${Math.abs(diffDays)}일 지남)`;
  if (diffDays === 0) return "오늘 만료";
  return `${diffDays}일 후 만료`;
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
}
