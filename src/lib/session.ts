import { useEffect, useState } from "react";
import type { HistoryItem } from "./types";

const KEY = "clausecheck-history";
const EVT = "clausecheck-history-change";

export function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function pushHistory(item: Omit<HistoryItem, "id" | "at">): HistoryItem {
  const full = { ...item, id: crypto.randomUUID(), at: Date.now() };
  const list = [full, ...readHistory()].slice(0, 20);
  sessionStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
  return full;
}

export function clearHistory() {
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVT));
}

export function useHistory() {
  const [list, setList] = useState<HistoryItem[]>([]);
  useEffect(() => {
    const load = () => setList(readHistory());
    load();
    window.addEventListener(EVT, load);
    return () => window.removeEventListener(EVT, load);
  }, []);
  return list;
}

export function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}
