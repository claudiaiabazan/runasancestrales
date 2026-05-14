export interface SavedReading {
  id: string;
  date: string;
  readingId: string;
  readingName: string;
  runes: { runeId: string; positionName: string }[];
}

const KEY = "runas:history";

export function getHistory(): SavedReading[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveReading(r: Omit<SavedReading, "id" | "date">): SavedReading {
  const reading: SavedReading = {
    ...r,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  const list = [reading, ...getHistory()].slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(list));
  return reading;
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}
