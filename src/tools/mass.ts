import { L, InputError, type Tool } from "../core/types";
import { tex, fmt } from "../core/units";
import { rachfordRice, R_GAS } from "../physics/correlations";

export const flash: Tool = {
  id: "flash", category: "mass",
  name: L("Isothermal flash (Rachford–Rice)", "التبخير الوميضي متساوي الحرارة (راتشفورد-رايس)"),
  summary: L("Vapour fraction and phase compositions from feed composition and K-values.", "كسر البخار وتراكيب الطورين من تركيب التغذية وقيم K."),
  inputs: [],
  table: {
    id: "comp", label: L("Components", "المكوّنات"), minRows: 2, maxRows: 8, nameColumn: "name",
    columns: [{ id: "name", label: L("Component", "المكوّن"), sym: "" }, { id: "z", label: L("Feed mole fraction z", "الكسر المولي في التغذية z"), sym: "z_i" }, { id: "K", label: L("K-value (y/x)", "قيمة K (y/x)"), sym: "K_i" }],
    rows: [{ name: "Propane", z: 0.3, K: 2.8 }, { name: "n-Butane", z: 0.4, K: 0.95 }, { name: "n-Pentane", z: 0.3, K: 0.32 }],
  },
  compute(_si, _c, rows = []) {
    const z0 = rows.map(r => Number(r.z)), K = rows.map(r => Number(r.K));
    if (rows.length < 2 || z0.some(x => !(x >= 0)) || K.some(k => !(k > 0))) throw new InputError(L("Each component needs z ≥ 0 and K > 0.", "يحتاج كل مكوّن إلى z ≥ 0 وK > 0."));
    const sz = z0.reduce((a, b) => a + b, 0);
    if (!(sz > 0)) throw new InputError(L("Feed mole fractions cannot all be zero.", "لا يمكن أن تكون الكسور المولية كلها صفرًا."));
    const z = z0.map(x => x / sz);
    const r = rachfordRice(z, K);
    const sumzK = z.reduce((s, zi, i) => s + zi * K[i], 0), sumzOverK = z.reduce((s, zi, i) => s + zi / K[i], 0);
    const steps = [
      ...(Math.abs(sz - 1) > 1e-9 ? [{ text: L(`Feed fractions normalised (they summed to ${fmt(sz)})`, `تم تطبيع كسور التغذية (كان مجموعها ${fmt(sz)})`), tex: `z_i\\leftarrow z_i/\\sum z_i` }] : []),
      { text: L("Phase check: two phases exist only if Σz·K > 1 (above bubble point) and Σz/K > 1 (below dew point)", "فحص الأطوار: يوجد طوران فقط إذا كان Σz·K > 1 (فوق نقطة الفقاعة) وΣz/K > 1 (تحت نقطة الندى)"), tex: `\\sum z_iK_i=${tex(sumzK)},\\qquad \\sum z_i/K_i=${tex(sumzOverK)}` },
    ];
    if (r.state === "two-phase") steps.push({ text: L(`Rachford–Rice equation, solved by safeguarded Newton (${r.iters.length - 1} iterations)`, `معادلة راتشفورد-رايس بطريقة نيوتن المحمية (${r.iters.length - 1} تكرارات)`), tex: `\\sum_i\\frac{z_i(K_i-1)}{1+\\psi(K_i-1)}=0\\;\\Rightarrow\\;\\psi=V/F=${tex(r.psi, 5)}` },
      { text: L("Phase compositions", "تراكيب الطورين"), tex: `x_i=\\frac{z_i}{1+\\psi(K_i-1)},\\qquad y_i=K_i\\,x_i` });
    const stateNote = r.state === "subcooled" ? L("Σz·K ≤ 1: the feed is below its bubble point and stays all liquid.", "Σz·K ≤ 1: التغذية دون نقطة الفقاعة وتبقى سائلة بالكامل.")
      : r.state === "superheated" ? L("Σz/K ≤ 1: the feed is above its dew point and is all vapour.", "Σz/K ≤ 1: التغذية فوق نقطة الندى وهي بخار بالكامل.") : null;
    return {
      results: [
        { id: "psi", label: L("Vapour fraction V/F", "كسر البخار V/F"), sym: "\\psi", value: r.psi, dim: "none", unit: "-", main: true },
        { id: "liq", label: L("Liquid fraction L/F", "كسر السائل L/F"), sym: "1-\\psi", value: 1 - r.psi, dim: "none", unit: "-" },
      ],
      steps,
      notes: stateNote ? [{ kind: "info", text: stateNote }] : [],
      table: { columns: [L("Component", "المكوّن"), L("z", "z"), L("K", "K"), L("Liquid x", "السائل x"), L("Vapour y", "البخار y")],
        rows: rows.map((row, i) => [String(row.name || `#${i + 1}`), fmt(z[i]), fmt(K[i]), fmt(r.x[i]), fmt(r.y[i])]) },
    };
  },
  references: ["Rachford, H.H. & Rice, J.D. (1952) J. Petroleum Technology 4(10), 19", "Seader, Henley & Roper, Separation Process Principles, ch. 4"],
};

