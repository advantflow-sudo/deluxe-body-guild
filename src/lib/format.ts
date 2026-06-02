// Shared label helpers — purely presentational.

const METRIC_LABELS: Record<string, string> = {
  steps_days: "days hitting step goal",
  water_days: "days hitting water goal",
  workouts: "workouts",
  strength_workouts: "strength workouts",
  recovery_workouts: "recovery workouts",
  total_score: "score points",
};

export function humanizeMetric(metric: string | null | undefined, target?: number): string {
  if (!metric) return "";
  const key = metric.toLowerCase();
  const label = METRIC_LABELS[key] ?? key.replace(/_/g, " ");
  // Naive singularization for count of 1
  if (target === 1 && label.endsWith("s")) return label.slice(0, -1);
  return label;
}

export function formatGoal(target: number, metric: string | null | undefined): string {
  return `${target} ${humanizeMetric(metric, target)}`.trim();
}
