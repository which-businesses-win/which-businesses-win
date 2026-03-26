"use client";

import { useCallback, useState } from "react";

type MemoResponse = {
  memo: {
    title: string;
    summary: string;
    sections: {
      overview: string;
      market: string;
      financials: string;
      risks: string;
      scenarios: string;
      recommendation: string;
    };
  };
  matchError: string | null;
  alert?: "upgraded" | "risk" | null;
};

function buildPlainText(m: MemoResponse["memo"]): string {
  const s = m.sections;
  return [
    m.title,
    "",
    "1. Executive summary",
    m.summary,
    "",
    "2. Deal overview",
    s.overview,
    "",
    "3. Market context (signals)",
    s.market,
    "",
    "4. Financials",
    s.financials,
    "",
    "5. Key risks",
    s.risks,
    "",
    "6. Scenario analysis",
    s.scenarios,
    "",
    "7. Recommendation",
    s.recommendation,
  ].join("\n\n");
}

type Props = {
  dealId: string;
  dealName?: string;
};

export function InvestmentMemoPanel({ dealId, dealName }: Props) {
  const [memo, setMemo] = useState<MemoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const loadMemo = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/deals/${encodeURIComponent(dealId)}/memo`, { cache: "no-store" })
      .then((r) => {
        if (r.status === 404) throw new Error("Deal not found");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<MemoResponse>;
      })
      .then((data) => {
        setMemo(data);
        setOpen(true);
      })
      .catch((e: unknown) => {
        setMemo(null);
        setError(e instanceof Error ? e.message : "Failed");
      })
      .finally(() => setLoading(false));
  }, [dealId]);

  const copyAll = useCallback(() => {
    if (!memo) return;
    void navigator.clipboard.writeText(buildPlainText(memo.memo));
  }, [memo]);

  const downloadPdf = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(
        `/api/deals/${encodeURIComponent(dealId)}/memo/pdf`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const raw = dealName?.trim() || "memo";
      const safe = raw.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 48);
      a.href = url;
      a.download = `PlanSureAI-Memo-${safe || "memo"}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "PDF failed");
    }
  }, [dealId, dealName]);

  const m = memo?.memo;

  return (
    <section className="mt-8 rounded-xl border border-deal-border bg-zinc-950/30 px-4 py-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-deal-muted">
          Investment memo
        </h2>
        <span className="text-[10px] text-deal-muted">~60s read · IC-ready</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void loadMemo()}
          disabled={loading}
          className="rounded-lg border border-deal-green bg-deal-green/10 px-4 py-2.5 text-sm font-semibold text-deal-green hover:bg-deal-green/20 disabled:opacity-60"
        >
          {loading ? "Generating…" : memo ? "Regenerate memo" : "Generate investment memo"}
        </button>
        {memo ? (
          <>
            <button
              type="button"
              onClick={copyAll}
              className="rounded-lg border border-deal-border px-4 py-2.5 text-sm font-medium text-deal-text hover:bg-zinc-900/80"
            >
              Copy all
            </button>
            <button
              type="button"
              onClick={() => void downloadPdf()}
              className="rounded-lg border border-deal-border px-4 py-2.5 text-sm font-medium text-deal-text hover:bg-zinc-900/80"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="rounded-lg border border-deal-border px-4 py-2.5 text-sm font-medium text-deal-muted hover:text-deal-text"
            >
              {open ? "Hide" : "Show"} preview
            </button>
          </>
        ) : null}
      </div>

      {error ? <p className="mb-3 text-sm text-deal-red">{error}</p> : null}

      {memo?.matchError ? (
        <p className="mb-3 text-xs text-deal-orange">
          Sector not mapped — memo uses base case only until deal.sector matches a live
          sector.
        </p>
      ) : null}

      {open && m ? (
        <div
          id="investment-memo-print"
          className="space-y-5 border-t border-deal-border pt-5 text-sm leading-relaxed text-deal-text"
        >
          <div>
            <h3 className="mb-2 text-base font-bold text-deal-text">{m.title}</h3>
            <p className="text-[11px] font-bold uppercase tracking-wide text-deal-muted">
              1. Executive summary
            </p>
            <pre className="mt-1 whitespace-pre-wrap font-sans text-[13px]">{m.summary}</pre>
          </div>
          {(
            [
              ["2. Deal overview", m.sections.overview],
              ["3. Market context (signals)", m.sections.market],
              ["4. Financials", m.sections.financials],
              ["5. Key risks", m.sections.risks],
              ["6. Scenario analysis", m.sections.scenarios],
              ["7. Recommendation", m.sections.recommendation],
            ] as const
          ).map(([label, body]) => (
            <div key={label}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-deal-muted">
                {label}
              </p>
              <pre className="mt-1 whitespace-pre-wrap font-sans text-[13px]">{body}</pre>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
