import { useEffect, useState } from 'react';

let offsetMs = 0;

// Device clocks drift or get changed by users; deadlines are measured against server time instead.
export function syncServerTime(serverTime: string) {
  offsetMs = new Date(serverTime).getTime() - Date.now();
}

export function serverNow() {
  return Date.now() + offsetMs;
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
