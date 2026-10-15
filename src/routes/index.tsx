import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, Printer, Send, X, WifiOff, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tag, PageHeader } from "@/components/Tag";
import { useI18n } from "@/lib/i18n";
import { analyzeContract, chatContract } from "@/lib/ai.functions";
import { mockAnalysis, SAMPLE_CONTRACT } from "@/lib/mock";
import { pushHistory, readHistory, fileToDataUrl } from "@/lib/session";
import type { Analysis } from "@/lib/types";

export const Route = createFileRoute("/")({
  validateSearch: z.object({ sample: z.number().optional(), h: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Contract Analyzer — ClauseCheck" },
      { name: "description", content: "Paste or scan a lease and get clause-by-clause risk tags, questions to ask, and an AI legal assistant." },
      { property: "og:title", content: "Contract Analyzer — ClauseCheck" },
      { property: "og:description", content: "AI clause-by-clause risk analysis for rental and purchase contracts." },
    ],
  }),
  component: Analyzer,
});

type Msg = { role: "user" | "assistant"; content: string };

function Analyzer() {
  const { t, lang } = useI18n();
  const { sample, h } = Route.useSearch();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [source, setSource] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (contract: string, f: File | null) => {
    setLoading(true);
    setResult(null);
    let r: Analysis;
    try {
      r = await analyzeContract({
        data: {
          text: contract || undefined,
          file: f ? { name: f.name, mime: f.type, dataUrl: await fileToDataUrl(f) } : undefined,
          lang,
        },
      });
    } catch (e) {
      console.error(e);
      r = mockAnalysis();
    }
    const src = contract || `[${f?.name}]`;
    setResult(r);
    setSource(src);
    pushHistory({ kind: "analysis", title: r.title, source: src, data: r });
    setLoading(false);
  };

  useEffect(() => {
    if (sample) {
      setText(SAMPLE_CONTRACT);
      setFile(null);
      run(SAMPLE_CONTRACT, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample]);

  useEffect(() => {
    if (!h) return;
    const item = readHistory().find((x) => x.id === h);
    if (item?.kind === "analysis") {
      setResult(item.data as Analysis);
      setSource(item.source ?? "");
      setText(item.source?.startsWith("[") ? "" : item.source ?? "");
    }
  }, [h]);

  const counts = result
    ? (["green", "yellow", "red"] as const).map((l) => ({ l, n: result.clauses.filter((c) => c.level === l).length }))
    : [];

  return (
    <div>
      <div className="no-print">
        <PageHeader title={t("startTitle")} sub={t("startBody")} />
        <div className="panel p-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("pasteHint")}
            className="min-h-48 resize-y border-0 bg-transparent font-mono text-sm focus-visible:ring-0"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload /> {t("upload")}
            </Button>
            {file && (
              <span className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs">
                {file.name}
                <button onClick={() => setFile(null)} aria-label="remove"><X className="size-3" /></button>
              </span>
            )}
            <Button className="ms-auto glow" disabled={loading || (!text.trim() && !file)} onClick={() => run(text.trim(), file)}>
              {loading ? <><Loader2 className="animate-spin" /> {t("analyzing")}</> : t("analyze")}
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="panel h-20 animate-pulse" />)}
        </div>
      )}

      {result && (
        <div className="mt-10 space-y-6">
          {result.offline && (
            <div className="no-print flex items-center gap-2 rounded-lg border border-caution/40 px-4 py-2 text-sm text-caution">
              <WifiOff className="size-4" /> {t("offline")}
            </div>
          )}
          <section className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-primary">{t("summary")}</p>
                <h2 className="mt-1 text-2xl font-bold">{result.title}</h2>
              </div>
              <Button variant="outline" className="no-print" onClick={() => window.print()}>
                <Printer /> {t("savePdf")}
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {counts.map(({ l, n }) => (
                <div key={l} className={`tag-${l} rounded-xl p-4 text-center`}>
                  <div className="text-3xl font-bold">{n}</div>
                  <div className="text-xs font-semibold">{t(l)}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 leading-relaxed text-muted-foreground">{result.summary}</p>
            {result.advice.length > 0 && (
              <>
                <h3 className="mt-4 font-semibold">{t("advice")}</h3>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
                  {result.advice.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </>
            )}
          </section>

          <section className="space-y-3">
            {result.clauses.map((c, i) => (
              <article key={i} className="panel p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{c.title}</h3>
                  <Tag level={c.level} />
                </div>
                <blockquote className="mt-2 border-s-2 border-primary/50 ps-3 text-sm italic text-muted-foreground">{c.text}</blockquote>
                <p className="mt-2 text-sm">{c.explanation}</p>
                {c.questions.length > 0 && (
                  <div className="mt-3 rounded-lg bg-muted p-3">
                    <p className="text-xs font-semibold text-primary">{t("askThese")}</p>
                    <ul className="mt-1 list-disc space-y-1 ps-5 text-sm">
                      {c.questions.map((q, j) => <li key={j}>{q}</li>)}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </section>

          <Chat key={source + result.title} context={`${source}\n\nANALYSIS:\n${JSON.stringify(result)}`} offline={!!result.offline} />
        </div>
      )}
    </div>
  );
}

function Chat({ context, offline }: { context: string; offline: boolean }) {
  const { t, lang } = useI18n();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const r = await chatContract({ data: { context, messages: next, lang } });
      setMsgs([...next, { role: "assistant", content: r.text }]);
    } catch {
      setMsgs([
        ...next,
        {
          role: "assistant",
          content:
            lang === "ar"
              ? "المساعد غير متاح حالياً. نصيحة عامة: اطلب توضيحاً كتابياً لأي بند أصفر أو أحمر قبل التوقيع."
              : "The assistant is offline right now. General tip: ask for written clarification of every yellow or red clause before signing.",
        },
      ]);
    }
    setBusy(false);
    inputRef.current?.focus();
  };

  return (
    <section className="no-print panel p-5">
      <h3 className="flex items-center gap-2 font-semibold"><Bot className="size-5 text-primary" />{t("chatTitle")}</h3>
      {offline && <p className="mt-1 text-xs text-muted-foreground">{t("offline")}</p>}
      <div className="mt-4 space-y-3">
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ms-auto w-fit max-w-[80%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground">{m.content}</div>
          ) : (
            <div key={i} className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 [&_p]:my-2">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          ),
        )}
        {busy && <Loader2 className="size-4 animate-spin text-primary" />}
      </div>
      <div className="mt-4 flex items-end gap-2">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={t("chatPh")}
          className="min-h-11 resize-none"
          rows={1}
        />
        <Button size="icon" onClick={send} disabled={busy || !input.trim()} aria-label={t("send")}><Send className="rtl:-scale-x-100" /></Button>
      </div>
    </section>
  );
}
