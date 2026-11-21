import type { L10n } from "./core/types";

export type Lang = "en" | "ar";
export const tr = (x: L10n, lang: Lang) => x[lang] || x.en;

const S = {
  brand: { en: "ChemE Toolkit", ar: "أدوات الهندسة الكيميائية" },
  tagline: { en: "Engineering calculations with units, and the worked solution behind every answer.", ar: "حسابات هندسية بالوحدات، مع الحل خطوة بخطوة لكل نتيجة." },
  search: { en: "Search tools: Reynolds, steam, LMTD…", ar: "ابحث عن أداة: رينولدز، البخار، LMTD…" },
  tools: { en: "tools", ar: "أداة" },
  calc: { en: "Unit calculator", ar: "الحاسبة بالوحدات" },
  calcDesc: { en: "Type any expression with units: conversions, constants, quick estimates.", ar: "اكتب أي تعبير بالوحدات: تحويلات، ثوابت، تقديرات سريعة." },
  home: { en: "All tools", ar: "كل الأدوات" },
  inputs: { en: "Inputs", ar: "المُدخلات" },
  results: { en: "Results", ar: "النتائج" },
  solution: { en: "Worked solution", ar: "الحل خطوة بخطوة" },
  references: { en: "References", ar: "المراجع" },
  share: { en: "Copy link", ar: "نسخ الرابط" },
  copied: { en: "Link copied ✓", ar: "تم نسخ الرابط ✓" },
  reset: { en: "Reset", ar: "إعادة الضبط" },
  addRow: { en: "Add row", ar: "إضافة صف" },
  remove: { en: "Remove", ar: "حذف" },
  noMatch: { en: "No tool matches your search.", ar: "لا توجد أداة تطابق بحثك." },
  invalid: { en: "Enter a number", ar: "أدخل رقمًا" },
  error: { en: "Check the inputs", ar: "راجع المُدخلات" },
  theme: { en: "Light / dark", ar: "فاتح / داكن" },
  offline: { en: "Works offline once opened", ar: "يعمل دون اتصال بعد فتحه مرة" },
  footer: { en: "Open-source teaching tool by Dr. Aboulbaba Eladeb, Chemical Engineering, Northern Border University.", ar: "أداة تعليمية مفتوحة المصدر من د. أبولبابة الأدب، الهندسة الكيميائية، جامعة الحدود الشمالية." },
  verify: { en: "Always check results against your own judgement and design codes.", ar: "تحقّق دائمًا من النتائج بحكمك الهندسي ومعايير التصميم." },
  calcPh: { en: "e.g. 2.5 bar * 30 L/min to kW", ar: "مثال: 2.5 bar * 30 L/min to kW" },
  examples: { en: "Examples", ar: "أمثلة" },
  answer: { en: "Answer", ar: "الناتج" },
  inSI: { en: "In SI base units", ar: "بوحدات النظام الدولي الأساسية" },
  calcHelp: { en: "Use “to” to convert (… to kW). Constants: gasConstant, gravity, avogadro, speedOfLight, boltzmann, faraday.", ar: "استخدم “to” للتحويل (… to kW). الثوابت: gasConstant وgravity وavogadro وspeedOfLight وboltzmann وfaraday." },
} satisfies Record<string, L10n>;

export type Key = keyof typeof S;
export const t = (k: Key, lang: Lang) => S[k][lang];
