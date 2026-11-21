import { L, InputError, type Tool, type Note } from "../core/types";
import { tex } from "../core/units";
import { tsat, saturation, T_SAT_MAX } from "../physics/iapws97";
import { ANTOINE, antoineP, antoineT } from "../physics/antoine";
import { psychro, R_GAS } from "../physics/correlations";

export const steam: Tool = {
  id: "steam", category: "thermo",
  name: L("Saturated steam table", "جدول البخار المشبع"),
  summary: L("Saturation pressure or temperature with liquid and vapour v, h, s (IAPWS-IF97).", "ضغط أو درجة حرارة التشبع مع v وh وs للسائل والبخار (IAPWS-IF97)."),
  inputs: [
    { id: "T", label: L("Temperature", "درجة الحرارة"), sym: "T", dim: "temperature", value: 100, unit: "degC", when: { choice: "given", value: "T" } },
    { id: "p", label: L("Pressure (absolute)", "الضغط (المطلق)"), sym: "p", dim: "pressure", value: 10, unit: "bar", min: 0, when: { choice: "given", value: "p" } },
  ],
  choices: [{ id: "given", label: L("Given", "المعطى"), value: "T", options: [{ value: "T", label: L("Temperature", "درجة الحرارة") }, { value: "p", label: L("Pressure", "الضغط") }] }],
  compute({ T, p }, { given }) {
    const TK = given === "T" ? T : tsat(p / 1e6);
    if (given === "p" && !(p >= 611.213 && p <= 16.529e6)) throw new InputError(L("Pressure must be between 611 Pa and 165.3 bar (saturation up to 350 °C).", "يجب أن يكون الضغط بين 611 باسكال و165.3 بار (التشبع حتى 350 °م)."));
    if (!(TK >= 273.16 && TK <= T_SAT_MAX)) throw new InputError(L("Temperature must be between 0.01 °C and 350 °C (this tool covers IF97 regions 1, 2 and 4).", "يجب أن تكون درجة الحرارة بين 0.01 و350 °م (تغطي هذه الأداة المناطق 1 و2 و4 من IF97)."));
    const s = saturation(TK), P = s.p * 1e6, kJ = 1e3;
    const hfg = s.vap.h - s.liq.h;
    return {
      results: [
        given === "T"
          ? { id: "p", label: L("Saturation pressure", "ضغط التشبع"), sym: "p_{sat}", value: P, dim: "pressure", unit: "bar", main: true }
          : { id: "T", label: L("Saturation temperature", "درجة حرارة التشبع"), sym: "T_{sat}", value: TK, dim: "temperature", unit: "degC", main: true },
        { id: "hfg", label: L("Latent heat of vaporisation", "الحرارة الكامنة للتبخر"), sym: "h_{fg}", value: hfg * kJ, dim: "specEnergy", unit: "kJ/kg", main: true },
        { id: "hf", label: L("Liquid enthalpy", "إنثالبي السائل"), sym: "h_f", value: s.liq.h * kJ, dim: "specEnergy", unit: "kJ/kg" },
        { id: "hg", label: L("Vapour enthalpy", "إنثالبي البخار"), sym: "h_g", value: s.vap.h * kJ, dim: "specEnergy", unit: "kJ/kg" },
        { id: "sf", label: L("Liquid entropy", "إنتروبي السائل"), sym: "s_f", value: s.liq.s * kJ, dim: "specEntropy", unit: "kJ/kg.K" },
        { id: "sg", label: L("Vapour entropy", "إنتروبي البخار"), sym: "s_g", value: s.vap.s * kJ, dim: "specEntropy", unit: "kJ/kg.K" },
        { id: "vf", label: L("Liquid specific volume", "الحجم النوعي للسائل"), sym: "v_f", value: s.liq.v, dim: "specVolume", unit: "m3/kg" },
        { id: "vg", label: L("Vapour specific volume", "الحجم النوعي للبخار"), sym: "v_g", value: s.vap.v, dim: "specVolume", unit: "m3/kg" },
      ],
      steps: [
        given === "T"
          ? { text: L("Region 4 saturation equation, solved for p", "معادلة التشبع للمنطقة 4، محلولة لإيجاد p"), tex: `p_{sat}(T=${tex(TK)}\\,\\text{K})=${tex(s.p, 6)}\\;\\text{MPa}` }
          : { text: L("Region 4 saturation equation, solved for T", "معادلة التشبع للمنطقة 4، محلولة لإيجاد T"), tex: `T_{sat}(p=${tex(p / 1e6, 6)}\\,\\text{MPa})=${tex(TK, 6)}\\;\\text{K}=${tex(TK - 273.15, 5)}\\,^{\\circ}\\text{C}` },
        { text: L("Saturated liquid from the region 1 Gibbs equation, vapour from region 2", "السائل المشبع من معادلة غيبس للمنطقة 1، والبخار من المنطقة 2"), tex: `h_f=${tex(s.liq.h, 6)},\\quad h_g=${tex(s.vap.h, 6)}\\;\\text{kJ/kg}` },
        { text: L("Latent heat", "الحرارة الكامنة"), tex: `h_{fg}=h_g-h_f=${tex(hfg, 6)}\\;\\text{kJ/kg}` },
      ],
      notes: [{ kind: "info", text: L("Verified against the official IAPWS-IF97 test values to 8 significant figures.", "تم التحقق منها مقابل قيم الاختبار الرسمية لـ IAPWS-IF97 حتى 8 أرقام معنوية.") }],
    };
  },
  references: ["IAPWS R7-97(2012), Revised Release on the IAPWS Industrial Formulation 1997"],
};

