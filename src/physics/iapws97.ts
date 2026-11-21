// IAPWS-IF97 industrial formulation for water and steam: regions 1 (liquid), 2 (vapour) and 4 (saturation).
// Units here follow the standard: p in MPa, T in K, v in m³/kg, h and u in kJ/kg, s and cp in kJ/(kg·K).
// Reference: IAPWS R7-97(2012), Revised Release on the IAPWS Industrial Formulation 1997.

export const R = 0.461526; // kJ/(kg·K), specific gas constant of water in IF97
export const T_TRIPLE = 273.16, T_CRIT = 647.096, P_CRIT = 22.064;

/* ---------- region 4: saturation line ---------- */
const n4 = [0.11670521452767e4, -0.72421316703206e6, -0.17073846940092e2, 0.12020824702470e5, -0.32325550322333e7,
  0.14915108613530e2, -0.48232657361591e4, 0.40511340542057e6, -0.23855557567849, 0.65017534844798e3];

/** Saturation pressure (MPa) at temperature T (K), 273.15 ≤ T ≤ 647.096 K. */
export function psat(T: number): number {
  const th = T + n4[8] / (T - n4[9]);
  const A = th * th + n4[0] * th + n4[1];
  const B = n4[2] * th * th + n4[3] * th + n4[4];
  const C = n4[5] * th * th + n4[6] * th + n4[7];
  return Math.pow((2 * C) / (-B + Math.sqrt(B * B - 4 * A * C)), 4);
}

/** Saturation temperature (K) at pressure p (MPa), 611.213 Pa ≤ p ≤ 22.064 MPa. */
export function tsat(p: number): number {
  const b = Math.pow(p, 0.25);
  const E = b * b + n4[2] * b + n4[5];
  const F = n4[0] * b * b + n4[3] * b + n4[6];
  const G = n4[1] * b * b + n4[4] * b + n4[7];
  const D = (2 * G) / (-F - Math.sqrt(F * F - 4 * E * G));
  return (n4[9] + D - Math.sqrt((n4[9] + D) ** 2 - 4 * (n4[8] + n4[9] * D))) / 2;
}

export interface Props { v: number; h: number; u: number; s: number; cp: number }

/* ---------- region 1: compressed liquid ---------- */
const I1 = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 8, 8, 21, 23, 29, 30, 31, 32];
const J1 = [-2, -1, 0, 1, 2, 3, 4, 5, -9, -7, -1, 0, 1, 3, -3, 0, 1, 3, 17, -4, 0, 6, -5, -2, 10, -8, -11, -6, -29, -31, -38, -39, -40, -41];
const n1 = [0.14632971213167, -0.84548187169114, -0.37563603672040e1, 0.33855169168385e1, -0.95791963387872, 0.15772038513228,
  -0.16616417199501e-1, 0.81214629983568e-3, 0.28319080123804e-3, -0.60706301565874e-3, -0.18990068218419e-1, -0.32529748770505e-1,
  -0.21841717175414e-1, -0.52838357969930e-4, -0.47184321073267e-3, -0.30001780793026e-3, 0.47661393906987e-4, -0.44141845330846e-5,
  -0.72694996297594e-15, -0.31679644845054e-4, -0.28270797985312e-5, -0.85205128120103e-9, -0.22425281908000e-5, -0.65171222895601e-6,
  -0.14341729937924e-12, -0.40516996860117e-6, -0.12734301741641e-8, -0.17424871230634e-9, -0.68762131295531e-18, 0.14478307828521e-19,
  0.26335781662795e-22, -0.11947622640071e-22, 0.18228094581404e-23, -0.93537087292458e-25];

export function region1(p: number, T: number): Props {
  const pi = p / 16.53, tau = 1386 / T, a = 7.1 - pi, b = tau - 1.222;
  let g = 0, gp = 0, gt = 0, gpp = 0, gtt = 0, gpt = 0;
  for (let i = 0; i < 34; i++) {
    const I = I1[i], J = J1[i], n = n1[i];
    g += n * a ** I * b ** J;
    gp += -n * I * a ** (I - 1) * b ** J;
    gt += n * a ** I * J * b ** (J - 1);
    gpp += n * I * (I - 1) * a ** (I - 2) * b ** J;
    gtt += n * a ** I * J * (J - 1) * b ** (J - 2);
    gpt += -n * I * a ** (I - 1) * J * b ** (J - 1);
  }
  void gpp; void gpt;
  const RT = R * T;
  return { v: (pi * gp * RT) / (p * 1000), h: tau * gt * RT, u: RT * (tau * gt - pi * gp), s: R * (tau * gt - g), cp: -R * tau * tau * gtt };
}

