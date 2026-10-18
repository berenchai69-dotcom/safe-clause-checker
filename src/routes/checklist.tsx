import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Camera, Printer } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/Tag";
import { useI18n } from "@/lib/i18n";
import { aiErrorMessage } from "@/lib/ai-error";
import { generateChecklist } from "@/lib/ai.functions";
import { MOCK_CHECKLIST, SAMPLE_CONTRACT } from "@/lib/mock";
import { pushHistory, readHistory } from "@/lib/session";

export const Route = createFileRoute("/checklist")({
  validateSearch: z.object({ h: z.string().optional() }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Move-in Inspection Checklist — ClauseCheck" },
      { name: "description", content: "Generate a move-in inspection checklist from your contract and document property condition." },
      { property: "og:title", content: "Move-in Checklist — ClauseCheck" },
      { property: "og:description", content: "Document AC, plumbing, walls and meters before you move in." },
    ],
  }),
  component: ChecklistPage,
});

type Groups = { name: string; items: string[] }[];

function ChecklistPage() {
  const { t, lang } = useI18n();
  const { h } = Route.useSearch();
  const [text, setText] = useState("");
  const [groups, setGroups] = useState<Groups | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState<Record<string, { ok?: boolean; note?: string; photo?: string }>>({});

  useEffect(() => {
    const item = h && readHistory().find((x) => x.id === h);
    if (item && item.kind === "checklist") setGroups(item.data as Groups);
  }, [h]);

  const gen = async () => {
    setLoading(true);
    setError("");
    setGroups(null);
    let g: Groups;
    try { g = (await generateChecklist({ data: { text, lang } })).groups; } catch (e) { setError(aiErrorMessage(e, lang)); setLoading(false); return; }
    setGroups(g);
    pushHistory({ kind: "checklist", title: `${g.length} sections`, data: g });
    setLoading(false);
  };

  const upd = (k: string, v: object) => setState((s) => ({ ...s, [k]: { ...s[k], ...v } }));

  return (
    <div>
      <div className="no-print">
        <PageHeader title={t("checklist")} />
        <div className="panel p-4">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("pasteHint")} className="min-h-32 font-mono text-xs" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setText(SAMPLE_CONTRACT)}>{t("sample")}</Button>
            <Button variant="outline" onClick={() => setGroups(MOCK_CHECKLIST.groups)}>{t("useDefault")}</Button>
            <Button className="ms-auto glow" disabled={loading} onClick={gen}>{loading && <Loader2 className="animate-spin" />}{t("genChecklist")}</Button>
          </div>
        </div>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {groups && (
        <div className="mt-8 space-y-4">
          <Button variant="outline" className="no-print" onClick={() => window.print()}><Printer />{t("print")}</Button>
          {groups.map((g) => (
            <section key={g.name} className="panel p-5">
              <h3 className="mb-3 font-semibold text-primary">{g.name}</h3>
              <ul className="space-y-3">
                {g.items.map((it) => {
                  const k = g.name + it;
                  const s = state[k] ?? {};
                  return (
                    <li key={k} className="rounded-lg bg-muted/60 p-3">
                      <label className="flex items-center gap-3 text-sm">
                        <Checkbox checked={!!s.ok} onCheckedChange={(v) => upd(k, { ok: !!v })} />
                        <span className={s.ok ? "text-muted-foreground line-through" : ""}>{it}</span>
                      </label>
                      <div className="no-print mt-2 flex items-center gap-2 ps-7">
                        <Input value={s.note ?? ""} onChange={(e) => upd(k, { note: e.target.value })} placeholder={t("note")} className="h-8 text-xs" />
                        <label className="flex cursor-pointer items-center gap-1 whitespace-nowrap text-xs text-primary">
                          <Camera className="size-4" />{t("photo")}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upd(k, { photo: URL.createObjectURL(f) }); }} />
                        </label>
                        {s.photo && <img src={s.photo} alt="" className="size-8 rounded object-cover" />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
