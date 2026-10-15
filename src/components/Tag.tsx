import { useI18n } from "@/lib/i18n";
import type { Level } from "@/lib/types";

export function Tag({ level }: { level: Level }) {
  const { t } = useI18n();
  const cls = level === "green" ? "tag-green" : level === "yellow" ? "tag-yellow" : "tag-red";
  return (
    <span className={`${cls} inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold`}>
      <span className="size-1.5 rounded-full bg-current" />
      {t(level)}
    </span>
  );
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
    </div>
  );
}
