import { L, InputError, type Tool, type Note } from "../core/types";
import { tex } from "../core/units";
import { lmtd, effectiveness, dittusBoelter, gnielinski } from "../physics/correlations";

const FLOW = { id: "flow", label: L("Flow arrangement", "ترتيب الجريان"), value: "counter",
  options: [{ value: "counter", label: L("Counter-flow", "جريان معاكس") }, { value: "parallel", label: L("Parallel (co-current)", "جريان متوازٍ") }] };

export const lmtdTool: Tool = {
  id: "lmtd", category: "heat",
  name: L("LMTD & exchanger area", "فرق درجات الحرارة اللوغاريتمي ومساحة المبادل"),
  summary: L("Log-mean temperature difference, and the area needed for a duty Q at a given U.", "متوسط الفرق اللوغاريتمي لدرجات الحرارة، والمساحة اللازمة لحمل حراري Q عند معامل U معطى."),
  inputs: [
    { id: "Thi", label: L("Hot inlet", "مدخل الساخن"), sym: "T_{h,in}", dim: "temperature", value: 150, unit: "degC" },
    { id: "Tho", label: L("Hot outlet", "مخرج الساخن"), sym: "T_{h,out}", dim: "temperature", value: 90, unit: "degC" },
    { id: "Tci", label: L("Cold inlet", "مدخل البارد"), sym: "T_{c,in}", dim: "temperature", value: 30, unit: "degC" },
    { id: "Tco", label: L("Cold outlet", "مخرج البارد"), sym: "T_{c,out}", dim: "temperature", value: 70, unit: "degC" },
    { id: "Q", label: L("Heat duty", "الحمل الحراري"), sym: "Q", dim: "power", value: 250, unit: "kW", min: 0 },
    { id: "U", label: L("Overall coefficient", "المعامل الكلي لانتقال الحرارة"), sym: "U", dim: "htc", value: 500, unit: "W/m2.K", min: 0, hint: L("Water–water ≈ 800–1500, water–oil ≈ 100–350, steam condensing on water ≈ 1000–3500 W/(m²·K)", "ماء-ماء ≈ 800–1500، ماء-زيت ≈ 100–350، بخار يتكثف على ماء ≈ 1000–3500 واط/(م²·كلفن)") },
  ],
  choices: [FLOW],
  compute({ Thi, Tho, Tci, Tco, Q, U }, { flow }) {
    const counter = flow === "counter";
    const dT1 = counter ? Thi - Tco : Thi - Tci, dT2 = counter ? Tho - Tci : Tho - Tco;
    if (dT1 <= 0 || dT2 <= 0) throw new InputError(L("Temperature cross: a terminal temperature difference is zero or negative. Check the temperatures or the flow arrangement.", "تقاطع في درجات الحرارة: أحد فروق الأطراف صفر أو سالب. راجع درجات الحرارة أو ترتيب الجريان."));
    const LM = lmtd(dT1, dT2), A = Q / (U * LM);
    return {
      results: [
        { id: "lmtd", label: L("Log-mean temperature difference", "الفرق اللوغاريتمي المتوسط"), sym: "\\Delta T_{lm}", value: LM, dim: "deltaT", unit: "K", main: true },
        { id: "A", label: L("Required heat-transfer area", "مساحة انتقال الحرارة اللازمة"), sym: "A", value: A, dim: "area", unit: "m2", main: true },
        { id: "dT1", label: L("Terminal difference 1", "فرق الطرف 1"), sym: "\\Delta T_1", value: dT1, dim: "deltaT", unit: "K" },
        { id: "dT2", label: L("Terminal difference 2", "فرق الطرف 2"), sym: "\\Delta T_2", value: dT2, dim: "deltaT", unit: "K" },
      ],
      steps: [
        { text: counter ? L("Counter-flow terminal differences", "فروق الأطراف للجريان المعاكس") : L("Parallel-flow terminal differences", "فروق الأطراف للجريان المتوازي"),
          tex: counter ? `\\Delta T_1=T_{h,in}-T_{c,out}=${tex(dT1)}\\;\\text{K},\\quad \\Delta T_2=T_{h,out}-T_{c,in}=${tex(dT2)}\\;\\text{K}`
            : `\\Delta T_1=T_{h,in}-T_{c,in}=${tex(dT1)}\\;\\text{K},\\quad \\Delta T_2=T_{h,out}-T_{c,out}=${tex(dT2)}\\;\\text{K}` },
        { text: L("Log-mean temperature difference", "الفرق اللوغاريتمي المتوسط"), tex: `\\Delta T_{lm}=\\frac{\\Delta T_1-\\Delta T_2}{\\ln(\\Delta T_1/\\Delta T_2)}=\\frac{${tex(dT1)}-${tex(dT2)}}{\\ln(${tex(dT1)}/${tex(dT2)})}=${tex(LM)}\\;\\text{K}` },
        { text: L("Area from the design equation Q = U·A·ΔT_lm", "المساحة من معادلة التصميم Q = U·A·ΔT_lm"), tex: `A=\\frac{Q}{U\\,\\Delta T_{lm}}=\\frac{${tex(Q)}}{${tex(U)}\\times${tex(LM)}}=${tex(A)}\\;\\text{m}^2` },
      ],
      notes: [{ kind: "info", text: L("For shell-and-tube exchangers with several passes, multiply ΔT_lm by the correction factor F (≈ 0.75–1).", "لمبادلات القشرة والأنابيب متعددة الممرات، اضرب ΔT_lm في معامل التصحيح F (≈ 0.75–1).") }],
    };
  },
  references: ["Incropera et al., Fundamentals of Heat and Mass Transfer, 7th ed., §11.3"],
};

