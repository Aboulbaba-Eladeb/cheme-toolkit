// Unit-aware expression calculator built on mathjs, with a few chemical-engineering additions.
import { create, all, type MathJsInstance, type Unit } from "mathjs";

const math: MathJsInstance = create(all, {});
math.createUnit({
  P: { definition: "0.1 Pa s", aliases: ["poise"] },
  cP: { definition: "0.001 Pa s", aliases: ["centipoise"] },
  gpm: "1 gal/minute",
  scfm: "1 ft^3/minute",
}, { override: false });

/** "min" is mathjs's minimum function; read it as minutes unless it is called like min(…). */
export const normalise = (expr: string) => expr.replace(/\bmin\b(?!\s*\()/g, "minute").replace(/°C/g, "degC").replace(/°F/g, "degF").replace(/×/g, "*").replace(/÷/g, "/");

export interface CalcResult { text: string; si?: string }

export function evaluate(expr: string): CalcResult {
  const r = math.evaluate(normalise(expr));
  if (r && typeof r === "object" && "toSI" in r) {
    const u = r as Unit;
    let si: string | undefined;
    try { const s = u.toSI(); si = math.format(s, { precision: 6 }); } catch { si = undefined; }
    const text = math.format(u, { precision: 6 });
    return { text, si: si && si !== text ? si : undefined };
  }
  if (typeof r === "function") throw new Error("That is a function name; call it with arguments, e.g. sqrt(2).");
  return { text: math.format(r, { precision: 10 }) };
}

export const EXAMPLES = [
  "2.5 bar * 30 L/min to kW",
  "998 kg/m^3 * 1.5 m/s * 50 mm / (1 cP)",
  "gasConstant * 298 K / (101.325 kPa) to L/mol",
  "100 gpm to m^3/h",
  "25 degC to degF",
  "350 kPa to psi",
  "0.5 * 1000 kg/m^3 * (2 m/s)^2 to kPa",
  "3 hp to kW",
];
