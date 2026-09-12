export interface Campaign {
  id: string;
  at: number;
  customerIds: string[];
  label?: string;
}
export interface PeriodMetrics {
  start: number;
  end: number;
  observedStart: number;
  observedEnd: number;
  durationMs: number;
  coverage: number;
  occupied: number | null;
  reserved: number | null;
  purchases: number;
  invited: number;
  buyers: number;
  conversion: number | null;
  arrivals: number;
  convertedArrivals: number;
  expirations: number;
}
export interface AnalyticsSnapshot {
  now: number;
  campaigns: Campaign[];
  selected: Campaign | null;
  before: PeriodMetrics | null;
  after: PeriodMetrics | null;
  overlaps: Campaign[];
  source: "demo" | "session";
  windowMinutes: number;
  availableRange: { from: string; to: string };
  initial: number | null;
  final: number | null;
  series: { minute: number; occupied: number; demand: number }[];
  rows: { id: string; at: number; label: string; initial: number | null; final: number | null; purchases: number; conversion: number | null }[];
}