export const ntu: Tool = {
  id: "ntu", category: "heat",
  name: L("Heat exchanger ε-NTU", "مبادل حراري بطريقة الفعالية-NTU"),
  summary: L("Outlet temperatures and duty of an existing exchanger (rating) from U·A.", "درجات حرارة المخارج والحمل الحراري لمبادل قائم (التقييم) من U·A."),
  inputs: [
    { id: "mh", label: L("Hot stream mass flow", "تدفق كتلة التيار الساخن"), sym: "\\dot m_h", dim: "massFlow", value: 2, unit: "kg/s", min: 0 },
    { id: "cph", label: L("Hot stream cp", "الحرارة النوعية للتيار الساخن"), sym: "c_{p,h}", dim: "cp", value: 2.1, unit: "kJ/kg.K", min: 0 },
    { id: "mc", label: L("Cold stream mass flow", "تدفق كتلة التيار البارد"), sym: "\\dot m_c", dim: "massFlow", value: 1.5, unit: "kg/s", min: 0 },
    { id: "cpc", label: L("Cold stream cp", "الحرارة النوعية للتيار البارد"), sym: "c_{p,c}", dim: "cp", value: 4.18, unit: "kJ/kg.K", min: 0 },
    { id: "Thi", label: L("Hot inlet", "مدخل الساخن"), sym: "T_{h,in}", dim: "temperature", value: 160, unit: "degC" },
    { id: "Tci", label: L("Cold inlet", "مدخل البارد"), sym: "T_{c,in}", dim: "temperature", value: 25, unit: "degC" },
    { id: "U", label: L("Overall coefficient", "المعامل الكلي"), sym: "U", dim: "htc", value: 350, unit: "W/m2.K", min: 0 },
    { id: "A", label: L("Heat-transfer area", "مساحة انتقال الحرارة"), sym: "A", dim: "area", value: 20, unit: "m2", min: 0 },
  ],
  choices: [FLOW],
  compute({ mh, cph, mc, cpc, Thi, Tci, U, A }, { flow }) {
    const Ch = mh * cph, Cc = mc * cpc;
    if (!(Ch > 0 && Cc > 0)) throw new InputError(L("Flow rates and heat capacities must be positive.", "يجب أن تكون التدفقات والسعات الحرارية موجبة."));
    if (Thi <= Tci) throw new InputError(L("The hot inlet must be hotter than the cold inlet.", "يجب أن يكون مدخل الساخن أسخن من مدخل البارد."));
    const Cmin = Math.min(Ch, Cc), Cmax = Math.max(Ch, Cc), Cr = Cmin / Cmax, N = (U * A) / Cmin;
    const eps = effectiveness(N, Cr, flow as "counter" | "parallel"), Q = eps * Cmin * (Thi - Tci);
    const Tho = Thi - Q / Ch, Tco = Tci + Q / Cc;
    const epsTex = flow === "parallel" ? `\\varepsilon=\\frac{1-e^{-NTU(1+C_r)}}{1+C_r}` : Math.abs(1 - Cr) < 1e-9 ? `\\varepsilon=\\frac{NTU}{1+NTU}` : `\\varepsilon=\\frac{1-e^{-NTU(1-C_r)}}{1-C_r\\,e^{-NTU(1-C_r)}}`;
    return {
      results: [
        { id: "Q", label: L("Heat duty", "الحمل الحراري"), sym: "Q", value: Q, dim: "power", unit: "kW", main: true },
        { id: "Tho", label: L("Hot outlet", "مخرج الساخن"), sym: "T_{h,out}", value: Tho, dim: "temperature", unit: "degC", main: true },
        { id: "Tco", label: L("Cold outlet", "مخرج البارد"), sym: "T_{c,out}", value: Tco, dim: "temperature", unit: "degC", main: true },
        { id: "eps", label: L("Effectiveness", "الفعالية"), sym: "\\varepsilon", value: eps, dim: "none", unit: "-" },
        { id: "NTU", label: L("Number of transfer units", "عدد وحدات الانتقال"), sym: "NTU", value: N, dim: "none", unit: "-" },
        { id: "Cr", label: L("Capacity ratio", "نسبة السعات"), sym: "C_r", value: Cr, dim: "none", unit: "-" },
      ],
      steps: [
        { text: L("Heat-capacity rates", "معدلات السعة الحرارية"), tex: `C_h=\\dot m_h c_{p,h}=${tex(Ch)},\\quad C_c=\\dot m_c c_{p,c}=${tex(Cc)}\\;\\text{W/K}` },
        { text: L("Capacity ratio and NTU", "نسبة السعات وعدد وحدات الانتقال"), tex: `C_r=\\frac{C_{min}}{C_{max}}=${tex(Cr)},\\qquad NTU=\\frac{UA}{C_{min}}=\\frac{${tex(U)}\\times${tex(A)}}{${tex(Cmin)}}=${tex(N)}` },
        { text: flow === "parallel" ? L("Effectiveness, parallel flow", "الفعالية، جريان متوازٍ") : L("Effectiveness, counter-flow", "الفعالية، جريان معاكس"), tex: `${epsTex}=${tex(eps)}` },
        { text: L("Duty and outlet temperatures", "الحمل الحراري ودرجات حرارة المخارج"), tex: `Q=\\varepsilon\\,C_{min}(T_{h,in}-T_{c,in})=${tex(Q)}\\;\\text{W},\\quad T_{h,out}=${tex(Tho - 273.15)}\\,^{\\circ}\\text{C},\\quad T_{c,out}=${tex(Tco - 273.15)}\\,^{\\circ}\\text{C}` },
      ],
    };
  },
  references: ["Incropera et al., Fundamentals of Heat and Mass Transfer, 7th ed., §11.4, Table 11.3"],
};

