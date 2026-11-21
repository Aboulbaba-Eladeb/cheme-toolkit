import { describe, expect, it } from "vitest";
import { TOOLS, toolById } from "./index";
import { toSI } from "../core/units";
import type { Tool } from "../core/types";

/** Run a tool with its defaults, optionally overriding inputs (given in each input's default unit) and choices. */
function run(t: Tool, over: Record<string, number> = {}, choice: Record<string, string> = {}) {
  const si: Record<string, number> = {};
  for (const i of t.inputs) si[i.id] = toSI(over[i.id] ?? i.value, i.dim, i.unit);
  const ch: Record<string, string> = {};
  for (const c of t.choices ?? []) ch[c.id] = choice[c.id] ?? c.value;
  return t.compute(si, ch, t.table?.rows);
}

describe("every tool runs with its defaults and every choice", () => {
  for (const t of TOOLS) {
    const combos = (t.choices ?? []).reduce<Record<string, string>[]>((acc, c) => acc.flatMap(a => c.options.map(o => ({ ...a, [c.id]: o.value }))), [{}]);
    for (const combo of combos) {
      it(`${t.id} ${JSON.stringify(combo)}`, () => {
        const out = run(t, {}, combo);
        expect(out.results.length).toBeGreaterThan(0);
        expect(out.steps.length).toBeGreaterThan(0);
        for (const r of out.results) expect(Number.isFinite(r.value), `${t.id}.${r.id}`).toBe(true);
      });
    }
  }
});

describe("cross-checks", () => {
  it("steam at 100 °C: psat = 1.0142 bar, hfg = 2256.5 kJ/kg", () => {
    const out = run(toolById("steam")!, { T: 100 }, { given: "T" });
    expect(out.results.find(r => r.id === "p")!.value / 1e5).toBeCloseTo(1.0142, 3);
    expect(out.results.find(r => r.id === "hfg")!.value / 1e3).toBeCloseTo(2256.5, 0);
  });
  it("Arrhenius: k2 from Ea, then Ea from k2, gives the same Ea", () => {
    const t = toolById("arrhenius")!;
    const k2 = run(t, { Ea: 75 }, { solve: "k2" }).results[0].value;
    const Ea = run(t, { k2 }, { solve: "Ea" }).results[0].value;
    expect(Ea / 1000).toBeCloseTo(75, 6);
  });
  it("ε-NTU: hot-side and cold-side duties balance", () => {
    const t = toolById("ntu")!, out = run(t);
    const Q = out.results.find(r => r.id === "Q")!.value;
    const Tho = out.results.find(r => r.id === "Tho")!.value, Tco = out.results.find(r => r.id === "Tco")!.value;
    expect(2 * 2100 * (433.15 - Tho)).toBeCloseTo(Q, 3);
    expect(1.5 * 4180 * (Tco - 298.15)).toBeCloseTo(Q, 3);
  });
  it("pipe ΔP default case matches a hand calculation", () => {
    // 10 m³/h water in 50 mm pipe: v = 1.415 m/s, Re ≈ 70 470
    const out = run(toolById("pipe-dp")!);
    expect(out.results.find(r => r.id === "v")!.value).toBeCloseTo(1.4147, 3);
    expect(out.results.find(r => r.id === "Re")!.value).toBeCloseTo(70590, -2);
  });
  it("LMTD default: 69.52 K and A = Q/(U·LMTD)", () => {
    const out = run(toolById("lmtd")!);
    expect(out.results.find(r => r.id === "lmtd")!.value).toBeCloseTo(69.52, 2);
    expect(out.results.find(r => r.id === "A")!.value).toBeCloseTo(250e3 / (500 * 69.52), 1);
  });
  it("ideal gas: 1 mol at 0 °C and 1 atm occupies 22.41 L", () => {
    const out = run(toolById("ideal-gas")!, {}, { solve: "V" });
    expect(out.results[0].value * 1000).toBeCloseTo(22.414, 2);
  });
});
