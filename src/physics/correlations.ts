// Fluid flow, heat transfer and psychrometric correlations (SI units throughout).
import { psat, tsat } from "./iapws97";

export const G = 9.80665;          // m/s²
export const R_GAS = 8.314462618;   // J/(mol·K)

/* ---------- friction factor (Darcy) ---------- */
/** Swamee–Jain explicit approximation, used as the starting guess for Colebrook. */
export const swameeJain = (Re: number, rr: number) => 0.25 / Math.log10(rr / 3.7 + 5.74 / Re ** 0.9) ** 2;

/** Colebrook–White, solved by fixed-point iteration on 1/√f. Returns f and the iteration history. */
export function colebrook(Re: number, rr: number): { f: number; iters: number[] } {
  let x = 1 / Math.sqrt(swameeJain(Re, rr));
  const iters: number[] = [1 / (x * x)];
  for (let k = 0; k < 50; k++) {
    const nx = -2 * Math.log10(rr / 3.7 + (2.51 * x) / Re);
    iters.push(1 / (nx * nx));
    if (Math.abs(nx - x) < 1e-12) { x = nx; break; }
    x = nx;
  }
  return { f: 1 / (x * x), iters };
}

export type Regime = "laminar" | "transition" | "turbulent";
export const regime = (Re: number): Regime => (Re < 2300 ? "laminar" : Re < 4000 ? "transition" : "turbulent");

export function darcyF(Re: number, rr: number) {
  if (Re < 2300) return { f: 64 / Re, method: "laminar" as const, iters: [] as number[] };
  const c = colebrook(Re, rr);
  return { f: c.f, method: "colebrook" as const, iters: c.iters };
}

/* ---------- forced convection in tubes ---------- */
export const dittusBoelter = (Re: number, Pr: number, heating: boolean) => 0.023 * Re ** 0.8 * Pr ** (heating ? 0.4 : 0.3);
export function gnielinski(Re: number, Pr: number) {
  const f = (0.79 * Math.log(Re) - 1.64) ** -2; // Petukhov smooth-tube friction factor
  const Nu = ((f / 8) * (Re - 1000) * Pr) / (1 + 12.7 * Math.sqrt(f / 8) * (Pr ** (2 / 3) - 1));
  return { f, Nu };
}

/* ---------- heat exchangers ---------- */
export function lmtd(dT1: number, dT2: number) {
  if (dT1 <= 0 || dT2 <= 0) return NaN;
  return Math.abs(dT1 - dT2) < 1e-9 ? dT1 : (dT1 - dT2) / Math.log(dT1 / dT2);
}
export function effectiveness(NTU: number, Cr: number, flow: "counter" | "parallel") {
  if (flow === "parallel") return (1 - Math.exp(-NTU * (1 + Cr))) / (1 + Cr);
  if (Math.abs(1 - Cr) < 1e-9) return NTU / (1 + NTU);
  const e = Math.exp(-NTU * (1 - Cr));
  return (1 - e) / (1 - Cr * e);
}

/* ---------- moist air (ASHRAE Handbook – Fundamentals, ch. 1) ---------- */
/** Saturation pressure of water over liquid, Pa (IAPWS-IF97, valid 0.01–100+ °C). */
export const pws = (tC: number) => psat(tC + 273.15) * 1e6;
export function psychro(tC: number, RH: number, pPa: number) {
  const pw = RH * pws(tC);
  const W = (0.621945 * pw) / (pPa - pw);                              // kg water / kg dry air
  const h = 1.006 * tC + W * (2501 + 1.86 * tC);                        // kJ/kg dry air
  const v = (0.287042 * (tC + 273.15) * (1 + 1.607858 * W)) / (pPa / 1000); // m³/kg dry air
  // dew point: saturation temperature at the vapour partial pressure (IF97 is valid down to 611.2 Pa ≈ 0 °C)
  const dew = pw >= 611.213 ? tsat(pw / 1e6) - 273.15 : NaN;
  return { pw, pwsat: pws(tC), W, h, v, dew };
}

/* ---------- vapour–liquid flash (Rachford–Rice) ---------- */
export function rachfordRice(z: number[], K: number[]) {
  const sumzK = z.reduce((s, zi, i) => s + zi * K[i], 0);
  const sumzOverK = z.reduce((s, zi, i) => s + zi / K[i], 0);
  if (sumzK <= 1) return { state: "subcooled" as const, psi: 0, x: z.slice(), y: z.map((zi, i) => zi * K[i]), iters: [] as number[] };
  if (sumzOverK <= 1) return { state: "superheated" as const, psi: 1, x: z.map((zi, i) => zi / K[i]), y: z.slice(), iters: [] as number[] };
  const F = (p: number) => z.reduce((s, zi, i) => s + (zi * (K[i] - 1)) / (1 + p * (K[i] - 1)), 0);
  const dF = (p: number) => -z.reduce((s, zi, i) => s + (zi * (K[i] - 1) ** 2) / (1 + p * (K[i] - 1)) ** 2, 0);
  // bracket where all denominators stay positive, then safeguarded Newton
  const kmax = Math.max(...K), kmin = Math.min(...K);
  let lo = Math.max(0, 1 / (1 - kmax)), hi = Math.min(1, 1 / (1 - kmin));
  if (!Number.isFinite(lo) || lo < 0) lo = 0; if (!Number.isFinite(hi) || hi > 1) hi = 1;
  let p = (lo + hi) / 2; const iters: number[] = [p];
  for (let k = 0; k < 100; k++) {
    const f = F(p);
    if (Math.abs(f) < 1e-14) break;
    if (f > 0) lo = p; else hi = p;
    let np = p - f / dF(p);
    if (!(np > lo && np < hi)) np = (lo + hi) / 2;
    iters.push(np);
    if (Math.abs(np - p) < 1e-13) { p = np; break; }
    p = np;
  }
  const x = z.map((zi, i) => zi / (1 + p * (K[i] - 1)));
  return { state: "two-phase" as const, psi: p, x, y: x.map((xi, i) => xi * K[i]), iters };
}
