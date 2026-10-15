import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const dict = {
  en: {
    tagline: "Your AI real-estate contract guardian",
    analyzer: "Contract Analyzer",
    draft: "Smart Draft Builder",
    compare: "Contract Comparison",
    checklist: "Move-in Checklist",
    laws: "Laws & Rent Estimator",
    sample: "Load Sample Contract",
    history: "Session History",
    clear: "Clear",
    empty: "No analyses yet this session.",
    disclaimer: "This tool is for educational purposes only and does NOT constitute legal advice. Please consult a licensed lawyer before signing.",
    privacy: "Nothing you paste or upload is stored permanently. Don't paste ID numbers or bank details.",
    pasteHint: "Paste your lease or purchase contract here…",
    upload: "Upload PDF / Image",
    analyze: "Analyze contract",
    analyzing: "Analyzing…",
    summary: "Executive summary",
    advice: "What to do",
    askThese: "Ask about this",
    green: "Fair",
    yellow: "Caution",
    red: "Risky",
    savePdf: "Save as PDF",
    offline: "AI is unavailable — showing offline demo analysis.",
    chatTitle: "Ask the legal assistant",
    chatPh: "e.g. Can I negotiate the deposit?",
    send: "Send",
    startTitle: "Know what you're signing.",
    startBody: "Paste a contract, upload a scan, or load the sample to see instant clause-by-clause risk analysis.",
    oldV: "Old version",
    newV: "New version",
    compareBtn: "Compare versions",
    loadPair: "Load sample pair",
    before: "Before",
    after: "After",
    next: "Next",
    back: "Back",
    genDraft: "Balanced draft",
    genSheet: "Term sheet",
    print: "Print / Download",
    genChecklist: "Generate from contract",
    useDefault: "Use standard checklist",
    note: "Note",
    photo: "Attach photo",
    search: "Search rules…",
    rentEst: "Rent estimator",
    neighborhood: "Neighborhood",
    bedrooms: "Bedrooms",
    estimate: "Estimated monthly rent",
    rights: "Tenant rights & rules",
    mock: "Reference sample data — check your local authority.",
  },
  ar: {
    tagline: "حارسك الذكي لعقود العقارات",
    analyzer: "محلل العقود",
    draft: "منشئ المسودات الذكي",
    compare: "مقارنة العقود",
    checklist: "قائمة فحص الاستلام",
    laws: "القوانين وتقدير الإيجار",
    sample: "تحميل عقد تجريبي",
    history: "سجل الجلسة",
    clear: "مسح",
    empty: "لا توجد تحليلات في هذه الجلسة.",
    disclaimer: "هذه الأداة لأغراض تعليمية فقط ولا تُعد استشارة قانونية. يرجى استشارة محامٍ مرخص قبل التوقيع.",
    privacy: "لا يتم حفظ أي نص أو ملف بشكل دائم. لا تُدخل أرقام الهوية أو البيانات البنكية.",
    pasteHint: "الصق عقد الإيجار أو الشراء هنا…",
    upload: "رفع PDF / صورة",
    analyze: "تحليل العقد",
    analyzing: "جارٍ التحليل…",
    summary: "الملخص التنفيذي",
    advice: "ماذا تفعل",
    askThese: "اسأل عن هذا",
    green: "عادل",
    yellow: "انتبه",
    red: "خطر",
    savePdf: "حفظ كـ PDF",
    offline: "الذكاء الاصطناعي غير متاح — يتم عرض تحليل تجريبي.",
    chatTitle: "اسأل المساعد القانوني",
    chatPh: "مثال: هل يمكنني التفاوض على التأمين؟",
    send: "إرسال",
    startTitle: "اعرف ما الذي توقّع عليه.",
    startBody: "الصق عقداً، أو ارفع صورة، أو حمّل العقد التجريبي لتحليل فوري للبنود.",
    oldV: "النسخة القديمة",
    newV: "النسخة الجديدة",
    compareBtn: "قارن النسختين",
    loadPair: "تحميل نسختين تجريبيتين",
    before: "قبل",
    after: "بعد",
    next: "التالي",
    back: "رجوع",
    genDraft: "مسودة متوازنة",
    genSheet: "ورقة شروط",
    print: "طباعة / تنزيل",
    genChecklist: "إنشاء من العقد",
    useDefault: "استخدم القائمة القياسية",
    note: "ملاحظة",
    photo: "إرفاق صورة",
    search: "ابحث في القواعد…",
    rentEst: "مقدّر الإيجار",
    neighborhood: "الحي",
    bedrooms: "غرف النوم",
    estimate: "الإيجار الشهري المقدّر",
    rights: "حقوق المستأجر والقواعد",
    mock: "بيانات مرجعية تجريبية — تحقق من الجهة المحلية.",
  },
} as const;

export type TKey = keyof typeof dict.en;
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict.en[k],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const s = sessionStorage.getItem("clausecheck-lang");
    if (s === "ar" || s === "en") setLang(s);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    sessionStorage.setItem("clausecheck-lang", lang);
  }, [lang]);
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[lang][k] }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
