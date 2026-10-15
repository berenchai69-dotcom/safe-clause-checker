import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, WifiOff, ArrowRight } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tag, PageHeader } from "@/components/Tag";
import { useI18n } from "@/lib/i18n";
import { compareContracts } from "@/lib/ai.functions";
import { mockComparison, SAMPLE_CONTRACT, SAMPLE_CONTRACT_NEW } from "@/lib/mock";
import { pushHistory, readHistory } from "@/lib/session";
import type { Comparison } from "@/lib/types";

export const Route = createFileRoute("/compare")({
  validateSearch: z.object({ h: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Contract Comparison — ClauseCheck" },
      { name: "description", content: "Compare old and new lease versions and spot hidden rent hikes or shifted duties." },
      { property: "og:title", content: "Contract Comparison — ClauseCheck" },
      { property: "og:description", content: "Find risky changes between two contract versions." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { t, lang } = useI18n();
  const { h } = Route.useSearch();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Comparison | null>(null);

  useEffect(() => {
    const item = h && readHistory().find((x) => x.id === h);
    if (item && item.kind === "compare") setRes(item.data as Comparison);
  }, [h]);

  const run = async () => {
    setLoading(true);
    let r: Comparison;
    try { r = await compareContracts({ data: { a, b, lang } }); } catch { r = mockComparison(); }
    setRes(r);
    pushHistory({ kind: "compare", title: r.summary.slice(0, 50), data: r });
    setLoading(false);
  };

  return (
    <div>
      <PageHeader title={t("compare")} />
      <div className="grid gap-4 md:grid-cols-2">
        {[[t("oldV"), a, setA], [t("newV"), b, setB]].map(([label, v, set], i) => (
          <div key={i} className="panel p-3">
            <p className="px-1 pb-2 text-sm font-semibold">{label as string}</p>
            <Textarea value={v as string} onChange={(e) => (set as (s: string) => void)(e.target.value)} className="min-h-56 font-mono text-xs" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" onClick={() => { setA(SAMPLE_CONTRACT); setB(SAMPLE_CONTRACT_NEW); }}>{t("loadPair")}</Button>
        <Button className="ms-auto glow" disabled={loading || !a.trim() || !b.trim()} onClick={run}>
          {loading && <Loader2 className="animate-spin" />}{t("compareBtn")}
        </Button>
      </div>
      {res && (
        <div className="mt-8 space-y-3">
          {res.offline && <div className="flex items-center gap-2 text-sm text-caution"><WifiOff className="size-4" />{t("offline")}</div>}
          <p className="panel p-5 text-lg">{res.summary}</p>
          {res.changes.map((c, i) => (
            <div key={i} className="panel p-5">
              <div className="flex items-center justify-between"><h3 className="font-semibold">{c.topic}</h3><Tag level={c.level} /></div>
              <div className="mt-3 grid items-center gap-2 text-sm md:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-lg bg-muted p-3"><span className="text-xs text-muted-foreground">{t("before")}</span><p>{c.before}</p></div>
                <ArrowRight className="mx-auto size-4 text-primary rtl:rotate-180" />
                <div className="rounded-lg bg-accent p-3"><span className="text-xs text-muted-foreground">{t("after")}</span><p>{c.after}</p></div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{c.impact}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
