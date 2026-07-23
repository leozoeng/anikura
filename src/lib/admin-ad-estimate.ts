/** Rough entertainment/anime display RPM used for Night desk estimates. */
export const DESK_AD_RPM = {
  low: 0.8,
  mid: 2.0,
  high: 4.0,
} as const;

export function estimateAdRevenue(pageViews: number, rpm: number = DESK_AD_RPM.mid) {
  return (Math.max(0, pageViews) / 1000) * rpm;
}

export function formatUsd(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n < 10) return `$${n.toFixed(2)}`;
  if (n < 1000) return `$${Math.round(n)}`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export type GrowthDelta = {
  /** Percent change vs prior period. */
  percent: number;
  /** True when current > previous. */
  up: boolean;
  /** Short compare label, e.g. "vs yesterday". */
  vsLabel: string;
};

/**
 * Percent change current vs previous.
 * Returns null when both are zero (nothing to compare).
 * When previous is 0 and current > 0, treats as +100%.
 */
export function growthDelta(
  current: number,
  previous: number,
  vsLabel: string,
): GrowthDelta | null {
  if (current === 0 && previous === 0) return null;
  if (previous === 0) {
    return { percent: 100, up: current > 0, vsLabel };
  }
  const percent = ((current - previous) / previous) * 100;
  if (!Number.isFinite(percent)) return null;
  return {
    percent: Math.round(percent),
    up: percent > 0,
    vsLabel,
  };
}

export function formatGrowthPercent(percent: number) {
  const abs = Math.abs(percent);
  const sign = percent > 0 ? "+" : percent < 0 ? "−" : "";
  return `${sign}${abs}%`;
}