export const arrhenius: Tool = {
  id: "arrhenius", category: "reaction",
  name: L("Arrhenius rate constant", "ثابت معدل التفاعل (أرينيوس)"),
  summary: L("Rate constant at a new temperature, or the activation energy from two measurements.", "ثابت المعدل عند درجة حرارة جديدة، أو طاقة التنشيط من قياسين."),
  inputs: [
    { id: "k1", label: L("Rate constant at T₁", "ثابت المعدل عند T₁"), sym: "k_1", dim: "rateConst", value: 0.002, unit: "1/s", min: 0 },
    { id: "T1", label: L("Temperature T₁", "درجة الحرارة T₁"), sym: "T_1", dim: "temperature", value: 50, unit: "degC" },
    { id: "T2", label: L("Temperature T₂", "درجة الحرارة T₂"), sym: "T_2", dim: "temperature", value: 80, unit: "degC" },
    { id: "Ea", label: L("Activation energy", "طاقة التنشيط"), sym: "E_a", dim: "molarEnergy", value: 75, unit: "kJ/mol", min: 0, when: { choice: "solve", value: "k2" } },
    { id: "k2", label: L("Rate constant at T₂", "ثابت المعدل عند T₂"), sym: "k_2", dim: "rateConst", value: 0.02, unit: "1/s", min: 0, when: { choice: "solve", value: "Ea" } },
  ],
  choices: [{ id: "solve", label: L("Find", "أوجد"), value: "k2", options: [{ value: "k2", label: L("k at T₂ (Eₐ known)", "k عند T₂ (Eₐ معلومة)") }, { value: "Ea", label: L("Eₐ from two rate constants", "Eₐ من ثابتَي معدل") }] }],
  compute({ k1, T1, T2, Ea, k2 }, { solve }) {
    if (!(T1 > 0 && T2 > 0 && k1 > 0)) throw new InputError(L("Temperatures and k₁ must be positive.", "يجب أن تكون درجات الحرارة وk₁ موجبة."));
    const inv = 1 / T2 - 1 / T1;
    if (solve === "k2") {
      const kk = k1 * Math.exp((-Ea / R_GAS) * inv), A = k1 * Math.exp(Ea / (R_GAS * T1));
      return {
        results: [
          { id: "k2", label: L("Rate constant at T₂", "ثابت المعدل عند T₂"), sym: "k_2", value: kk, dim: "rateConst", unit: "1/s", main: true },
          { id: "ratio", label: L("Speed-up factor k₂/k₁", "عامل التسريع k₂/k₁"), sym: "k_2/k_1", value: kk / k1, dim: "none", unit: "-" },
          { id: "A", label: L("Pre-exponential factor", "العامل قبل الأسّي"), sym: "A", value: A, dim: "rateConst", unit: "1/s" },
        ],
        steps: [
          { text: L("Two-point Arrhenius form (temperatures in K)", "صيغة أرينيوس بنقطتين (درجات الحرارة بالكلفن)"), tex: `\\ln\\frac{k_2}{k_1}=-\\frac{E_a}{R}\\left(\\frac{1}{T_2}-\\frac{1}{T_1}\\right)=-\\frac{${tex(Ea)}}{8.314}\\left(\\frac{1}{${tex(T2)}}-\\frac{1}{${tex(T1)}}\\right)=${tex(Math.log(kk / k1))}` },
          { text: L("Rate constant at T₂", "ثابت المعدل عند T₂"), tex: `k_2=${tex(k1)}\\times e^{${tex(Math.log(kk / k1))}}=${tex(kk)}\\;\\text{s}^{-1}` },
          { text: L("Pre-exponential factor", "العامل قبل الأسّي"), tex: `A=k_1\\,e^{E_a/RT_1}=${tex(A)}\\;\\text{s}^{-1}` },
        ],
      };
    }
    if (!(k2 > 0)) throw new InputError(L("k₂ must be positive.", "يجب أن يكون k₂ موجبًا."));
    if (Math.abs(inv) < 1e-12) throw new InputError(L("T₁ and T₂ must differ.", "يجب أن تختلف T₁ عن T₂."));
    const E = (-R_GAS * Math.log(k2 / k1)) / inv;
    return {
      results: [{ id: "Ea", label: L("Activation energy", "طاقة التنشيط"), sym: "E_a", value: E, dim: "molarEnergy", unit: "kJ/mol", main: true }],
      steps: [{ text: L("Rearranged two-point Arrhenius form", "صيغة أرينيوس بنقطتين بعد إعادة الترتيب"), tex: `E_a=\\frac{-R\\ln(k_2/k_1)}{1/T_2-1/T_1}=\\frac{-8.314\\times\\ln(${tex(k2)}/${tex(k1)})}{1/${tex(T2)}-1/${tex(T1)}}=${tex(E)}\\;\\text{J/mol}` }],
      notes: E < 0 ? [{ kind: "warn", text: L("Negative activation energy: check that the larger k belongs to the higher temperature.", "طاقة تنشيط سالبة: تحقق من أن قيمة k الأكبر تقابل درجة الحرارة الأعلى.") }] : [],
    };
  },
  references: ["Fogler, H.S., Elements of Chemical Reaction Engineering, ch. 3"],
};