/* ---------- region 2: superheated vapour ---------- */
const J0 = [0, 1, -5, -4, -3, -2, -1, 2, 3];
const n0 = [-0.96927686500217e1, 0.10086655968018e2, -0.56087911283020e-2, 0.71452738081455e-1, -0.40710498223928, 0.14240819171444e1,
  -0.43839511319450e1, -0.28408632460772, 0.21268463753307e-1];
const I2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9, 10, 10, 10, 16, 16, 18, 20, 20, 20, 21, 22, 23, 24, 24, 24];
const J2 = [0, 1, 2, 3, 6, 1, 2, 4, 7, 36, 0, 1, 3, 6, 35, 1, 2, 3, 7, 3, 16, 35, 0, 11, 25, 8, 36, 13, 4, 10, 14, 29, 50, 57, 20, 35, 48, 21, 53, 39, 26, 40, 58];
const n2 = [-0.17731742473213e-2, -0.17834862292358e-1, -0.45996013696365e-1, -0.57581259083432e-1, -0.50325278727930e-1, -0.33032641670203e-4,
  -0.18948987516315e-3, -0.39392777243355e-2, -0.43797295650573e-1, -0.26674547914087e-4, 0.20481737692309e-7, 0.43870667284435e-6,
  -0.32277677238570e-4, -0.15033924542148e-2, -0.40668253562649e-1, -0.78847309559367e-9, 0.12790717852285e-7, 0.48225372718507e-6,
  0.22922076337661e-5, -0.16714766451061e-10, -0.21171472321355e-2, -0.23895741934104e2, -0.59059564324270e-17, -0.12621808899101e-5,
  -0.38946842435739e-1, 0.11256211360459e-10, -0.82311340897998e1, 0.19809712802088e-7, 0.10406965210174e-18, -0.10234747095929e-12,
  -0.10018179379511e-8, -0.80882908646985e-10, 0.10693031879409, -0.33662250574171, 0.89185845355421e-24, 0.30629316876232e-12,
  -0.42002467698208e-5, -0.59056029685639e-25, 0.37826947613457e-5, -0.12768608934681e-14, 0.73087610595061e-28, 0.55414715350778e-16,
  -0.94369707241210e-6];

export function region2(p: number, T: number): Props {
  const pi = p, tau = 540 / T, b = tau - 0.5;
  let g0 = Math.log(pi), g0t = 0, g0tt = 0;
  for (let i = 0; i < 9; i++) { g0 += n0[i] * tau ** J0[i]; g0t += n0[i] * J0[i] * tau ** (J0[i] - 1); g0tt += n0[i] * J0[i] * (J0[i] - 1) * tau ** (J0[i] - 2); }
  const g0p = 1 / pi;
  let gr = 0, grp = 0, grt = 0, grtt = 0;
  for (let i = 0; i < 43; i++) {
    const I = I2[i], J = J2[i], n = n2[i];
    gr += n * pi ** I * b ** J;
    grp += n * I * pi ** (I - 1) * b ** J;
    grt += n * pi ** I * J * b ** (J - 1);
    grtt += n * pi ** I * J * (J - 1) * b ** (J - 2);
  }
  const RT = R * T;
  return {
    v: (pi * (g0p + grp) * RT) / (p * 1000),
    h: tau * (g0t + grt) * RT,
    u: RT * (tau * (g0t + grt) - pi * (g0p + grp)),
    s: R * (tau * (g0t + grt) - (g0 + gr)),
    cp: -R * tau * tau * (g0tt + grtt),
  };
}

/** Saturated liquid and vapour properties. Valid where both regions 1 and 2 meet the line: 273.16 K ≤ T ≤ 623.15 K. */
export function saturation(T: number) {
  const p = psat(T);
  return { T, p, liq: region1(p, T), vap: region2(p, T) };
}
export const T_SAT_MAX = 623.15; // above this, saturation lies in region 3 (not implemented)
