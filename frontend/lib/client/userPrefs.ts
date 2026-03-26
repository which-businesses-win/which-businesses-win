"use client";

const PREFS_KEY = "plansureai.prefs.v1";

export type UserPrefs = {
  preferredSectorSlugs: string[];
  targetLocations: string;
  dealSizeMinM: number;
  dealSizeMaxM: number;
  onboardedAt: string;
};

export function loadUserPrefs(): UserPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as UserPrefs;
    if (!p || typeof p !== "object") return null;
    return p;
  } catch {
    return null;
  }
}

export function saveUserPrefs(prefs: UserPrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
