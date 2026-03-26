import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InternalPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const sp = await searchParams;
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (secret && sp.t !== secret) {
    return (
      <div style={{ padding: 20 }}>
        <p>
          Add <code>?t=</code> matching INTERNAL_API_SECRET to view this page.
        </p>
      </div>
    );
  }

  const deals = await prisma.deal.findMany();
  const total = deals.length;
  const correct = deals.filter((d) => d.evaluation === "correct").length;
  const accuracy = total ? (correct / total) * 100 : 0;

  return (
    <div style={{ padding: 20 }}>
      <h1>Model Performance</h1>
      <div>Deals: {total}</div>
      <div>Accuracy: {accuracy.toFixed(1)}%</div>
      <p style={{ marginTop: 16, fontSize: 12, color: "#666" }}>
        Accuracy = correct ÷ all deals (deals without outcome count as not
        correct).
      </p>
    </div>
  );
}
