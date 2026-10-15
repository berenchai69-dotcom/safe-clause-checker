import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  FileSearch, FilePen, GitCompare, ClipboardCheck, Scale, FlaskConical, History,
  PanelLeftClose, PanelLeftOpen, Languages, ShieldAlert, Lock, Trash2,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useI18n } from "@/lib/i18n";
import { useHistory, clearHistory } from "@/lib/session";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(true);
  const history = useHistory();
  const navigate = useNavigate();

  const nav = [
    { to: "/", label: t("analyzer"), icon: FileSearch },
    { to: "/draft", label: t("draft"), icon: FilePen },
    { to: "/compare", label: t("compare"), icon: GitCompare },
    { to: "/checklist", label: t("checklist"), icon: ClipboardCheck },
    { to: "/laws", label: t("laws"), icon: Scale },
  ] as const;

  const routeFor = (k: string) =>
    k === "compare" ? "/compare" : k === "draft" ? "/draft" : k === "checklist" ? "/checklist" : "/";

  return (
    <div className="flex min-h-screen">
      <aside
        className={`no-print sticky top-0 flex h-screen shrink-0 flex-col border-e bg-sidebar transition-all ${open ? "w-72" : "w-16"}`}
      >
        <div className="flex items-center gap-2 p-3">
          <img src={logo} alt="ClauseCheck" width={40} height={40} className="size-10 drop-shadow-[0_0_10px_var(--ring)]" />
          {open && (
            <div className="min-w-0">
              <div className="font-bold tracking-tight">ClauseCheck</div>
              <div className="truncate text-xs text-muted-foreground">{t("tagline")}</div>
            </div>
          )}
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
              activeProps={{ className: "!bg-accent !text-foreground glow" }}
            >
              <n.icon className="size-4 shrink-0" />
              {open && n.label}
            </Link>
          ))}
          <button
            onClick={() => navigate({ to: "/", search: { sample: Date.now() } })}
            className="mt-2 flex items-center gap-3 rounded-lg border border-primary/60 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            <FlaskConical className="size-4 shrink-0" />
            {open && t("sample")}
          </button>
        </nav>

        <div className="mt-auto flex min-h-0 flex-col border-t p-2">
          {open && (
            <>
              <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5"><History className="size-3.5" />{t("history")}</span>
                {history.length > 0 && (
                  <button onClick={clearHistory} aria-label={t("clear")} className="hover:text-foreground"><Trash2 className="size-3.5" /></button>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto">
                {history.length === 0 && <p className="px-2 py-1 text-xs text-muted-foreground">{t("empty")}</p>}
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => navigate({ to: routeFor(h.kind), search: { h: h.id } as never })}
                    className="block w-full truncate rounded px-2 py-1.5 text-start text-xs hover:bg-accent"
                  >
                    <span className="text-primary">{h.kind}</span> · {h.title}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="mt-2 flex items-center gap-1">
            <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent" aria-label="Toggle sidebar">
              {open ? <PanelLeftClose className="size-4 rtl:rotate-180" /> : <PanelLeftOpen className="size-4 rtl:rotate-180" />}
            </button>
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex items-center gap-2 rounded-lg p-2 text-sm text-muted-foreground hover:bg-accent"
            >
              <Languages className="size-4" />{open && (lang === "en" ? "العربية" : "English")}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="no-print border-b border-caution/40 bg-caution/10 px-6 py-2 text-sm text-caution">
          <div className="flex items-start gap-2"><ShieldAlert className="mt-0.5 size-4 shrink-0" />{t("disclaimer")}</div>
        </div>
        <main className="mx-auto w-full max-w-5xl flex-1 p-6 md:p-10">{children}</main>
        <footer className="no-print flex items-center gap-2 border-t px-6 py-3 text-xs text-muted-foreground">
          <Lock className="size-3.5" />{t("privacy")}
        </footer>
      </div>
    </div>
  );
}
