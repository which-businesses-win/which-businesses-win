import { prisma } from "@/lib/prisma";
import { getSignalLabel } from "@/lib/marketSignalsBoard";
import { assignRanks, calculateScore } from "@/lib/sectors/engine";
import { getUnrankedSectors } from "@/lib/sectors/seed";
import type { GeoScoreEntry, Sector } from "@/lib/sectors/types";
import {
  CANONICAL_UK_CITIES,
  isNationalLocation,
  normalizeLocationName,
} from "@/lib/signals/locationNormalize";
import { normalizeSectorSlugs } from "@/lib/signals/normalize";
import {
  applySignalToBreakdown,
  buildChangeFeedFromSignals,
  cloneBreakdown,
  generateDriversFromSignals,
  signalImpact,
  type RawSignalRow,
  rowToDomain,
} from "@/lib/signals/processing";
import type { RawSignal } from "@/lib/signals/types";
import type { RawSignal as PrismaRawSignal } from "@prisma/client";

export function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/**
 * Merge seed baselines + ingested `RawSignal` rows → ranked sectors.
 * City-specific signals: half weight on global pillars, full weight on geo bucket.
 * Delta vs last `MarketSectorSnapshot` / `GeoScoreSnapshot` when present.
 */
export async function recomputeSectorsFromDb(): Promise<Sector[]> {
  const rows = await prisma.rawSignal.findMany({
    orderBy: { date: "asc" },
  });

  const signals: RawSignal[] = rows.map((r: PrismaRawSignal) => {
    const d = rowToDomain(r as RawSignalRow);
    return {
      ...d,
      sectors: normalizeSectorSlugs(d.sectors),
    };
  });

  const seeds = getUnrankedSectors();
  const sectorIds = seeds.map((s) => s.id);

  const recentGeo = await prisma.geoScoreSnapshot.findMany({
    where: { sectorId: { in: sectorIds } },
    orderBy: { bucketDate: "desc" },
    take: 800,
  });
  const lastGeoBySectorLocation = new Map<string, number>();
  for (const g of recentGeo) {
    const key = `${g.sectorId}\0${g.location}`;
    if (!lastGeoBySectorLocation.has(key)) {
      lastGeoBySectorLocation.set(key, g.score);
    }
  }

  const out: Sector[] = [];

  for (const seed of seeds) {
    const slug = seed.slug;
    const relevant = signals.filter((s) => s.sectors.includes(slug));

    let breakdown = cloneBreakdown(seed.signals);
    const baseline = calculateScore(seed.signals);
    const geo: Record<string, number> = {};
    for (const c of CANONICAL_UK_CITIES) {
      geo[c] = baseline;
    }

    for (const r of relevant) {
      const canonical = r.location?.name
        ? normalizeLocationName(r.location.name)
        : null;
      const national = isNationalLocation(r.location?.type, canonical);

      if (national) {
        breakdown = applySignalToBreakdown(breakdown, r);
      } else {
        breakdown = applySignalToBreakdown(breakdown, r, {
          sentimentScale: 0.5,
        });
        if (canonical && canonical !== "UK" && canonical in geo) {
          const impact = signalImpact(r);
          geo[canonical] = Math.max(
            0,
            Math.min(100, geo[canonical] + impact),
          );
        }
      }
    }

    const totalScore = calculateScore(breakdown);

    const lastSnap = await prisma.marketSectorSnapshot.findFirst({
      where: { sectorId: seed.id },
      orderBy: { bucketDate: "desc" },
    });
    const delta =
      lastSnap != null ? totalScore - lastSnap.totalScore : seed.delta;

    const driversFinal =
      relevant.length > 0
        ? generateDriversFromSignals(relevant)
        : seed.drivers.slice(0, 3);

    const changes =
      relevant.length > 0
        ? buildChangeFeedFromSignals(relevant)
        : seed.changes;

    const confidence = Math.min(
      99,
      seed.confidence + Math.min(5, relevant.length),
    );

    const geoScores: GeoScoreEntry[] = CANONICAL_UK_CITIES.map((c) => {
      const score = Math.round(geo[c] ?? baseline);
      const prev = lastGeoBySectorLocation.get(`${seed.id}\0${c}`);
      const deltaG = prev != null ? score - prev : null;
      return {
        location: c,
        score,
        delta: deltaG,
        label: getSignalLabel(score).label,
      };
    }).sort((a, b) => b.score - a.score);

    out.push({
      ...seed,
      signals: breakdown,
      score: totalScore,
      delta,
      drivers: driversFinal,
      changes,
      confidence,
      signalCount: (seed.signalCount ?? 0) + relevant.length,
      geoScores,
    });
  }

  return assignRanks(out);
}

/** Call after recompute (e.g. cron / internal process route). */
export async function persistSectorSnapshots(
  sectors: Sector[],
  bucket: Date,
): Promise<void> {
  for (const s of sectors) {
    await prisma.marketSectorSnapshot.upsert({
      where: {
        sectorId_bucketDate: {
          sectorId: s.id,
          bucketDate: bucket,
        },
      },
      create: {
        sectorId: s.id,
        bucketDate: bucket,
        scoresJson: JSON.stringify(s.signals),
        totalScore: s.score,
      },
      update: {
        scoresJson: JSON.stringify(s.signals),
        totalScore: s.score,
      },
    });
  }
}

export async function persistGeoSnapshots(
  sectors: Sector[],
  bucket: Date,
): Promise<void> {
  for (const s of sectors) {
    for (const g of s.geoScores) {
      await prisma.geoScoreSnapshot.upsert({
        where: {
          sectorId_location_bucketDate: {
            sectorId: s.id,
            location: g.location,
            bucketDate: bucket,
          },
        },
        create: {
          sectorId: s.id,
          location: g.location,
          bucketDate: bucket,
          score: g.score,
        },
        update: { score: g.score },
      });
    }
  }
}