export const antoine: Tool = {
  id: "antoine", category: "thermo",
  name: L("Vapour pressure (Antoine)", "ضغط البخار (معادلة أنطوان)"),
  summary: L("Vapour pressure or boiling point of 15 common compounds.", "ضغط البخار أو نقطة الغليان لـ 15 مركبًا شائعًا."),
  inputs: [
    { id: "T", label: L("Temperature", "درجة الحرارة"), sym: "T", dim: "temperature", value: 50, unit: "degC", when: { choice: "solve", value: "P" } },
    { id: "P", label: L("Pressure", "الضغط"), sym: "P", dim: "pressure", value: 1, unit: "atm", min: 0, when: { choice: "solve", value: "T" } },
  ],
  choices: [
    { id: "compound", label: L("Compound", "المركّب"), value: "ethanol", options: ANTOINE.map(c => ({ value: c.id, label: { en: `${c.name.en} (${c.formula})`, ar: `${c.name.ar} (${c.formula})` } })) },
    { id: "solve", label: L("Find", "أوجد"), value: "P", options: [{ value: "P", label: L("Vapour pressure at T", "ضغط البخار عند T") }, { value: "T", label: L("Boiling point at P", "نقطة الغليان عند P") }] },
  ],
  compute({ T, P }, { compound, solve }) {
    const c = ANTOINE.find(x => x.id === compound)!;
    const notes: Note[] = [];
    const eqn = `\\log_{10}P[\\text{mmHg}]=A-\\frac{B}{T[^{\\circ}\\text{C}]+C},\\quad A=${c.A},\\;B=${c.B},\\;C=${c.C}`;
    let tC: number, pmm: number;
    if (solve === "P") { tC = T - 273.15; pmm = antoineP(c, tC); } else { if (!(P > 0)) throw new InputError(L("Pressure must be positive.", "يجب أن يكون الضغط موجبًا.")); pmm = P / 133.322387415; tC = antoineT(c, pmm); }
    if (tC < c.tmin - 1e-9 || tC > c.tmax + 1e-9) notes.push({ kind: "warn", text: L(`Outside the fitted range (${c.tmin} to ${c.tmax} °C): the result is an extrapolation.`, `خارج نطاق المطابقة (${c.tmin} إلى ${c.tmax} °م): النتيجة استقراء.`) });
    return {
      results: solve === "P"
        ? [{ id: "P", label: L("Vapour pressure", "ضغط البخار"), sym: "P^{sat}", value: pmm * 133.322387415, dim: "pressure", unit: "kPa", main: true }]
        : [{ id: "T", label: L("Boiling point", "نقطة الغليان"), sym: "T_b", value: tC + 273.15, dim: "temperature", unit: "degC", main: true }],
      steps: [
        { text: L(`Antoine constants for ${c.name.en}`, `ثوابت أنطوان لـ ${c.name.ar}`), tex: eqn },
        solve === "P"
          ? { text: L("Substitute T in °C", "عوّض T بالدرجة المئوية"), tex: `\\log_{10}P=${c.A}-\\frac{${c.B}}{${tex(tC)}+${c.C}}=${tex(Math.log10(pmm), 5)}\\;\\Rightarrow\\;P=${tex(pmm)}\\;\\text{mmHg}` }
          : { text: L("Rearranged for T", "بإعادة الترتيب لإيجاد T"), tex: `T=\\frac{B}{A-\\log_{10}P}-C=\\frac{${c.B}}{${c.A}-\\log_{10}${tex(pmm)}}-${c.C}=${tex(tC)}\\,^{\\circ}\\text{C}` },
      ],
      notes,
    };
  },
  references: ["Felder, R.M. & Rousseau, R.W., Elementary Principles of Chemical Processes, Table B.4"],
};

