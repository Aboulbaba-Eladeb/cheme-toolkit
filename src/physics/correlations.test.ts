// Reference values from standard textbooks / the Moody chart / the ASHRAE psychrometric chart.
import { describe, expect, it } from "vitest";
import { colebrook, darcyF, dittusBoelter, gnielinski, lmtd, effectiveness, psychro, rachfordRice } from "./correlations";

describe("friction factor", () => {
  it("laminar f = 64/Re", () => expect(darcyF(1000, 0).f).toBeCloseTo(0.064, 10));
  it("Colebrook, Re = 1e5, ε/D = 1e-4 → f ≈ 0.0185 (Moody)", () => expect(colebrook(1e5, 1e-4).f).toBeCloseTo(0.01851, 4));
  it("Colebrook, smooth pipe Re = 1e5 → f ≈ 0.0180", () => expect(colebrook(1e5, 0).f).toBeCloseTo(0.01799, 4));
  it("Colebrook satisfies its own equation", () => {
    const { f } = colebrook(5e5, 2e-3);
    expect(1 / Math.sqrt(f)).toBeCloseTo(-2 * Math.log10(2e-3 / 3.7 + 2.51 / (5e5 * Math.sqrt(f))), 10);
  });
});

describe("tube convection", () => {
  it("Dittus–Boelter, Re = 1e4, Pr = 0.7, heating → Nu = 0.023·1584.9·0.8669 = 31.61 (hand calc)", () => expect(dittusBoelter(1e4, 0.7, true)).toBeCloseTo(31.61, 2));
  it("Gnielinski, Re = 1e4, Pr = 0.7 → f = 0.03148, Nu = 29.82 (hand calc)", () => { const g = gnielinski(1e4, 0.7); expect(g.f).toBeCloseTo(0.03148, 5); expect(g.Nu).toBeCloseTo(29.82, 2); });
});

describe("heat exchangers", () => {
  it("LMTD of 80 K and 60 K is 69.52 K", () => expect(lmtd(80, 60)).toBeCloseTo(69.52, 2));
  it("LMTD with equal ΔT is that ΔT", () => expect(lmtd(40, 40)).toBe(40));
  it("counter-flow ε for NTU = 2, Cr = 0.5 is 0.7746", () => expect(effectiveness(2, 0.5, "counter")).toBeCloseTo(0.7746, 4));
  it("counter-flow ε for Cr = 1 is NTU/(1+NTU)", () => expect(effectiveness(3, 1, "counter")).toBeCloseTo(0.75, 10));
  it("parallel-flow ε for NTU = 1, Cr = 1 is 0.4323", () => expect(effectiveness(1, 1, "parallel")).toBeCloseTo(0.4323, 4));
});

describe("psychrometrics at 101.325 kPa", () => {
  const r = psychro(25, 0.5, 101325);
  it("W ≈ 0.00988 kg/kg", () => expect(r.W).toBeCloseTo(0.00988, 4));
  it("h ≈ 50.3 kJ/kg", () => expect(r.h).toBeCloseTo(50.3, 0));
  it("dew point ≈ 13.9 °C", () => expect(r.dew).toBeCloseTo(13.9, 0));
});

describe("Rachford–Rice flash", () => {
  const z = [0.4, 0.35, 0.25], K = [2.5, 0.9, 0.2];
  const r = rachfordRice(z, K);
  it("two-phase", () => expect(r.state).toBe("two-phase"));
  it("Σx = Σy = 1", () => {
    expect(r.x.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(r.y.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });
  it("component balance z = (1−ψ)x + ψy", () => z.forEach((zi, i) => expect((1 - r.psi) * r.x[i] + r.psi * r.y[i]).toBeCloseTo(zi, 10)));
  it("all liquid when Σ zK ≤ 1", () => expect(rachfordRice([0.5, 0.5], [0.5, 0.9]).state).toBe("subcooled"));
});
