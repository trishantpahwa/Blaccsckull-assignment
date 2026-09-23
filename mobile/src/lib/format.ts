import type { Dictionary } from '@/i18n';

// Indian digit grouping (1,50,000) without relying on Intl support in the JS engine.
export function formatRupees(paise: number) {
  const rupees = paise / 100;
  const [whole, fraction] = (Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2)).split('.');
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  return `₹ ${grouped}${fraction ? `.${fraction}` : ''}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatDate(iso: string, t: Dictionary) {
  const d = new Date(iso);
  return `${d.getDate()} ${t.months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  const hours = d.getHours() % 12 || 12;
  return `${pad(hours)}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
}

export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function formatCountdown(ms: number) {
  const { days, hours, minutes, seconds } = splitDuration(ms);
  return `${pad(days)}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
}

export function formatShortDuration(ms: number) {
  const { days, hours, minutes, seconds } = splitDuration(ms);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}:${pad(seconds)}`;
}
