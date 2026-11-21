import { L, InputError, type Tool, type Note } from "../core/types";
import { tex } from "../core/units";
import { darcyF, regime, swameeJain, G } from "../physics/correlations";

const regimeNote = (Re: number): Note[] => {
  const r = regime(Re);
  if (r === "transition") return [{ kind: "warn", text: L("2300 < Re < 4000: transitional flow. The friction factor is uncertain here; Colebrook is used as an estimate.", "‎2300 < Re < 4000: جريان انتقالي، ومعامل الاحتكاك غير مؤكد هنا؛ تُستخدم معادلة كولبروك كتقدير.") }];
  return [];
};
const regimeText = (Re: number) => ({ laminar: L("laminar", "طبقي"), transition: L("transitional", "انتقالي"), turbulent: L("turbulent", "مضطرب") })[regime(Re)];

export const reynolds: Tool = {
  id: "reynolds", category: "fluid",
  name: L("Reynolds number", "عدد رينولدز"),
  summary: L("Flow regime in a pipe from density, velocity, diameter and viscosity.", "نوع الجريان في الأنبوب من الكثافة والسرعة والقطر واللزوجة."),
  inputs: [
    { id: "rho", label: L("Density", "الكثافة"), sym: "\\rho", dim: "density", value: 998, unit: "kg/m3", min: 0 },
    { id: "v", label: L("Mean velocity", "السرعة المتوسطة"), sym: "v", dim: "velocity", value: 1.5, unit: "m/s", min: 0 },
    { id: "D", label: L("Inside diameter", "القطر الداخلي"), sym: "D", dim: "length", value: 50, unit: "mm", min: 0 },
    { id: "mu", label: L("Dynamic viscosity", "اللزوجة الديناميكية"), sym: "\\mu", dim: "viscosity", value: 1.0, unit: "cP", min: 0 },
  ],
  compute({ rho, v, D, mu }) {
    if (!(mu > 0 && D > 0)) throw new InputError(L("Viscosity and diameter must be positive.", "يجب أن تكون اللزوجة والقطر موجبين."));
    const Re = (rho * v * D) / mu, rg = regimeText(Re);
    return {
      results: [{ id: "Re", label: L("Reynolds number", "عدد رينولدز"), sym: "Re", value: Re, dim: "none", unit: "-", main: true }],
      steps: [
        { text: L("Definition, all quantities in SI units", "التعريف، بوحدات النظام الدولي"), tex: `Re=\\frac{\\rho\\,v\\,D}{\\mu}=\\frac{${tex(rho)}\\times${tex(v)}\\times${tex(D)}}{${tex(mu)}}=${tex(Re)}` },
        { text: L(`Regime: ${rg.en} (laminar below 2300, turbulent above 4000)`, `نوع الجريان: ${rg.ar} (طبقي دون 2300، مضطرب فوق 4000)`), tex: `Re=${tex(Re)}\\;\\Rightarrow\\;\\text{${rg.en}}` },
      ],
      notes: regimeNote(Re),
    };
  },
  references: ["Bird, Stewart & Lightfoot, Transport Phenomena, 2nd ed., §2.2"],
};

