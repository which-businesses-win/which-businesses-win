import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Best-effort example deal for onboarding (Manchester-flavoured BTR if present).
 */
export async function GET() {
  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { id: true, location: true, sector: true, name: true },
  });

  const loc = (s: string) => s.toLowerCase();
  const pick =
    deals.find(
      (d) =>
        loc(d.location).includes("manchester") &&
        (loc(d.sector).includes("rent") || loc(d.sector).includes("btr")),
    ) ??
    deals.find((d) => loc(d.location).includes("manchester")) ??
    deals[0];

  return Response.json({ id: pick?.id ?? null });
}
