const PLANNING_RISKS = new Set(["LOW", "MEDIUM", "HIGH"]);
const DECISIONS = new Set(["PROCEED", "CAUTION", "REJECT"]);

export function isPlanningRisk(s: string): boolean {
  return PLANNING_RISKS.has(s.trim().toUpperCase());
}

export function isDecisionVerdict(s: string): boolean {
  return DECISIONS.has(s.trim().toUpperCase());
}

export function normalizePlanningRisk(s: string): string {
  return s.trim().toUpperCase();
}

export function normalizeDecision(s: string): string {
  return s.trim().toUpperCase();
}

export type SignalSnapshotInput = {
  refusalRate: number;
  nearbyCount: number;
  drivers: string[];
};

export function parseSignalSnapshot(
  raw: unknown,
): SignalSnapshotInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const refusalRate = o.refusalRate;
  const nearbyCount = o.nearbyCount;
  if (typeof refusalRate !== "number" || !Number.isFinite(refusalRate)) {
    return null;
  }
  if (typeof nearbyCount !== "number" || !Number.isFinite(nearbyCount)) {
    return null;
  }
  if (!Number.isInteger(nearbyCount)) return null;

  if (!Array.isArray(o.drivers)) return null;
  const drivers = o.drivers.filter(
    (x): x is string => typeof x === "string",
  );

  return { refusalRate, nearbyCount, drivers };
}

export function driversToStored(drivers: string[]): string {
  return JSON.stringify(drivers);
}

export function storedToDrivers(stored: string): string[] {
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}