export const friction: Tool = {
  id: "friction", category: "fluid",
  name: L("Darcy friction factor", "معامل احتكاك دارسي"),
  summary: L("Laminar 64/Re or the Colebrook–White equation, solved iteratively.", "‏64/Re للجريان الطبقي أو معادلة كولبروك-وايت بالحل التكراري."),
  inputs: [
    { id: "Re", label: L("Reynolds number", "عدد رينولدز"), sym: "Re", dim: "none", value: 100000, unit: "-", min: 1 },
    { id: "eps", label: L("Pipe roughness", "خشونة الأنبوب"), sym: "\\varepsilon", dim: "length", value: 0.045, unit: "mm", min: 0, hint: L("Commercial steel ≈ 0.045 mm, drawn tubing ≈ 0.0015 mm, cast iron ≈ 0.26 mm", "الفولاذ التجاري ≈ 0.045 مم، الأنابيب المسحوبة ≈ 0.0015 مم، الحديد الزهر ≈ 0.26 مم") },
    { id: "D", label: L("Inside diameter", "القطر الداخلي"), sym: "D", dim: "length", value: 50, unit: "mm", min: 0 },
  ],
  compute({ Re, eps, D }) {
    if (!(Re > 0 && D > 0)) throw new InputError(L("Re and diameter must be positive.", "يجب أن يكون Re والقطر موجبين."));
    const rr = eps / D, r = darcyF(Re, rr);
    const steps = r.method === "laminar"
      ? [{ text: L("Laminar flow (Re < 2300): Hagen–Poiseuille", "جريان طبقي (Re < 2300): هاغن-بوازوي"), tex: `f=\\frac{64}{Re}=\\frac{64}{${tex(Re)}}=${tex(r.f)}` }]
      : [
          { text: L("Relative roughness", "الخشونة النسبية"), tex: `\\frac{\\varepsilon}{D}=\\frac{${tex(eps)}}{${tex(D)}}=${tex(rr)}` },
          { text: L("Starting guess: Swamee–Jain explicit formula", "التقدير الأولي: صيغة سوامي-جين الصريحة"), tex: `f_0=\\frac{0.25}{\\left[\\log_{10}\\left(\\frac{\\varepsilon/D}{3.7}+\\frac{5.74}{Re^{0.9}}\\right)\\right]^2}=${tex(swameeJain(Re, rr), 5)}` },
          { text: L(`Colebrook–White, iterated to convergence (${r.iters.length - 1} iterations)`, `كولبروك-وايت حتى التقارب (${r.iters.length - 1} تكرارات)`), tex: `\\frac{1}{\\sqrt{f}}=-2\\log_{10}\\left(\\frac{\\varepsilon/D}{3.7}+\\frac{2.51}{Re\\sqrt{f}}\\right)\\;\\Rightarrow\\;f=${tex(r.f, 5)}` },
        ];
    return {
      results: [
        { id: "f", label: L("Darcy friction factor", "معامل احتكاك دارسي"), sym: "f", value: r.f, dim: "none", unit: "-", main: true },
        { id: "fF", label: L("Fanning friction factor (f/4)", "معامل فانينغ (f/4)"), sym: "f_F", value: r.f / 4, dim: "none", unit: "-" },
      ],
      steps, notes: regimeNote(Re),
    };
  },
  references: ["Colebrook, C.F. (1939) J. Inst. Civil Eng. 11, 133", "Swamee, P.K. & Jain, A.K. (1976) J. Hydraulics Div. ASCE 102, 657"],
};