export const convection: Tool = {
  id: "convection", category: "heat",
  name: L("Tube-side heat transfer coefficient", "معامل انتقال الحرارة داخل الأنابيب"),
  summary: L("Nusselt number and h for flow inside a tube (laminar, Gnielinski, Dittus–Boelter).", "عدد نسلت ومعامل h للجريان داخل أنبوب (طبقي، غنيلينسكي، ديتوس-بولتر)."),
  inputs: [
    { id: "Re", label: L("Reynolds number", "عدد رينولدز"), sym: "Re", dim: "none", value: 50000, unit: "-", min: 1 },
    { id: "Pr", label: L("Prandtl number", "عدد براندتل"), sym: "Pr", dim: "none", value: 5.8, unit: "-", min: 0.01, hint: L("Water at 25 °C ≈ 6.1, air ≈ 0.71, light oils ≈ 50–500", "الماء عند 25 °م ≈ 6.1، الهواء ≈ 0.71، الزيوت الخفيفة ≈ 50–500") },
    { id: "k", label: L("Fluid thermal conductivity", "الموصلية الحرارية للمائع"), sym: "k", dim: "conductivity", value: 0.6, unit: "W/m.K", min: 0 },
    { id: "D", label: L("Inside diameter", "القطر الداخلي"), sym: "D", dim: "length", value: 25, unit: "mm", min: 0 },
  ],
  choices: [{ id: "mode", label: L("Fluid is being", "المائع"), value: "heating", options: [{ value: "heating", label: L("Heated", "يُسخَّن") }, { value: "cooling", label: L("Cooled", "يُبرَّد") }] }],
  compute({ Re, Pr, k, D }, { mode }) {
    if (!(D > 0)) throw new InputError(L("Diameter must be positive.", "يجب أن يكون القطر موجبًا."));
    const notes: Note[] = [];
    let Nu: number, steps;
    if (Re < 2300) {
      Nu = 3.66;
      steps = [{ text: L("Laminar, fully developed, constant wall temperature", "طبقي، مكتمل التطور، درجة حرارة جدار ثابتة"), tex: `Nu=3.66\\quad(\\text{constant heat flux: }4.36)` }];
      notes.push({ kind: "info", text: L("Laminar entrance effects can raise Nu substantially in short tubes.", "قد ترفع تأثيرات المدخل في الجريان الطبقي قيمة Nu كثيرًا في الأنابيب القصيرة.") });
    } else {
      const g = gnielinski(Re, Pr), db = dittusBoelter(Re, Pr, mode === "heating");
      Nu = g.Nu;
      steps = [
        { text: L("Gnielinski (3000 < Re < 5×10⁶), with the Petukhov friction factor", "غنيلينسكي (3000 < Re < 5×10⁶) مع معامل احتكاك بيتوخوف"), tex: `f=(0.79\\ln Re-1.64)^{-2}=${tex(g.f)},\\quad Nu=\\frac{(f/8)(Re-1000)Pr}{1+12.7\\sqrt{f/8}\\,(Pr^{2/3}-1)}=${tex(g.Nu)}` },
        { text: L("For comparison, Dittus–Boelter (Re > 10⁴)", "للمقارنة: ديتوس-بولتر (Re > 10⁴)"), tex: `Nu=0.023\\,Re^{0.8}Pr^{${mode === "heating" ? "0.4" : "0.3"}}=${tex(db)}` },
      ];
      if (Re < 3000) notes.push({ kind: "warn", text: L("Transitional flow: correlations are unreliable below Re ≈ 3000.", "جريان انتقالي: الارتباطات غير موثوقة دون Re ≈ 3000.") });
    }
    const h = (Nu * k) / D;
    steps.push({ text: L("Heat-transfer coefficient", "معامل انتقال الحرارة"), tex: `h=\\frac{Nu\\,k}{D}=\\frac{${tex(Nu)}\\times${tex(k)}}{${tex(D)}}=${tex(h)}\\;\\text{W/(m}^2\\text{K)}` });
    return {
      results: [
        { id: "h", label: L("Heat-transfer coefficient", "معامل انتقال الحرارة"), sym: "h", value: h, dim: "htc", unit: "W/m2.K", main: true },
        { id: "Nu", label: L("Nusselt number", "عدد نسلت"), sym: "Nu", value: Nu, dim: "none", unit: "-", main: true },
      ],
      steps, notes,
    };
  },
  references: ["Gnielinski, V. (1976) Int. Chem. Eng. 16, 359", "Dittus, F.W. & Boelter, L.M.K. (1930)", "Incropera et al., §8.5"],
};

