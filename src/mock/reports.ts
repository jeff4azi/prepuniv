import type { QuizReport } from "./types";

/** In-memory store for submitted reports (grows at runtime via addReport). */
export const reports: QuizReport[] = [];

export function addReport(report: QuizReport): void {
  reports.unshift(report);
}
