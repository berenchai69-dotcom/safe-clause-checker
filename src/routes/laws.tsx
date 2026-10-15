import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/Tag";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/laws")({
  head: () => ({
    meta: [
      { title: "Local Rental Laws & Rent Estimator — ClauseCheck" },
      { name: "description", content: "Common tenant rights, rental rules, and neighborhood rent benchmarks." },
      { property: "og:title", content: "Rental Laws & Rent Estimator — ClauseCheck" },
      { property: "og:description", content: "Know your tenant rights and fair rent for your area." },
    ],
  }),
  component: LawsPage,
});

const RULES: Record<"en" | "ar", [string, string][]> = {
  en: [
    ["Security deposit", "Deposits are commonly capped at 1–2 months' rent and must be returned within 30 days minus documented damage."],
    ["Rent increases", "Rent is generally fixed during a lease term. Increases usually require 60–90 days written notice at renewal."],
    ["Landlord entry", "Landlords typically must give 24 hours' notice before entering, except emergencies."],
    ["Repairs & habitability", "Landlords are normally responsible for structural repairs, plumbing, electrical, and heating/cooling systems."],
    ["Eviction", "Eviction requires a written notice and usually a court order. Self-help evictions (changing locks) are illegal in most places."],
    ["Late fees", "Late fees should be reasonable — often capped at around 5% of monthly rent — with a grace period."],
    ["Discrimination", "Refusing to rent based on religion, ethnicity, gender, disability, or family status is prohibited."],
    ["Registration", "Many jurisdictions require leases to be registered with a municipal authority to be enforceable."],
  ],
  ar: [
    ["التأمين", "عادةً لا يتجاوز التأمين إيجار شهر إلى شهرين، ويجب إعادته خلال 30 يوماً بعد خصم الأضرار الموثقة."],
    ["زيادة الإيجار", "يكون الإيجار ثابتاً عادةً خلال مدة العقد، وتتطلب الزيادة إشعاراً كتابياً قبل 60–90 يوماً عند التجديد."],
    ["دخول المالك", "يجب على المالك عادةً الإشعار قبل 24 ساعة من الدخول، إلا في الطوارئ."],
    ["الإصلاحات", "المالك مسؤول عادةً عن الإصلاحات الإنشائية والسباكة والكهرباء والتكييف."],
    ["الإخلاء", "يتطلب الإخلاء إشعاراً كتابياً وغالباً حكماً قضائياً. تغيير الأقفال دون حكم غير قانوني في معظم الأماكن."],
    ["غرامات التأخير", "يجب أن تكون معقولة — غالباً حوالي 5% من الإيجار — مع فترة سماح."],
    ["التمييز", "يُمنع رفض التأجير بسبب الدين أو العرق أو الجنس أو الإعاقة أو الحالة العائلية."],
    ["التسجيل", "تشترط جهات كثيرة تسجيل عقد الإيجار لدى البلدية ليكون نافذاً."],
  ],
};

const AREAS: Record<string, number> = {
  "Downtown / وسط المدينة": 1400,
  "Old City / المدينة القديمة": 900,
  "University District / حي الجامعة": 800,
  "Suburbs / الضواحي": 700,
  "Waterfront / الواجهة البحرية": 1900,
};

function LawsPage() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [area, setArea] = useState(Object.keys(AREAS)[0]!);
  const [beds, setBeds] = useState(2);
  const rules = useMemo(() => RULES[lang].filter(([a, b]) => (a + b).toLowerCase().includes(q.toLowerCase())), [lang, q]);
  const est = Math.round((AREAS[area] ?? 900) * (0.6 + beds * 0.25));

  return (
    <div>
      <PageHeader title={t("laws")} sub={t("mock")} />
      <section className="panel mb-8 p-6">
        <h2 className="text-lg font-semibold">{t("rentEst")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-sm">
            <span className="text-muted-foreground">{t("neighborhood")}</span>
            <select value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-input/30 px-3">
              {Object.keys(AREAS).map((a) => <option key={a} className="bg-popover">{a}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground">{t("bedrooms")}: {beds}</span>
            <input type="range" min={0} max={5} value={beds} onChange={(e) => setBeds(+e.target.value)} className="mt-3 w-full accent-primary" />
          </label>
          <div className="tag-green rounded-xl p-4 text-center">
            <div className="text-xs">{t("estimate")}</div>
            <div className="text-2xl font-bold">${Math.round(est * 0.9)} – ${Math.round(est * 1.1)}</div>
          </div>
        </div>
      </section>
      <h2 className="mb-3 text-lg font-semibold">{t("rights")}</h2>
      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="ps-9" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rules.map(([a, b]) => (
          <div key={a} className="panel p-4">
            <h3 className="font-semibold text-primary">{a}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