export const pipeDP: Tool = {
  id: "pipe-dp", category: "fluid",
  name: L("Pipe pressure drop", "هبوط الضغط في الأنابيب"),
  summary: L("Darcy–Weisbach with Colebrook friction and minor losses (fittings).", "معادلة دارسي-وايسباخ مع احتكاك كولبروك والفواقد الثانوية (الوصلات)."),
  inputs: [
    { id: "Q", label: L("Volumetric flow rate", "معدل التدفق الحجمي"), sym: "Q", dim: "volFlow", value: 10, unit: "m3/h", min: 0 },
    { id: "D", label: L("Inside diameter", "القطر الداخلي"), sym: "D", dim: "length", value: 50, unit: "mm", min: 0 },
    { id: "Lp", label: L("Pipe length", "طول الأنبوب"), sym: "L", dim: "length", value: 100, unit: "m", min: 0 },
    { id: "eps", label: L("Pipe roughness", "خشونة الأنبوب"), sym: "\\varepsilon", dim: "length", value: 0.045, unit: "mm", min: 0 },
    { id: "rho", label: L("Density", "الكثافة"), sym: "\\rho", dim: "density", value: 998, unit: "kg/m3", min: 0 },
    { id: "mu", label: L("Dynamic viscosity", "اللزوجة الديناميكية"), sym: "\\mu", dim: "viscosity", value: 1.0, unit: "cP", min: 0 },
    { id: "K", label: L("Sum of fitting loss coefficients ΣK", "مجموع معاملات فواقد الوصلات ΣK"), sym: "\\Sigma K", dim: "none", value: 2, unit: "-", min: 0, hint: L("90° elbow ≈ 0.75, open gate valve ≈ 0.2, sharp entrance 0.5, exit 1.0", "كوع 90° ≈ 0.75، صمام بوابي مفتوح ≈ 0.2، مدخل حاد 0.5، مخرج 1.0") },
  ],
  compute({ Q, D, Lp, eps, rho, mu, K }) {
    if (!(D > 0 && mu > 0 && rho > 0)) throw new InputError(L("Diameter, density and viscosity must be positive.", "يجب أن يكون القطر والكثافة واللزوجة موجبة."));
    const A = (Math.PI * D * D) / 4, v = Q / A, Re = (rho * v * D) / mu;
    const { f } = darcyF(Re, eps / D);
    const dyn = (rho * v * v) / 2, dPf = f * (Lp / D) * dyn, dPm = K * dyn, dP = dPf + dPm, hL = dP / (rho * G);
    return {
      results: [
        { id: "dP", label: L("Total pressure drop", "هبوط الضغط الكلي"), sym: "\\Delta P", value: dP, dim: "pressure", unit: "kPa", main: true },
        { id: "hL", label: L("Head loss", "فاقد الضاغط"), sym: "h_L", value: hL, dim: "length", unit: "m", main: true },
        { id: "v", label: L("Mean velocity", "السرعة المتوسطة"), sym: "v", value: v, dim: "velocity", unit: "m/s" },
        { id: "Re", label: L("Reynolds number", "عدد رينولدز"), sym: "Re", value: Re, dim: "none", unit: "-" },
        { id: "f", label: L("Darcy friction factor", "معامل احتكاك دارسي"), sym: "f", value: f, dim: "none", unit: "-" },
        { id: "dPf", label: L("Straight-pipe friction", "احتكاك الأنبوب المستقيم"), sym: "\\Delta P_f", value: dPf, dim: "pressure", unit: "kPa" },
        { id: "dPm", label: L("Fittings (minor losses)", "الوصلات (فواقد ثانوية)"), sym: "\\Delta P_m", value: dPm, dim: "pressure", unit: "kPa" },
      ],
      steps: [
        { text: L("Mean velocity from the flow rate", "السرعة المتوسطة من معدل التدفق"), tex: `v=\\frac{4Q}{\\pi D^2}=\\frac{4\\times${tex(Q)}}{\\pi\\times${tex(D)}^2}=${tex(v)}\\;\\text{m/s}` },
        { text: L("Reynolds number", "عدد رينولدز"), tex: `Re=\\frac{\\rho vD}{\\mu}=${tex(Re)}` },
        { text: L("Friction factor (64/Re or Colebrook)", "معامل الاحتكاك (64/Re أو كولبروك)"), tex: `f=${tex(f, 5)}` },
        { text: L("Darcy–Weisbach for the straight pipe", "دارسي-وايسباخ للأنبوب المستقيم"), tex: `\\Delta P_f=f\\,\\frac{L}{D}\\,\\frac{\\rho v^2}{2}=${tex(f, 5)}\\times\\frac{${tex(Lp)}}{${tex(D)}}\\times\\frac{${tex(rho)}\\times${tex(v)}^2}{2}=${tex(dPf)}\\;\\text{Pa}` },
        { text: L("Minor losses from fittings", "الفواقد الثانوية من الوصلات"), tex: `\\Delta P_m=\\Sigma K\\,\\frac{\\rho v^2}{2}=${tex(K)}\\times${tex(dyn)}=${tex(dPm)}\\;\\text{Pa}` },
        { text: L("Total, and as a head of fluid", "الإجمالي، وكارتفاع عمود من المائع"), tex: `\\Delta P=${tex(dP)}\\;\\text{Pa},\\qquad h_L=\\frac{\\Delta P}{\\rho g}=${tex(hL)}\\;\\text{m}` },
      ],
      notes: [...regimeNote(Re), ...(v > 3 ? [{ kind: "info" as const, text: L("Velocity above ~3 m/s: typical liquid lines are sized for 1–3 m/s.", "السرعة أعلى من 3 م/ث تقريبًا: تُصمَّم خطوط السوائل عادةً لسرعة 1–3 م/ث.") }] : [])],
    };
  },
  references: ["Darcy–Weisbach equation", "Crane Co., Technical Paper No. 410 (fitting K values)"],
};