export const idealGas: Tool = {
  id: "ideal-gas", category: "thermo",
  name: L("Ideal gas law", "قانون الغاز المثالي"),
  summary: L("Solve PV = nRT for any one variable, plus gas density.", "حل PV = nRT لأي متغير، مع كثافة الغاز."),
  inputs: [
    { id: "P", label: L("Pressure", "الضغط"), sym: "P", dim: "pressure", value: 1, unit: "atm", min: 0, when: { choice: "solve", value: ["V", "n", "T"] } },
    { id: "V", label: L("Volume", "الحجم"), sym: "V", dim: "volume", value: 22.414, unit: "L", min: 0, when: { choice: "solve", value: ["P", "n", "T"] } },
    { id: "n", label: L("Amount", "كمية المادة"), sym: "n", dim: "amount", value: 1, unit: "mol", min: 0, when: { choice: "solve", value: ["P", "V", "T"] } },
    { id: "T", label: L("Temperature", "درجة الحرارة"), sym: "T", dim: "temperature", value: 0, unit: "degC", when: { choice: "solve", value: ["P", "V", "n"] } },
    { id: "M", label: L("Molar mass (for density)", "الكتلة المولية (للكثافة)"), sym: "M", dim: "molarMass", value: 28.96, unit: "g/mol", min: 0, hint: L("Air 28.96, N₂ 28.01, O₂ 32.00, CO₂ 44.01, CH₄ 16.04, H₂ 2.016", "الهواء 28.96، N₂ 28.01، O₂ 32.00، CO₂ 44.01، CH₄ 16.04، H₂ 2.016") },
  ],
  choices: [{ id: "solve", label: L("Solve for", "أوجد"), value: "V", options: [
    { value: "P", label: L("Pressure P", "الضغط P") }, { value: "V", label: L("Volume V", "الحجم V") }, { value: "n", label: L("Amount n", "الكمية n") }, { value: "T", label: L("Temperature T", "درجة الحرارة T") }] }],
  compute(v, { solve }) {
    let { P, V, n, T } = v; const R = R_GAS;
    const pos = (x: number) => x > 0;
    let step: string;
    if (solve === "P") { if (!(pos(V) && pos(n) && pos(T))) throw bad(); P = (n * R * T) / V; step = `P=\\frac{nRT}{V}=\\frac{${tex(n)}\\times8.314\\times${tex(T)}}{${tex(V)}}=${tex(P)}\\;\\text{Pa}`; }
    else if (solve === "V") { if (!(pos(P) && pos(n) && pos(T))) throw bad(); V = (n * R * T) / P; step = `V=\\frac{nRT}{P}=\\frac{${tex(n)}\\times8.314\\times${tex(T)}}{${tex(P)}}=${tex(V)}\\;\\text{m}^3`; }
    else if (solve === "n") { if (!(pos(P) && pos(V) && pos(T))) throw bad(); n = (P * V) / (R * T); step = `n=\\frac{PV}{RT}=\\frac{${tex(P)}\\times${tex(V)}}{8.314\\times${tex(T)}}=${tex(n)}\\;\\text{mol}`; }
    else { if (!(pos(P) && pos(V) && pos(n))) throw bad(); T = (P * V) / (n * R); step = `T=\\frac{PV}{nR}=\\frac{${tex(P)}\\times${tex(V)}}{${tex(n)}\\times8.314}=${tex(T)}\\;\\text{K}`; }
    const rho = (P * v.M) / (R * T);
    const main = { P: { id: "P", label: L("Pressure", "الضغط"), sym: "P", value: P, dim: "pressure" as const, unit: "bar" }, V: { id: "V", label: L("Volume", "الحجم"), sym: "V", value: V, dim: "volume" as const, unit: "L" },
      n: { id: "n", label: L("Amount", "كمية المادة"), sym: "n", value: n, dim: "amount" as const, unit: "mol" }, T: { id: "T", label: L("Temperature", "درجة الحرارة"), sym: "T", value: T, dim: "temperature" as const, unit: "degC" } }[solve as "P" | "V" | "n" | "T"];
    return {
      results: [{ ...main, main: true }, { id: "rho", label: L("Gas density", "كثافة الغاز"), sym: "\\rho", value: rho, dim: "density", unit: "kg/m3" }],
      steps: [
        { text: L("Ideal gas law in SI units, R = 8.314 J/(mol·K)", "قانون الغاز المثالي بوحدات النظام الدولي، R = 8.314 جول/(مول·كلفن)"), tex: step },
        { text: L("Density from the molar mass", "الكثافة من الكتلة المولية"), tex: `\\rho=\\frac{PM}{RT}=\\frac{${tex(P)}\\times${tex(v.M)}}{8.314\\times${tex(T)}}=${tex(rho)}\\;\\text{kg/m}^3` },
      ],
      notes: [{ kind: "info", text: L("Accurate for gases well above their critical temperature and at low pressure (≲ 10 bar).", "دقيق للغازات فوق درجة حرارتها الحرجة بكثير وعند ضغط منخفض (≲ 10 بار).") }],
    };
    function bad() { return new InputError(L("The given quantities must be positive (temperature in absolute terms).", "يجب أن تكون الكميات المعطاة موجبة (ودرجة الحرارة مطلقة).")); }
  },
  references: ["Smith, Van Ness & Abbott, Introduction to Chemical Engineering Thermodynamics, ch. 3"],
};

