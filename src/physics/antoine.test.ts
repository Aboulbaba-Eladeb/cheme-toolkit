import { describe, expect, it } from "vitest";
import { ANTOINE, antoineP, antoineT } from "./antoine";

describe("Antoine constants reproduce the normal boiling point (760 mmHg)", () => {
  it.each(ANTOINE.map(c => [c.id, c] as const))("%s", (_id, c) => {
    expect(Math.abs(antoineT(c, 760) - c.tb)).toBeLessThan(1.0);
  });
  it("P and T are inverse functions", () => {
    for (const c of ANTOINE) {
      const t = (c.tmin + c.tmax) / 2;
      expect(antoineT(c, antoineP(c, t))).toBeCloseTo(t, 8);
    }
  });
});