export const pump: Tool = {
  id: "pump", category: "fluid",
  name: L("Pump power", "قدرة المضخة"),
  summary: L("Hydraulic and shaft power from flow rate, pressure rise and efficiency.", "القدرة الهيدروليكية وقدرة العمود من التدفق وارتفاع الضغط والكفاءة."),
  inputs: [
    { id: "Q", label: L("Volumetric flow rate", "معدل التدفق الحجمي"), sym: "Q", dim: "volFlow", value: 10, unit: "m3/h", min: 0 },
    { id: "dP", label: L("Pressure rise", "ارتفاع الضغط"), sym: "\\Delta P", dim: "pressure", value: 3, unit: "bar", min: 0 },
    { id: "rho", label: L("Density", "الكثافة"), sym: "\\rho", dim: "density", value: 998, unit: "kg/m3", min: 0 },
    { id: "eta", label: L("Pump efficiency", "كفاءة المضخة"), sym: "\\eta", dim: "none", value: 0.7, unit: "-", min: 0.01, max: 1, hint: L("As a fraction, e.g. 0.70", "ككسر عشري، مثل 0.70") },
  ],
  compute({ Q, dP, rho, eta }) {
    if (!(eta > 0 && eta <= 1)) throw new InputError(L("Efficiency must be between 0 and 1.", "يجب أن تكون الكفاءة بين 0 و1."));
    const Ph = Q * dP, Ps = Ph / eta, H = dP / (rho * G);
    return {
      results: [
        { id: "Ps", label: L("Shaft (brake) power", "قدرة العمود"), sym: "P_{shaft}", value: Ps, dim: "power", unit: "kW", main: true },
        { id: "Ph", label: L("Hydraulic power", "القدرة الهيدروليكية"), sym: "P_{hyd}", value: Ph, dim: "power", unit: "kW" },
        { id: "H", label: L("Pump head", "ضاغط المضخة"), sym: "H", value: H, dim: "length", unit: "m" },
      ],
      steps: [
        { text: L("Hydraulic power delivered to the fluid", "القدرة الهيدروليكية المنقولة إلى المائع"), tex: `P_{hyd}=Q\\,\\Delta P=${tex(Q)}\\times${tex(dP)}=${tex(Ph)}\\;\\text{W}` },
        { text: L("Shaft power drawn by the pump", "القدرة التي يسحبها عمود المضخة"), tex: `P_{shaft}=\\frac{P_{hyd}}{\\eta}=\\frac{${tex(Ph)}}{${tex(eta)}}=${tex(Ps)}\\;\\text{W}` },
        { text: L("Equivalent head", "الضاغط المكافئ"), tex: `H=\\frac{\\Delta P}{\\rho g}=\\frac{${tex(dP)}}{${tex(rho)}\\times9.807}=${tex(H)}\\;\\text{m}` },
      ],
    };
  },
  references: ["McCabe, Smith & Harriott, Unit Operations of Chemical Engineering, ch. 8"],
};