export const psychrometrics: Tool = {
  id: "psychro", category: "thermo",
  name: L("Psychrometrics (moist air)", "خواص الهواء الرطب"),
  summary: L("Humidity ratio, dew point, enthalpy and specific volume of moist air.", "نسبة الرطوبة ونقطة الندى والإنثالبي والحجم النوعي للهواء الرطب."),
  inputs: [
    { id: "t", label: L("Dry-bulb temperature", "درجة حرارة البصيلة الجافة"), sym: "t", dim: "temperature", value: 30, unit: "degC" },
    { id: "RH", label: L("Relative humidity", "الرطوبة النسبية"), sym: "\\phi", dim: "none", value: 0.6, unit: "-", min: 0, max: 1, hint: L("As a fraction: 0.60 = 60 %", "ككسر عشري: 0.60 = 60 %") },
    { id: "p", label: L("Total pressure", "الضغط الكلي"), sym: "p", dim: "pressure", value: 101.325, unit: "kPa", min: 0, hint: L("Sea level 101.325 kPa; Arar (≈ 550 m) ≈ 95 kPa", "عند مستوى سطح البحر 101.325 كيلوباسكال؛ عرعر (≈ 550 م) ≈ 95 كيلوباسكال") },
  ],
  compute({ t, RH, p }) {
    const tC = t - 273.15;
    if (!(RH >= 0 && RH <= 1)) throw new InputError(L("Relative humidity must be between 0 and 1.", "يجب أن تكون الرطوبة النسبية بين 0 و1."));
    if (!(tC >= 0.01 && tC <= 100)) throw new InputError(L("Dry-bulb temperature must be between 0.01 and 100 °C.", "يجب أن تكون درجة الحرارة بين 0.01 و100 °م."));
    const r = psychro(tC, RH, p);
    if (!(r.pw < p)) throw new InputError(L("Vapour pressure exceeds total pressure.", "ضغط البخار يتجاوز الضغط الكلي."));
    const notes: Note[] = Number.isNaN(r.dew) ? [{ kind: "info", text: L("Dew point is below 0 °C (frost point); not computed.", "نقطة الندى أقل من 0 °م (نقطة الصقيع)؛ لم تُحسب.") }] : [];
    return {
      results: [
        { id: "W", label: L("Humidity ratio", "نسبة الرطوبة"), sym: "W", value: r.W, dim: "humidity", unit: "g/kg", main: true },
        { id: "dew", label: L("Dew point", "نقطة الندى"), sym: "t_{dp}", value: r.dew + 273.15, dim: "temperature", unit: "degC", main: true },
        { id: "h", label: L("Enthalpy (per kg dry air)", "الإنثالبي (لكل كغ هواء جاف)"), sym: "h", value: r.h * 1000, dim: "specEnergy", unit: "kJ/kg" },
        { id: "v", label: L("Specific volume (per kg dry air)", "الحجم النوعي (لكل كغ هواء جاف)"), sym: "v", value: r.v, dim: "specVolume", unit: "m3/kg" },
        { id: "pw", label: L("Water vapour partial pressure", "الضغط الجزئي لبخار الماء"), sym: "p_w", value: r.pw, dim: "pressure", unit: "kPa" },
      ],
      steps: [
        { text: L("Saturation pressure of water at t (IAPWS-IF97)", "ضغط تشبع الماء عند t (IAPWS-IF97)"), tex: `p_{ws}=${tex(r.pwsat)}\\;\\text{Pa}` },
        { text: L("Vapour partial pressure", "الضغط الجزئي للبخار"), tex: `p_w=\\phi\\,p_{ws}=${tex(RH)}\\times${tex(r.pwsat)}=${tex(r.pw)}\\;\\text{Pa}` },
        { text: L("Humidity ratio (g water per kg dry air)", "نسبة الرطوبة (غ ماء لكل كغ هواء جاف)"), tex: `W=0.621945\\,\\frac{p_w}{p-p_w}=${tex(r.W, 5)}\\;\\text{kg/kg}=${tex(r.W * 1000)}\\;\\text{g/kg}` },
        { text: L("Enthalpy", "الإنثالبي"), tex: `h=1.006\\,t+W(2501+1.86\\,t)=${tex(r.h)}\\;\\text{kJ/kg}` },
        { text: L("Dew point: saturation temperature at p_w", "نقطة الندى: درجة حرارة التشبع عند p_w"), tex: `t_{dp}=T_{sat}(p_w)=${tex(r.dew)}\\,^{\\circ}\\text{C}` },
      ],
      notes,
    };
  },
  references: ["ASHRAE Handbook – Fundamentals (2017), ch. 1, Psychrometrics"],
};
