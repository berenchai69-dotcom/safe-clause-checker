import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Printer } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/Tag";
import { useI18n } from "@/lib/i18n";
import { draftAgreement } from "@/lib/ai.functions";
import { pushHistory, readHistory } from "@/lib/session";

export const Route = createFileRoute("/draft")({
  validateSearch: z.object({ h: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Smart Draft & Term Sheet Builder — ClauseCheck" },
      { name: "description", content: "Answer a few simple questions and get a balanced lease draft or negotiation term sheet." },
      { property: "og:title", content: "Smart Draft Builder — ClauseCheck" },
      { property: "og:description", content: "Generate a fair lease draft or term sheet before meeting your landlord." },
    ],
  }),
  component: DraftPage,
});

const STEPS = {
  en: [
    { k: "property", q: "What type of property?", opts: ["Apartment", "House", "Studio", "Shop / Office"] },
    { k: "rent", q: "Monthly rent amount?", input: "e.g. 1200 USD" },
    { k: "maintenance", q: "Who handles maintenance?", opts: ["Landlord: major, Tenant: minor", "Landlord: everything", "Tenant: everything"] },
    { k: "deposit", q: "Deposit terms?", opts: ["1 month, refundable", "2 months, refundable", "No deposit"] },
    { k: "pets", q: "Pets?", opts: ["Allowed", "With consent", "Not allowed"] },
    { k: "notice", q: "Termination notice period?", opts: ["30 days", "60 days", "90 days"] },
  ],
  ar: [
    { k: "property", q: "ما نوع العقار؟", opts: ["شقة", "منزل", "استوديو", "محل / مكتب"] },
    { k: "rent", q: "قيمة الإيجار الشهري؟", input: "مثال: 1200 دولار" },
    { k: "maintenance", q: "من يتولى الصيانة؟", opts: ["المالك: الكبيرة، المستأجر: البسيطة", "المالك: كل شيء", "المستأجر: كل شيء"] },
    { k: "deposit", q: "شروط التأمين؟", opts: ["شهر واحد مسترد", "شهران مستردان", "بدون تأمين"] },
    { k: "pets", q: "الحيوانات الأليفة؟", opts: ["مسموح", "بموافقة", "غير مسموح"] },
    { k: "notice", q: "مدة إشعار الإنهاء؟", opts: ["30 يوماً", "60 يوماً", "90 يوماً"] },
  ],
};

function DraftPage() {
  const { t, lang } = useI18n();
  const { h } = Route.useSearch();
  const steps = STEPS[lang];
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const item = h && readHistory().find((x) => x.id === h);
    if (item && item.kind === "draft") setOut(item.data as string);
  }, [h]);

  const step = steps[Math.min(i, steps.length - 1)];
  const done = i >= steps.length;

  const gen = async (mode: "draft" | "termsheet") => {
    setLoading(true);
    let text: string;
    try { text = (await draftAgreement({ data: { answers, mode, lang } })).text; }
    catch {
      text = `# ${mode === "draft" ? "Draft Lease Agreement" : "Term Sheet"}\n\n${Object.entries(answers).map(([k, v]) => `- [ ] **${k}**: ${v}`).join("\n")}\n\n_${t("offline")}_`;
    }
    setOut(text);
    pushHistory({ kind: "draft", title: `${mode} · ${answers.property ?? ""}`, data: text });
    setLoading(false);
  };

  return (
    <div>
      <div className="no-print">
        <PageHeader title={t("draft")} />
        <div className="mb-4 flex gap-1">
          {steps.map((_, j) => <div key={j} className={`h-1 flex-1 rounded-full ${j < i ? "bg-primary glow" : "bg-muted"}`} />)}
        </div>
        <div className="panel p-6">
          {!done ? (
            <>
              <h2 className="text-xl font-semibold">{step.q}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {"opts" in step && step.opts ? (
                  step.opts.map((o) => (
                    <Button key={o} variant={answers[step.k] === o ? "default" : "outline"} onClick={() => { setAnswers({ ...answers, [step.k]: o }); setI(i + 1); }}>{o}</Button>
                  ))
                ) : (
                  <Input placeholder={"input" in step ? step.input : ""} value={answers[step.k] ?? ""} onChange={(e) => setAnswers({ ...answers, [step.k]: e.target.value })} className="max-w-xs" />
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2 text-sm">
              {steps.map((s) => <div key={s.k} className="flex justify-between border-b py-1"><span className="text-muted-foreground">{s.q}</span><span>{answers[s.k]}</span></div>)}
              <div className="flex gap-2 pt-4">
                <Button className="glow" disabled={loading} onClick={() => gen("draft")}>{loading && <Loader2 className="animate-spin" />}{t("genDraft")}</Button>
                <Button variant="outline" disabled={loading} onClick={() => gen("termsheet")}>{t("genSheet")}</Button>
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-between">
            <Button variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>{t("back")}</Button>
            {!done && <Button variant="ghost" onClick={() => setI(i + 1)}>{t("next")}</Button>}
          </div>
        </div>
      </div>
      {out && (
        <div className="panel mt-8 p-8">
          <Button variant="outline" className="no-print float-end" onClick={() => window.print()}><Printer />{t("print")}</Button>
          <div className="text-sm leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:ps-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:ps-5">
            <ReactMarkdown>{out}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