export const wall: Tool = {
  id: "wall", category: "heat",
  name: L("Composite wall conduction", "التوصيل عبر جدار مركّب"),
  summary: L("Heat flow through up to three layers with optional convection on each side.", "تدفق الحرارة عبر حتى ثلاث طبقات مع حمل حراري اختياري على كل جانب."),
  inputs: [
    { id: "Ti", label: L("Inside temperature", "درجة الحرارة الداخلية"), sym: "T_i", dim: "temperature", value: 200, unit: "degC" },
    { id: "To", label: L("Outside temperature", "درجة الحرارة الخارجية"), sym: "T_o", dim: "temperature", value: 25, unit: "degC" },
    { id: "A", label: L("Wall area", "مساحة الجدار"), sym: "A", dim: "area", value: 1, unit: "m2", min: 0 },
    { id: "L1", label: L("Layer 1 thickness", "سماكة الطبقة 1"), sym: "L_1", dim: "length", value: 10, unit: "mm", min: 0 },
    { id: "k1", label: L("Layer 1 conductivity", "موصلية الطبقة 1"), sym: "k_1", dim: "conductivity", value: 45, unit: "W/m.K", min: 0, hint: L("Carbon steel ≈ 45, stainless ≈ 16, firebrick ≈ 1.0, mineral wool ≈ 0.04", "فولاذ كربوني ≈ 45، مقاوم للصدأ ≈ 16، طوب حراري ≈ 1.0، صوف صخري ≈ 0.04") },
    { id: "L2", label: L("Layer 2 thickness (0 = none)", "سماكة الطبقة 2 (0 = لا يوجد)"), sym: "L_2", dim: "length", value: 50, unit: "mm", min: 0 },
    { id: "k2", label: L("Layer 2 conductivity", "موصلية الطبقة 2"), sym: "k_2", dim: "conductivity", value: 0.04, unit: "W/m.K", min: 0 },
    { id: "L3", label: L("Layer 3 thickness (0 = none)", "سماكة الطبقة 3 (0 = لا يوجد)"), sym: "L_3", dim: "length", value: 0, unit: "mm", min: 0 },
    { id: "k3", label: L("Layer 3 conductivity", "موصلية الطبقة 3"), sym: "k_3", dim: "conductivity", value: 1, unit: "W/m.K", min: 0 },
    { id: "hi", label: L("Inside convection h (0 = ignore)", "معامل الحمل الداخلي h (0 = تجاهل)"), sym: "h_i", dim: "htc", value: 0, unit: "W/m2.K", min: 0 },
    { id: "ho", label: L("Outside convection h (0 = ignore)", "معامل الحمل الخارجي h (0 = تجاهل)"), sym: "h_o", dim: "htc", value: 10, unit: "W/m2.K", min: 0 },
  ],
  compute(v) {
    const layers = [1, 2, 3].map(i => ({ i, L: v["L" + i], k: v["k" + i] })).filter(x => x.L > 0);
    if (!layers.length) throw new InputError(L("Give at least one layer with a thickness.", "أدخل طبقة واحدة على الأقل بسماكة."));
    if (layers.some(x => !(x.k > 0)) || !(v.A > 0)) throw new InputError(L("Area and conductivities must be positive.", "يجب أن تكون المساحة والموصليات موجبة."));
    const R: { sym: string; val: number }[] = [];
    if (v.hi > 0) R.push({ sym: "1/(h_iA)", val: 1 / (v.hi * v.A) });
    layers.forEach(x => R.push({ sym: `L_${x.i}/(k_${x.i}A)`, val: x.L / (x.k * v.A) }));
    if (v.ho > 0) R.push({ sym: "1/(h_oA)", val: 1 / (v.ho * v.A) });
    const Rt = R.reduce((s, r) => s + r.val, 0), q = (v.Ti - v.To) / Rt;
    // temperature at each interface
    let T = v.Ti; const temps: string[] = [];
    R.slice(0, -1).forEach(r => { T -= q * r.val; temps.push(tex(T - 273.15)); });
    return {
      results: [
        { id: "q", label: L("Heat flow", "التدفق الحراري"), sym: "\\dot Q", value: q, dim: "power", unit: "W", main: true },
        { id: "flux", label: L("Heat flux", "كثافة التدفق الحراري"), sym: "q''", value: q / v.A, dim: "heatFlux", unit: "W/m2" },
        { id: "Rt", label: L("Total thermal resistance", "المقاومة الحرارية الكلية"), sym: "R_{tot}", value: Rt, dim: "thermalRes", unit: "K/W" },
      ],
      steps: [
        { text: L("Thermal resistances in series (K/W)", "مقاومات حرارية على التوالي (كلفن/واط)"), tex: R.map(r => `${r.sym}=${tex(r.val)}`).join(",\\;") },
        { text: L("Total resistance", "المقاومة الكلية"), tex: `R_{tot}=\\sum R=${tex(Rt)}\\;\\text{K/W}` },
        { text: L("Heat flow", "التدفق الحراري"), tex: `\\dot Q=\\frac{T_i-T_o}{R_{tot}}=\\frac{${tex(v.Ti - v.To)}}{${tex(Rt)}}=${tex(q)}\\;\\text{W}` },
        ...(temps.length ? [{ text: L("Temperatures at the interfaces, inside → outside (°C)", "درجات الحرارة عند الأسطح البينية، من الداخل إلى الخارج (°م)"), tex: temps.join("\\;\\to\\;") }] : []),
      ],
    };
  },
  references: ["Incropera et al., Fundamentals of Heat and Mass Transfer, 7th ed., §3.1"],
};
