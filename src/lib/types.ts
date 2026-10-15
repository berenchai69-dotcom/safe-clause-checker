export type Level = "green" | "yellow" | "red";
export type Clause = { title: string; text: string; level: Level; explanation: string; questions: string[] };
export type Analysis = { title: string; summary: string; advice: string[]; clauses: Clause[]; offline?: boolean };
export type Comparison = {
  summary: string;
  changes: { topic: string; before: string; after: string; level: Level; impact: string }[];
  offline?: boolean;
};
export type HistoryItem = {
  id: string;
  kind: "analysis" | "compare" | "draft" | "checklist";
  title: string;
  at: number;
  source?: string;
  data: unknown;
};
