export function safeLocalStorageGet(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeLocalStorageSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function readStoredNumber(key: string, fallback: number) {
  const raw = safeLocalStorageGet(key);
  if (raw == null) return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readStoredColor(key: string, fallback: number) {
  const raw = safeLocalStorageGet(key);
  if (raw == null) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(0xffffff, parsed >>> 0)) : fallback;
}

export function readStoredBoolean(key: string, fallback: boolean) {
  const raw = safeLocalStorageGet(key);
  if (raw == null) return fallback;
  return raw === '1' || raw === 'true';
}

export function readStoredJson<T>(key: string, normalize: (value: unknown) => T | null): T | null {
  const raw = safeLocalStorageGet(key);
  if (!raw) return null;
  try {
    return normalize(JSON.parse(raw));
  } catch {
    return null;
  }
}
