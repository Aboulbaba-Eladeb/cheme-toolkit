// Antoine equation  log10(P / mmHg) = A − B / (T / °C + C)
// Constants as tabulated in Felder & Rousseau, "Elementary Principles of Chemical Processes", Table B.4.
// `tb` is the literature normal boiling point (°C), used to check the constants.

export interface AntoineCompound { id: string; name: { en: string; ar: string }; formula: string; A: number; B: number; C: number; tmin: number; tmax: number; tb: number }

export const ANTOINE: AntoineCompound[] = [
  { id: "water", name: { en: "Water", ar: "الماء" }, formula: "H₂O", A: 7.96681, B: 1668.21, C: 228.0, tmin: 60, tmax: 150, tb: 100.0 },
  { id: "water-low", name: { en: "Water (0–60 °C)", ar: "الماء (0–60 °م)" }, formula: "H₂O", A: 8.10765, B: 1750.286, C: 235.0, tmin: 0, tmax: 60, tb: 100.0 },
  { id: "methanol", name: { en: "Methanol", ar: "الميثانول" }, formula: "CH₃OH", A: 7.87863, B: 1473.11, C: 230.0, tmin: -16, tmax: 91, tb: 64.7 },
  { id: "ethanol", name: { en: "Ethanol", ar: "الإيثانول" }, formula: "C₂H₅OH", A: 8.11220, B: 1592.864, C: 226.184, tmin: 20, tmax: 93, tb: 78.3 },
  { id: "acetone", name: { en: "Acetone", ar: "الأسيتون" }, formula: "C₃H₆O", A: 7.11714, B: 1210.595, C: 229.664, tmin: -13, tmax: 55, tb: 56.1 },
  { id: "benzene", name: { en: "Benzene", ar: "البنزين العطري" }, formula: "C₆H₆", A: 6.89272, B: 1203.531, C: 219.888, tmin: 14.5, tmax: 80.9, tb: 80.1 },
  { id: "toluene", name: { en: "Toluene", ar: "التولوين" }, formula: "C₇H₈", A: 6.95805, B: 1346.773, C: 219.693, tmin: 6, tmax: 137, tb: 110.6 },
  { id: "n-hexane", name: { en: "n-Hexane", ar: "الهكسان" }, formula: "C₆H₁₄", A: 6.88555, B: 1175.817, C: 224.867, tmin: 13, tmax: 70, tb: 68.7 },
  { id: "n-heptane", name: { en: "n-Heptane", ar: "الهبتان" }, formula: "C₇H₁₆", A: 6.90253, B: 1267.828, C: 216.823, tmin: 25, tmax: 99, tb: 98.4 },
  { id: "n-pentane", name: { en: "n-Pentane", ar: "البنتان" }, formula: "C₅H₁₂", A: 6.84471, B: 1060.793, C: 231.541, tmin: 13, tmax: 36, tb: 36.1 },
  { id: "cyclohexane", name: { en: "Cyclohexane", ar: "الهكسان الحلقي" }, formula: "C₆H₁₂", A: 6.84498, B: 1203.526, C: 222.863, tmin: 20, tmax: 81, tb: 80.7 },
  { id: "chloroform", name: { en: "Chloroform", ar: "الكلوروفورم" }, formula: "CHCl₃", A: 6.90328, B: 1163.03, C: 227.4, tmin: -30, tmax: 150, tb: 61.2 },
  { id: "ethyl-acetate", name: { en: "Ethyl acetate", ar: "أسيتات الإيثيل" }, formula: "C₄H₈O₂", A: 7.10179, B: 1244.951, C: 217.881, tmin: 16, tmax: 76, tb: 77.1 },
  { id: "acetic-acid", name: { en: "Acetic acid", ar: "حمض الخليك" }, formula: "CH₃COOH", A: 7.38782, B: 1533.313, C: 222.309, tmin: 29.8, tmax: 126.5, tb: 118.1 },
  { id: "o-xylene", name: { en: "o-Xylene", ar: "الأورثو-زايلين" }, formula: "C₈H₁₀", A: 6.99891, B: 1474.679, C: 213.686, tmin: 32, tmax: 172, tb: 144.4 },
];

export const antoineP = (c: AntoineCompound, tC: number) => 10 ** (c.A - c.B / (tC + c.C)); // mmHg
export const antoineT = (c: AntoineCompound, pmmHg: number) => c.B / (c.A - Math.log10(pmmHg)) - c.C; // °C
