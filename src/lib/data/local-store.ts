// Tiny localStorage-backed collection helper.
//
// Stand-in persistence until the Supabase project is wired up — every
// repository module (ems-repository.ts, etc.) is written against a small
// list/add/update/remove interface so swapping the implementation for real
// Supabase queries later is a same-shaped, one-file change.

function isBrowser() {
  return typeof window !== "undefined";
}

function read<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function listItems<T>(key: string): T[] {
  return read<T>(key);
}

export function addItem<T>(key: string, item: T): T {
  const items = read<T>(key);
  items.unshift(item);
  write(key, items);
  return item;
}

export function removeItem<T extends { id: string }>(key: string, id: string) {
  const items = read<T>(key).filter((item) => item.id !== id);
  write(key, items);
}
